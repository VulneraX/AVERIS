import { randomUUID, createHash } from "node:crypto";
import {
  replayRisk,
  adaptivePlan,
  cohortMatches,
  ENGINE_VERSION,
  mean,
  inferTopic,
} from "./risk-engine.mjs";
import { coachingContent, simulationDocument } from "./catalog.mjs";
export const iso = () => new Date().toISOString();
export const problem = (status, code, message) => {
  throw Object.assign(new Error(message), { status, code });
};
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function createIntelligenceService(deps) {
  const { db, scoreFor, notify, activate } = deps;
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const settings = (org) =>
    one("SELECT * FROM intelligence_settings WHERE organization_id=?", org) || {
      organization_id: org,
      mode: "Observe",
      minimum_sample: 5,
      retention_days: 365,
      cadence_days: 30,
      ai_enabled: 0,
      version: 1,
    };
  function audit(org, actor, action, entity, input = {}, output = {}) {
    run(
      "INSERT INTO intelligence_audit VALUES (?,?,?,?,?,?,?,?,?)",
      randomUUID(),
      org,
      actor || null,
      action,
      entity || null,
      ENGINE_VERSION,
      JSON.stringify(input),
      JSON.stringify(output),
      iso(),
    );
  }
  function ingest(org, signal) {
    if (
      !one(
        "SELECT 1 FROM users WHERE id=? AND organization_id=? AND active=1",
        signal.userId,
        org,
      )
    )
      problem(
        404,
        "USER_NOT_FOUND",
        "Choose an active employee in your organization.",
      );
    const stamp = iso();
    const key = randomUUID();
    const result = run(
      "INSERT OR IGNORE INTO risk_signals(id,organization_id,user_id,kind,topic,value,source,source_id,description,occurred_at,ingested_at,verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      key,
      org,
      signal.userId,
      signal.kind,
      signal.topic,
      signal.value ?? null,
      signal.source,
      signal.sourceId,
      signal.description,
      signal.occurredAt,
      stamp,
      signal.verified === false ? 0 : 1,
    );
    return result.changes
      ? key
      : one(
          "SELECT id FROM risk_signals WHERE organization_id=? AND user_id=? AND source=? AND source_id=?",
          org,
          signal.userId,
          signal.source,
          signal.sourceId,
        ).id;
  }
  function sync(org) {
    const cutoff = new Date(
      Date.now() - settings(org).retention_days * 86400000,
    ).toISOString();
    db.transaction(() => {
      for (const e of all(
        "SELECT e.* FROM score_events e JOIN users u ON u.id=e.user_id WHERE e.organization_id=? AND e.component='knowledge' AND e.created_at>=? AND u.active=1",
        org,
        cutoff,
      )) {
        const key = ingest(org, {
          userId: e.user_id,
          kind: "knowledge_assessed",
          topic: inferTopic(e.reason),
          value: e.value,
          source: "AVERIS assessment",
          sourceId: e.id,
          description: e.reason,
          occurredAt: e.created_at,
        });
        const invalidated = one(
          "SELECT 1 FROM score_event_invalidations WHERE event_id=? AND restored_at IS NULL",
          e.id,
        );
        run(
          "UPDATE risk_signals SET invalidated=? WHERE id=?",
          invalidated ? 1 : 0,
          key,
        );
      }
      for (const e of all(
        "SELECT e.*,t.organization_id,t.user_id,p.name,p.simulation FROM safe_simulation_events e JOIN simulation_targets t ON t.id=e.target_id JOIN programs p ON p.id=t.program_id JOIN users u ON u.id=t.user_id WHERE t.organization_id=? AND e.event!='opened' AND e.created_at>=? AND u.active=1",
        org,
        cutoff,
      ))
        ingest(org, {
          userId: e.user_id,
          kind:
            e.event === "clicked"
              ? "simulation_clicked"
              : "simulation_reported",
          topic: inferTopic(e.name + " " + e.simulation),
          source: "AVERIS simulation",
          sourceId: e.id,
          description:
            e.event === "clicked"
              ? "Interacted with a controlled simulation."
              : "Reported a controlled simulation.",
          occurredAt: e.created_at,
        });
      // The existing score ledger already deduplicates reviewed reports by reporter/day.
      for (const e of all(
        "SELECT e.* FROM score_events e JOIN users u ON u.id=e.user_id WHERE e.organization_id=? AND e.component='reporting' AND e.source_id LIKE 'confirmed:%' AND e.created_at>=? AND u.active=1",
        org,
        cutoff,
      )) {
        const key = ingest(org, {
          userId: e.user_id,
          kind: "report_confirmed",
          topic: inferTopic(e.reason),
          source: "AVERIS reviewed report",
          sourceId: e.id,
          description: "Reported a message confirmed suspicious by security.",
          occurredAt: e.created_at,
        });
        run(
          "UPDATE risk_signals SET invalidated=? WHERE id=?",
          one(
            "SELECT 1 FROM score_event_invalidations WHERE event_id=? AND restored_at IS NULL",
            e.id,
          )
            ? 1
            : 0,
          key,
        );
      }
      for (const a of all(
        "SELECT a.*,r.document_json FROM learning_assignments a JOIN course_revisions r ON r.id=a.revision_id JOIN users u ON u.id=a.user_id WHERE a.organization_id=? AND a.completed_at>=? AND u.active=1",
        org,
        cutoff,
      ))
        ingest(org, {
          userId: a.user_id,
          kind: "learning_completed",
          topic: inferTopic(
            JSON.parse(a.document_json).category +
              " " +
              JSON.parse(a.document_json).title,
          ),
          source: "AVERIS learning",
          sourceId: a.id,
          description:
            "Completed assigned learning. Behavior change requires follow-up evidence.",
          occurredAt: a.completed_at,
        });
    })();
  }
  function profiles(org) {
    const events = all(
      "SELECT * FROM risk_signals WHERE organization_id=? ORDER BY occurred_at,ingested_at,id",
      org,
    );
    const contexts = all(
      "SELECT * FROM risk_contexts WHERE organization_id=?",
      org,
    );
    return all(
      "SELECT id,name,email,department,role,created_at FROM users WHERE organization_id=? AND active=1 ORDER BY name",
      org,
    ).map((user) => {
      const own = events.filter((e) => e.user_id === user.id);
      const risk = replayRisk(own);
      const previous = replayRisk(
        own,
        new Date(Date.now() - 30 * 86400000).toISOString(),
      );
      const awareness = scoreFor(org, user.id);
      const profile = {
        ...user,
        ...risk,
        context: contexts.find((c) => c.user_id === user.id) || null,
        awareness: {
          score: awareness.score,
          coverage: awareness.coverage,
          components: awareness.components,
        },
        trend:
          risk.score !== null && previous.score !== null
            ? risk.score - previous.score
            : null,
      };
      profile.plan = adaptivePlan(profile, settings(org).cadence_days);
      profile.dimensions = {
        Awareness: awareness.score,
        Behavior: awareness.components.behavior,
        Reporting: awareness.components.reporting,
        Identity: own.some(
          (e) =>
            !e.invalidated &&
            ["identity_risk", "identity_verified"].includes(e.kind),
        )
          ? "Observed"
          : "Not connected",
        Exposure: risk.factors.threat,
        Impact: risk.factors.impact,
        Improvement: awareness.components.improvement,
      };
      return profile;
    });
  }
  function recommendations(org, users = profiles(org)) {
    const result = [];
    for (const user of users) {
      const clicks = user.ledger.filter(
        (e) =>
          e.kind === "simulation_clicked" &&
          new Date(e.occurred_at) > new Date(Date.now() - 60 * 86400000),
      );
      const latestEvidence = user.ledger
        .filter((e) => e.kind !== "role_context")
        .slice(0, 8);
      const topic = user.plan.topic;
      let kind, observation, confidence;
      if (clicks.length >= 2) {
        kind = "Coaching";
        observation = `${clicks.length} simulation interactions in the last 60 days indicate a need for focused practice.`;
        confidence = "High";
      } else if (user.awareness.score !== null && user.awareness.score < 80) {
        kind = "Learning";
        observation = `Measured awareness is ${user.awareness.score}/100. Strengthen the relevant skill before the next challenge.`;
        confidence = user.awareness.coverage >= 65 ? "High" : "Medium";
      } else if (
        user.drivers.some((d) =>
          d.evidence.some(
            (id) =>
              user.ledger.find((e) => e.id === id)?.kind === "threat_targeted",
          ),
        )
      ) {
        kind = "Learning";
        observation =
          "Observed threat exposure makes this competency relevant to the employee’s current work.";
        confidence = "Medium";
      } else continue;
      const key = hash(
        `${user.id}:${topic}:${kind}:${latestEvidence
          .map((e) => e.id)
          .sort()
          .join(":")}`,
      ).slice(0, 32);
      const prior = one(
        "SELECT status FROM intelligence_decisions WHERE organization_id=? AND recommendation_key=?",
        org,
        key,
      );
      if (prior) continue;
      result.push({
        key,
        userIds: [user.id],
        name: user.name,
        department: user.department || "Unassigned",
        topic,
        kind,
        observation,
        evidence: latestEvidence.map((e) => ({
          id: e.id,
          kind: e.kind,
          description: e.description,
          occurredAt: e.occurred_at,
          source: e.source,
        })),
        impact: user.context
          ? `The recorded ${user.context.business_role} role has an impact factor of ${user.factors.impact}/100.`
          : "Business impact context is not yet recorded.",
        expectedOutcome: user.plan.outcome,
        confidence,
        provenance: "Recommended · deterministic evidence rules",
        systemVersion: ENGINE_VERSION,
        action: `Assign ${topic} ${kind.toLowerCase()}`,
        plan: user.plan,
      });
    }
    return result;
  }
  function cohorts(org, users = profiles(org)) {
    return all(
      "SELECT * FROM risk_cohorts WHERE organization_id=? ORDER BY created_at DESC",
      org,
    ).map((c) => {
      const conditions = JSON.parse(c.conditions_json);
      const members = users.filter((u) => cohortMatches(u, conditions));
      return {
        ...c,
        conditions,
        conditions_json: undefined,
        count: members.length,
        userIds: members.map((u) => u.id),
        members: members.map((u) => ({
          id: u.id,
          name: u.name,
          department: u.department,
          score: u.score,
        })),
      };
    });
  }
  function overview(org) {
    sync(org);
    const users = profiles(org);
    const config = settings(org);
    const measured = users.filter((u) => u.score !== null);
    const enough = measured.length >= config.minimum_sample;
    const score = enough ? mean(measured.map((u) => u.score)) : null;
    const trendUsers = measured.filter((u) => u.trend !== null);
    const departments = [
      ...new Set(users.map((u) => u.department || "Unassigned")),
    ].map((name) => {
      const own = users.filter((u) => (u.department || "Unassigned") === name);
      const measured = own.filter((u) => u.score !== null);
      const hidden =
        own.length < config.minimum_sample ||
        measured.length < config.minimum_sample;
      const topics = own.flatMap((u) => u.drivers);
      const counts = {};
      for (const d of topics)
        counts[d.topic] = (counts[d.topic] || 0) + d.count;
      return {
        name,
        count: own.length,
        measured: measured.length,
        score: hidden ? null : mean(measured.map((u) => u.score)),
        suppressed: hidden,
        driver: hidden
          ? null
          : Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      };
    });
    const events = users
      .flatMap((u) => u.ledger)
      .filter(
        (e) => new Date(e.occurred_at) > new Date(Date.now() - 30 * 86400000),
      );
    const reports = events.filter((e) =>
      ["report_confirmed", "simulation_reported"].includes(e.kind),
    );
    const recs = recommendations(org, users);
    const brief = [];
    const rising = users.filter((u) => u.trend !== null && u.trend > 0);
    if (rising.length)
      brief.push({
        title: `Risk increased for ${rising.length} measured ${rising.length === 1 ? "profile" : "profiles"}`,
        description:
          "Review the contributing events and business context before intervening.",
        kind: "attention",
      });
    if (reports.length)
      brief.push({
        title: `${reports.length} positive reporting signals`,
        description:
          "Verified reports and simulation reports contributed evidence in the last 30 days.",
        kind: "positive",
      });
    const repeated = users.filter(
      (u) =>
        u.ledger.filter((e) => e.kind === "simulation_clicked").length >= 2,
    );
    if (repeated.length)
      brief.push({
        title: `${repeated.length} ${repeated.length === 1 ? "person needs" : "people need"} focused practice`,
        description:
          "Repeated interactions support a short coaching moment followed by a new measurement.",
        kind: "attention",
      });
    return {
      score,
      trend:
        trendUsers.length >= config.minimum_sample
          ? mean(trendUsers.map((u) => u.trend))
          : null,
      measured: measured.length,
      total: users.length,
      coverage: users.length
        ? Math.round((measured.length / users.length) * 100)
        : 0,
      awareness: mean(
        users.map((u) => u.awareness.score).filter((v) => v !== null),
      ),
      minimumSample: config.minimum_sample,
      departments,
      brief,
      recommendations: recs,
      mode: config.mode,
      eventCount: events.length,
      positiveCount: reports.length,
      confidence:
        enough && measured.every((u) => u.confidence === "High")
          ? "High"
          : enough
            ? "Medium"
            : "Low",
      aiConfigured: false,
      version: ENGINE_VERSION,
      explanation: enough
        ? "Mean of measured active profiles. Lower means less observed risk."
        : `Organization risk requires at least ${config.minimum_sample} measured profiles. Unmeasured is not minimal risk.`,
    };
  }
  function assignCoaching(org, userId, topic, reason, sourceId) {
    const key = randomUUID();
    run(
      "INSERT OR IGNORE INTO coaching_assignments(id,organization_id,user_id,topic,reason,content_json,source_id,created_at) VALUES (?,?,?,?,?,?,?,?)",
      key,
      org,
      userId,
      topic,
      reason,
      JSON.stringify(coachingContent(topic)),
      sourceId,
      iso(),
    );
    const assignment = one(
      "SELECT id FROM coaching_assignments WHERE organization_id=? AND user_id=? AND source_id=?",
      org,
      userId,
      sourceId,
    );
    notify(
      org,
      userId,
      "coaching",
      `Your next skill: ${topic}`,
      "/employee",
      `coach:${assignment.id}`,
      false,
    );
    return assignment.id;
  }
  function assignPractice(org, userId, topic, sourceId, options = {}) {
    const profile = profiles(org).find((u) => u.id === userId);
    if (!profile) problem(404, "USER_NOT_FOUND", "Employee was not found.");
    const key = randomUUID();
    const document =
      options.document ||
      simulationDocument(
        topic,
        profile.plan.difficulty,
        options.channel || "Email",
        profile.context?.business_role,
      );
    run(
      "INSERT OR IGNORE INTO practice_assignments(id,organization_id,user_id,draft_id,topic,channel,difficulty,document_json,source_id,created_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      key,
      org,
      userId,
      options.draftId || null,
      topic,
      document.channel,
      document.difficulty,
      JSON.stringify(document),
      sourceId,
      iso(),
      new Date(Date.now() + 14 * 86400000).toISOString(),
    );
    const assignment = one(
      "SELECT id FROM practice_assignments WHERE organization_id=? AND user_id=? AND source_id=?",
      org,
      userId,
      sourceId,
    );
    notify(
      org,
      userId,
      "practice",
      `${topic} challenge`,
      `/employee/challenges/${assignment.id}`,
      `practice:${assignment.id}`,
      false,
    );
    return assignment.id;
  }
  function execute(org, actor, request, policyId = null) {
    return db.transaction(() => {
      const existing = one(
        "SELECT * FROM intelligence_decisions WHERE organization_id=? AND recommendation_key=?",
        org,
        request.key,
      );
      if (existing)
        return { id: existing.id, status: existing.status, duplicate: true };
      const ids = [...new Set(request.userIds)];
      if (!ids.length)
        problem(400, "EMPTY_AUDIENCE", "Select at least one active employee.");
      for (const userId of ids)
        if (
          !one(
            "SELECT 1 FROM users WHERE organization_id=? AND id=? AND active=1",
            org,
            userId,
          )
        )
          problem(
            404,
            "USER_NOT_FOUND",
            "One or more employees are unavailable.",
          );
      const decision = randomUUID();
      let programId = null;
      if (request.kind === "Learning") {
        const course = all(
          "SELECT * FROM course_revisions WHERE organization_id=? AND status='Published' ORDER BY created_at DESC",
          org,
        ).find((c) => JSON.parse(c.document_json).category === request.topic);
        if (!course)
          problem(
            409,
            "CONTENT_REQUIRED",
            "Publish reviewed learning for this competency first.",
          );
        programId = randomUUID();
        const stamp = iso();
        run(
          "INSERT INTO programs(id,organization_id,name,objective,owner_id,status,due_at,baseline,followup,reminders,created_at,updated_at) VALUES (?,?,?,?,?,'Draft',?,1,1,0,?,?)",
          programId,
          org,
          `${request.topic} reinforcement`,
          request.expectedOutcome,
          actor,
          new Date(Date.now() + 14 * 86400000).toISOString(),
          stamp,
          stamp,
        );
        for (const userId of ids)
          run("INSERT INTO program_audience VALUES (?,?)", programId, userId);
        run("INSERT INTO program_courses VALUES (?,?)", programId, course.id);
        activate(one("SELECT * FROM programs WHERE id=?", programId));
      } else if (request.kind === "Coaching") {
        for (const userId of ids)
          assignCoaching(
            org,
            userId,
            request.topic,
            request.observation,
            decision,
          );
      } else if (request.kind === "Simulation") {
        for (const userId of ids)
          assignPractice(org, userId, request.topic, decision);
      }
      const status =
        request.kind === "Monitor"
          ? "Monitoring"
          : request.kind === "Dismiss"
            ? "Dismissed"
            : policyId
              ? "Automated"
              : "Human Approved";
      run(
        "INSERT INTO intelligence_decisions(id,organization_id,recommendation_key,kind,topic,user_ids_json,evidence_json,observation,expected_outcome,status,actor_id,policy_id,program_id,created_at,system_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        decision,
        org,
        request.key,
        request.kind,
        request.topic,
        JSON.stringify(ids),
        JSON.stringify(request.evidence || []),
        request.observation,
        request.expectedOutcome,
        status,
        actor,
        policyId,
        programId,
        iso(),
        ENGINE_VERSION,
      );
      audit(
        org,
        actor,
        policyId ? "Approved policy executed" : "Recommendation decision",
        decision,
        {
          kind: request.kind,
          topic: request.topic,
          userIds: ids,
          evidence: request.evidence || [],
          policyId,
        },
        { status, programId },
      );
      return { id: decision, status, programId };
    })();
  }
  function deliveryRecords(org) {
    const records = all(
      "SELECT t.id,t.user_id,t.sent_at,p.name,p.simulation FROM simulation_targets t JOIN programs p ON p.id=t.program_id WHERE t.organization_id=? AND t.sent_at IS NOT NULL",
      org,
    ).map((t) => {
      const events = all(
        "SELECT * FROM safe_simulation_events WHERE target_id=?",
        t.id,
      );
      return {
        id: t.id,
        userId: t.user_id,
        topic: inferTopic(t.name + " " + t.simulation),
        sentAt: t.sent_at,
        clickedAt:
          events.find((e) => e.event === "clicked")?.created_at || null,
        reportedAt:
          events.find((e) => e.event === "reported")?.created_at || null,
      };
    });
    return records.concat(
      all(
        "SELECT * FROM practice_assignments WHERE organization_id=? AND opened_at IS NOT NULL",
        org,
      ).map((t) => ({
        id: t.id,
        userId: t.user_id,
        topic: t.topic,
        sentAt: t.opened_at,
        clickedAt: t.clicked_at,
        reportedAt: t.reported_at,
      })),
    );
  }
  function outcomes(org) {
    const config = settings(org);
    const records = deliveryRecords(org);
    const summarize = (rows, end) => {
      const enough =
        new Set(rows.map((r) => r.userId)).size >= config.minimum_sample;
      const clicked = rows.filter(
        (r) => r.clickedAt && new Date(r.clickedAt).getTime() < end,
      ).length;
      const reported = rows.filter(
        (r) => r.reportedAt && new Date(r.reportedAt).getTime() < end,
      ).length;
      return {
        count: rows.length,
        clicked: enough ? clicked : null,
        reported: enough ? reported : null,
        clickRate:
          enough && rows.length
            ? Math.round((clicked / rows.length) * 100)
            : null,
        reportRate:
          enough && rows.length
            ? Math.round((reported / rows.length) * 100)
            : null,
      };
    };
    return all(
      "SELECT * FROM intelligence_decisions WHERE organization_id=? AND status NOT IN ('Dismissed','Monitoring') ORDER BY created_at DESC LIMIT 50",
      org,
    ).map((d) => {
      const ids = JSON.parse(d.user_ids_json);
      const start = new Date(d.created_at).getTime();
      const cohort = records.filter(
        (r) => ids.includes(r.userId) && r.topic === d.topic,
      );
      const before = summarize(
        cohort.filter(
          (r) =>
            new Date(r.sentAt).getTime() < start &&
            new Date(r.sentAt).getTime() >= start - 14 * 86400000,
        ),
        start,
      );
      const after = summarize(
        cohort.filter(
          (r) =>
            new Date(r.sentAt).getTime() >= start &&
            new Date(r.sentAt).getTime() < start + 14 * 86400000,
        ),
        Math.min(Date.now() + 1, start + 14 * 86400000),
      );
      const sufficient =
        ids.length >= config.minimum_sample &&
        before.clickRate !== null &&
        after.clickRate !== null &&
        Date.now() >= start + 14 * 86400000;
      const delta = sufficient ? after.clickRate - before.clickRate : null;
      return {
        id: d.id,
        topic: d.topic,
        kind: d.kind,
        createdAt: d.created_at,
        users: ids.length,
        before,
        after,
        delta,
        status: !sufficient
          ? "Collecting evidence"
          : delta < 0
            ? "Observed improvement"
            : delta === 0
              ? "No observed change"
              : "Review intervention",
        method:
          "Same cohort and competency, 14-day windows. Observational comparison; not a causal estimate.",
      };
    });
  }
  return {
    db,
    all,
    one,
    run,
    settings,
    audit,
    ingest,
    sync,
    profiles,
    recommendations,
    cohorts,
    overview,
    assignCoaching,
    assignPractice,
    execute,
    deliveryRecords,
    outcomes,
    notify,
  };
}
