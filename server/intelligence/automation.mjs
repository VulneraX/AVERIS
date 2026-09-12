import { randomUUID } from "node:crypto";
import { iso, hash } from "./service.mjs";
export function createAutomation(s) {
  function tick() {
    for (const org of s.all("SELECT id FROM organizations")) {
      const config = s.settings(org.id);
      const cutoff = new Date(
        Date.now() - config.retention_days * 86400000,
      ).toISOString();
      s.run(
        "DELETE FROM risk_signals WHERE organization_id=? AND occurred_at<? AND kind!='role_context'",
        org.id,
        cutoff,
      );
      if (!["Assist", "Automate"].includes(config.mode)) continue;
      s.sync(org.id);
      const profiles = s.profiles(org.id);
      const cohorts = s.cohorts(org.id, profiles);
      for (const policy of s.all(
        "SELECT * FROM intervention_policies WHERE organization_id=? AND enabled=1 AND approved_by IS NOT NULL",
        org.id,
      )) {
        if (
          !s.one(
            "SELECT 1 FROM users WHERE id=? AND organization_id=? AND active=1 AND role IN ('super_admin','admin')",
            policy.approved_by,
            org.id,
          )
        )
          continue;
        const cohort = cohorts.find((c) => c.id === policy.cohort_id);
        if (!cohort) continue;
        for (const userId of cohort.userIds) {
          const profile = profiles.find((u) => u.id === userId);
          const evidence = profile.ledger.filter(
            (e) =>
              e.verified &&
              e.topic === policy.topic &&
              [
                "simulation_clicked",
                "unsafe_sharing",
                "knowledge_assessed",
              ].includes(e.kind) &&
              (e.kind !== "knowledge_assessed" || e.value < 80),
          );
          if (evidence.length < 2) continue;
          const last = s
            .all(
              "SELECT * FROM intelligence_decisions WHERE organization_id=? AND policy_id=? ORDER BY created_at DESC",
              org.id,
              policy.id,
            )
            .find((d) => JSON.parse(d.user_ids_json).includes(userId));
          if (last && !policy.continuous) continue;
          const cadence = Math.max(
            policy.cadence_days,
            profile.plan.cadenceDays,
          );
          if (
            last &&
            new Date(last.created_at) >
              new Date(Date.now() - cadence * 86400000)
          )
            continue;
          const key = hash(
            `policy:${policy.id}:${policy.version}:${userId}:${evidence
              .map((e) => e.id)
              .sort()
              .join(":")}`,
          );
          if (
            s.one(
              "SELECT 1 FROM intervention_steps WHERE organization_id=? AND decision_id=?",
              org.id,
              key,
            ) ||
            s.one(
              "SELECT 1 FROM intelligence_decisions WHERE organization_id=? AND recommendation_key=?",
              org.id,
              key,
            )
          )
            continue;
          const request = {
            key,
            userIds: [userId],
            kind: policy.action,
            topic: policy.topic,
            evidence: evidence.map((e) => ({ id: e.id, kind: e.kind })),
            observation: `Approved ${policy.name} rule matched ${evidence.length} verified ${policy.topic} signals.`,
            expectedOutcome: profile.plan.outcome,
          };
          s.db.transaction(() => {
            if (config.mode === "Assist") {
              s.run(
                "INSERT INTO intervention_steps(id,organization_id,policy_id,user_id,decision_id,due_at,status,result,updated_at) VALUES (?,?,?,?,?,?,'Prepared',?,?)",
                randomUUID(),
                org.id,
                policy.id,
                userId,
                key,
                iso(),
                JSON.stringify(request),
                iso(),
              );
              s.audit(
                org.id,
                null,
                "Intervention prepared for approval",
                key,
                { policyId: policy.id, userId },
                { mode: "Assist" },
              );
            } else {
              const decision = s.execute(
                org.id,
                policy.approved_by,
                request,
                policy.id,
              );
              s.run(
                "INSERT INTO intervention_steps(id,organization_id,policy_id,user_id,decision_id,due_at,status,updated_at) VALUES (?,?,?,?,?,?,'Waiting',?)",
                randomUUID(),
                org.id,
                policy.id,
                userId,
                decision.id,
                new Date(
                  Date.now() + policy.wait_days * 86400000,
                ).toISOString(),
                iso(),
              );
            }
          })();
        }
      }
      if (config.mode !== "Automate") continue;
      for (const step of s.all(
        "SELECT st.*,p.topic,p.enabled,p.wait_days,p.approved_by FROM intervention_steps st JOIN intervention_policies p ON p.id=st.policy_id WHERE st.organization_id=? AND st.status IN ('Waiting','Practice assigned') AND st.due_at<=? AND p.enabled=1",
        org.id,
        iso(),
      )) {
        if (
          !s.one(
            "SELECT 1 FROM users WHERE id=? AND organization_id=? AND active=1",
            step.user_id,
            org.id,
          )
        )
          continue;
        if (
          !s.one(
            "SELECT 1 FROM users WHERE id=? AND organization_id=? AND active=1 AND role IN ('super_admin','admin')",
            step.approved_by,
            org.id,
          )
        )
          continue;
        s.db.transaction(() => {
          if (step.status === "Waiting") {
            const id = s.assignPractice(
              org.id,
              step.user_id,
              step.topic,
              `followup:${step.id}`,
            );
            s.run(
              "UPDATE intervention_steps SET status='Practice assigned',result=?,due_at=?,updated_at=? WHERE id=?",
              id,
              new Date(Date.now() + 7 * 86400000).toISOString(),
              iso(),
              step.id,
            );
            s.audit(
              org.id,
              step.approved_by,
              "Approved follow-up assigned",
              step.id,
              { policyId: step.policy_id },
              { practiceId: id },
            );
          } else {
            const practice = s.one(
              "SELECT * FROM practice_assignments WHERE organization_id=? AND id=?",
              org.id,
              step.result,
            );
            const safe = practice?.reported_at && !practice.clicked_at;
            const status = safe
              ? "Positive behavior"
              : practice?.clicked_at
                ? "Coaching assigned"
                : "Monitor";
            if (practice?.clicked_at)
              s.assignCoaching(
                org.id,
                step.user_id,
                step.topic,
                "A follow-up decision suggests another short coaching moment.",
                `reinforce:${step.id}`,
              );
            s.run(
              "UPDATE intervention_steps SET status=?,updated_at=? WHERE id=?",
              status,
              iso(),
              step.id,
            );
            s.audit(
              org.id,
              step.approved_by,
              "Follow-up evaluated",
              step.id,
              { policyId: step.policy_id },
              { result: status },
            );
          }
        })();
      }
    }
  }
  return { tick };
}
