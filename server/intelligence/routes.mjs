import {
  randomUUID,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import PDFDocument from "pdfkit";
import { migrateIntelligence } from "./schema.mjs";
import { createIntelligenceService, iso, problem, hash } from "./service.mjs";
import {
  TOPICS,
  SIGNAL_KINDS,
  ENGINE_VERSION,
  mean,
  replayRisk,
  skillLevel,
} from "./risk-engine.mjs";
import { seedCatalog, coachingContent } from "./catalog.mjs";
import { registerStudios } from "./studios.mjs";
import { providerStatus, generateAI, triageSchema } from "./ai.mjs";
import { createAutomation } from "./automation.mjs";
import { seal, unseal } from "../identity.mjs";
import { ssoConfigured } from "../sso.mjs";

const admin = ["super_admin", "admin"];
const viewers = [...admin, "manager"];
const cohortConditions = z
  .object({
    department: z.string().max(100).optional(),
    businessRole: z.string().max(120).optional(),
    excludeRole: z
      .enum(["super_admin", "admin", "manager", "employee"])
      .optional(),
    privileged: z.boolean().optional(),
    minimumRisk: z.number().int().min(0).max(100).optional(),
    newWithinDays: z.number().int().min(1).max(365).optional(),
    signalKind: z.enum(SIGNAL_KINDS).optional(),
    topic: z.enum(TOPICS).optional(),
    minimumCount: z.number().int().min(1).max(100).optional(),
    windowDays: z.number().int().min(1).max(90).optional(),
  })
  .strict();
const signalInput = z
  .object({
    userId: z.string(),
    kind: z.enum([
      "threat_targeted",
      "exposure_observed",
      "identity_risk",
      "identity_verified",
      "unsafe_sharing",
      "verified_request",
    ]),
    topic: z.enum(TOPICS),
    value: z.number().min(0).max(100).nullable().optional(),
    sourceId: z.string().min(1).max(200),
    description: z.string().trim().min(5).max(1000),
    occurredAt: z.string().datetime(),
  })
  .strict()
  .refine(
    (s) =>
      s.kind !== "exposure_observed" ||
      (s.value !== undefined && s.value !== null),
    "An exposure measurement requires a value.",
  )
  .refine(
    (s) => new Date(s.occurredAt).getTime() <= Date.now() + 60000,
    "Future events are not accepted.",
  )
  .refine(
    (s) => new Date(s.occurredAt).getTime() >= Date.now() - 90 * 86400000,
    "Ingest signals observed within the last 90 days.",
  );
const decisionSchema = z
  .object({
    key: z.string().min(1).max(200),
    userIds: z.array(z.string()).min(1).max(500),
    kind: z.enum(["Learning", "Coaching", "Simulation", "Monitor", "Dismiss"]),
    topic: z.enum(TOPICS),
    evidence: z
      .array(
        z.object({ id: z.string(), kind: z.string().optional() }).passthrough(),
      )
      .max(200),
    observation: z.string().min(5).max(2000),
    expectedOutcome: z.string().min(5).max(2000),
    acknowledged: z.literal(true),
  })
  .strict();

export function registerIntelligence(app, deps) {
  migrateIntelligence(deps.db);
  seedCatalog(deps.db);
  const s = createIntelligenceService(deps);
  const { validate, authRequired, allowRoles, sessionSecret } = deps;
  const org = (req) => req.auth.organization.id;
  const wrap = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
  const route = (method, path, roles, fn) =>
    app[method](
      `/api/workspace/intelligence${path}`,
      authRequired,
      ...(roles ? [allowRoles(...roles)] : []),
      wrap(fn),
    );
  const aiLimiter = rateLimit({
    windowMs: 60000,
    limit: 12,
    skip: (req) => !req.body?.generate && !req.path.endsWith("/questions"),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: { message: "Please wait before requesting another draft." },
    },
  });
  app.use("/api/workspace/intelligence/studios", aiLimiter);
  registerStudios({ route, service: s, validate });
  const automation = createAutomation(s);
  route("get", "/overview", viewers, (req, res) => {
    const data = s.overview(org(req));
    if (req.auth.role === "manager") data.recommendations = [];
    data.ai = providerStatus(s.settings(org(req)).ai_enabled);
    res.json(data);
  });
  route("get", "/profiles", admin, (req, res) => {
    s.sync(org(req));
    res.json({ profiles: s.profiles(org(req)), topics: TOPICS });
  });
  route("get", "/profiles/:id", admin, (req, res) => {
    s.sync(org(req));
    const profile = s.profiles(org(req)).find((u) => u.id === req.params.id);
    if (!profile) problem(404, "USER_NOT_FOUND", "Employee was not found.");
    res.json({
      profile,
      recommendations: s.recommendations(org(req), [profile]),
    });
  });
  route("put", "/profiles/:id/context", admin, (req, res) => {
    const input = validate(
      z
        .object({
          businessRole: z.string().trim().min(2).max(120),
          location: z.string().trim().max(100).default(""),
          impact: z.union([
            z.literal(25),
            z.literal(50),
            z.literal(75),
            z.literal(100),
          ]),
          privileged: z.boolean(),
          rationale: z.string().trim().min(10).max(1000),
        })
        .strict(),
      req.body,
    );
    s.db.transaction(() => {
      if (
        !s.one(
          "SELECT 1 FROM users WHERE organization_id=? AND id=? AND active=1",
          org(req),
          req.params.id,
        )
      )
        problem(404, "USER_NOT_FOUND", "Employee was not found.");
      s.run(
        "INSERT INTO risk_contexts VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(organization_id,user_id) DO UPDATE SET business_role=excluded.business_role,location=excluded.location,impact=excluded.impact,privileged=excluded.privileged,rationale=excluded.rationale,updated_by=excluded.updated_by,updated_at=excluded.updated_at",
        org(req),
        req.params.id,
        input.businessRole,
        input.location,
        input.impact,
        input.privileged ? 1 : 0,
        input.rationale,
        req.auth.id,
        iso(),
      );
      const signal = s.ingest(org(req), {
        userId: req.params.id,
        kind: "role_context",
        topic: "Executive Security",
        value: input.impact,
        source: "Administrator context",
        sourceId: randomUUID(),
        description: `Impact ${input.impact}/100: ${input.rationale}`,
        occurredAt: iso(),
      });
      s.audit(
        org(req),
        req.auth.id,
        "Business impact context recorded",
        req.params.id,
        input,
        { signalId: signal },
      );
    })();
    res.json({ saved: true });
  });
  route("post", "/signals", admin, (req, res) => {
    const input = validate(signalInput, req.body);
    const id = s.ingest(org(req), {
      ...input,
      source: "Administrator verified signal",
    });
    s.audit(
      org(req),
      req.auth.id,
      "Signal recorded",
      id,
      { sourceId: input.sourceId, userId: input.userId, kind: input.kind },
      { id },
    );
    res.status(201).json({ id });
  });
  route("get", "/cohorts", admin, (req, res) => {
    s.sync(org(req));
    res.json({ cohorts: s.cohorts(org(req)), topics: TOPICS });
  });
  route("post", "/cohorts", admin, (req, res) => {
    const input = validate(
      z
        .object({
          name: z.string().trim().min(3).max(120),
          description: z.string().max(1000),
          conditions: cohortConditions,
        })
        .strict(),
      req.body,
    );
    const id = randomUUID();
    s.run(
      "INSERT INTO risk_cohorts VALUES (?,?,?,?,?,?,?)",
      id,
      org(req),
      input.name,
      input.description,
      JSON.stringify(input.conditions),
      req.auth.id,
      iso(),
    );
    s.audit(org(req), req.auth.id, "Dynamic cohort created", id, input, {});
    res.status(201).json({ id });
  });
  route("post", "/decisions", admin, (req, res) => {
    const input = validate(decisionSchema, req.body);
    for (const e of input.evidence)
      if (
        !s.one(
          "SELECT 1 FROM risk_signals WHERE id=? AND organization_id=? AND user_id IN (SELECT id FROM users WHERE organization_id=?)",
          e.id,
          org(req),
          org(req),
        ) &&
        !s.one(
          "SELECT 1 FROM threat_bulletins WHERE id=? AND organization_id=?",
          e.id,
          org(req),
        )
      )
        problem(
          400,
          "INVALID_EVIDENCE",
          "Recommendation evidence must belong to this organization.",
        );
    res.status(201).json(s.execute(org(req), req.auth.id, input));
  });
  route("get", "/decisions", admin, (req, res) =>
    res.json({
      decisions: s
        .all(
          "SELECT * FROM intelligence_decisions WHERE organization_id=? ORDER BY created_at DESC LIMIT 100",
          org(req),
        )
        .map((d) => ({
          ...d,
          userIds: JSON.parse(d.user_ids_json),
          evidence: JSON.parse(d.evidence_json),
          user_ids_json: undefined,
          evidence_json: undefined,
        })),
    }),
  );
  route("get", "/settings", admin, (req, res) =>
    res.json({
      settings: s.settings(org(req)),
      provider: providerStatus(s.settings(org(req)).ai_enabled),
    }),
  );
  route("put", "/settings", admin, (req, res) => {
    const input = validate(
      z
        .object({
          mode: z.enum(["Observe", "Recommend", "Assist", "Automate"]),
          minimumSample: z.number().int().min(3).max(50),
          retentionDays: z.number().int().min(90).max(730),
          cadenceDays: z.number().int().min(7).max(90),
          aiEnabled: z.boolean(),
          version: z.number().int(),
          acknowledged: z.literal(true),
        })
        .strict(),
      req.body,
    );
    if (s.settings(org(req)).version !== input.version)
      problem(
        409,
        "VERSION_CONFLICT",
        "Settings changed. Reload before saving.",
      );
    if (input.aiEnabled && !providerStatus().configured)
      problem(
        409,
        "AI_UNCONFIGURED",
        "Configure server-side AI credentials and a model before enabling AI.",
      );
    s.run(
      "INSERT INTO intelligence_settings VALUES (?,?,?,?,?,?,?) ON CONFLICT(organization_id) DO UPDATE SET mode=excluded.mode,minimum_sample=excluded.minimum_sample,retention_days=excluded.retention_days,cadence_days=excluded.cadence_days,ai_enabled=excluded.ai_enabled,version=excluded.version",
      org(req),
      input.mode,
      input.minimumSample,
      input.retentionDays,
      input.cadenceDays,
      input.aiEnabled ? 1 : 0,
      input.version + 1,
    );
    s.audit(
      org(req),
      req.auth.id,
      "Intelligence governance changed",
      org(req),
      input,
      { version: input.version + 1 },
    );
    res.json({ settings: s.settings(org(req)) });
  });
  route("get", "/policies", admin, (req, res) =>
    res.json({
      policies: s.all(
        "SELECT * FROM intervention_policies WHERE organization_id=? ORDER BY created_at DESC",
        org(req),
      ),
      steps: s.all(
        "SELECT * FROM intervention_steps WHERE organization_id=? ORDER BY updated_at DESC LIMIT 100",
        org(req),
      ),
      mode: s.settings(org(req)).mode,
      cohorts: s.cohorts(org(req)),
    }),
  );
  route("post", "/policies", admin, (req, res) => {
    const input = validate(
      z
        .object({
          name: z.string().trim().min(3).max(120),
          goal: z.string().trim().min(5).max(1000),
          cohortId: z.string(),
          topic: z.enum(TOPICS),
          action: z.enum(["Learning", "Coaching"]),
          waitDays: z.number().int().min(1).max(30),
          cadenceDays: z.number().int().min(7).max(90),
          continuous: z.boolean(),
        })
        .strict(),
      req.body,
    );
    if (
      !s.one(
        "SELECT 1 FROM risk_cohorts WHERE id=? AND organization_id=?",
        input.cohortId,
        org(req),
      )
    )
      problem(404, "COHORT_NOT_FOUND", "Choose a cohort in your organization.");
    const id = randomUUID();
    s.run(
      "INSERT INTO intervention_policies(id,organization_id,name,goal,cohort_id,topic,action,wait_days,cadence_days,continuous,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      org(req),
      input.name,
      input.goal,
      input.cohortId,
      input.topic,
      input.action,
      input.waitDays,
      input.cadenceDays,
      input.continuous ? 1 : 0,
      req.auth.id,
      iso(),
    );
    s.audit(org(req), req.auth.id, "Intervention policy drafted", id, input, {
      enabled: false,
    });
    res.status(201).json({ id });
  });
  route("post", "/policies/:id/approval", admin, (req, res) => {
    const input = validate(
      z
        .object({
          enabled: z.boolean(),
          acknowledged: z.literal(true),
          version: z.number().int(),
        })
        .strict(),
      req.body,
    );
    const row = s.one(
      "SELECT * FROM intervention_policies WHERE id=? AND organization_id=?",
      req.params.id,
      org(req),
    );
    if (!row) problem(404, "POLICY_NOT_FOUND", "Policy was not found.");
    if (row.version !== input.version)
      problem(
        409,
        "VERSION_CONFLICT",
        "Reload the current policy before approval.",
      );
    s.run(
      "UPDATE intervention_policies SET enabled=?,approved_by=?,approved_at=?,version=version+1 WHERE id=?",
      input.enabled ? 1 : 0,
      input.enabled ? req.auth.id : null,
      input.enabled ? iso() : null,
      row.id,
    );
    s.audit(
      org(req),
      req.auth.id,
      input.enabled ? "Policy approved" : "Policy paused",
      row.id,
      { version: input.version },
      { enabled: input.enabled },
    );
    res.json({ saved: true });
  });
  route("post", "/prepared/:id/approve", admin, (req, res) => {
    validate(z.object({ acknowledged: z.literal(true) }).strict(), req.body);
    const row = s.one(
      "SELECT * FROM intervention_steps WHERE organization_id=? AND id=? AND status='Prepared'",
      org(req),
      req.params.id,
    );
    if (!row)
      problem(404, "ACTION_NOT_FOUND", "Prepared action was not found.");
    const policy = s.one(
      "SELECT * FROM intervention_policies WHERE id=? AND organization_id=? AND enabled=1",
      row.policy_id,
      org(req),
    );
    if (!policy) problem(409, "POLICY_PAUSED", "The policy is paused.");
    const decision = s.execute(
      org(req),
      req.auth.id,
      { ...JSON.parse(row.result), humanApproved: true },
      row.policy_id,
    );
    s.run(
      "UPDATE intervention_steps SET decision_id=?,status='Waiting',result=NULL,due_at=?,updated_at=? WHERE id=?",
      decision.id,
      new Date(Date.now() + policy.wait_days * 86400000).toISOString(),
      iso(),
      row.id,
    );
    res.json(decision);
  });
  route("get", "/threats", admin, (req, res) =>
    res.json({
      threats: s
        .all(
          "SELECT * FROM threat_bulletins WHERE organization_id=? ORDER BY observed_at DESC",
          org(req),
        )
        .map((t) => ({
          ...t,
          departments: JSON.parse(t.departments_json),
          departments_json: undefined,
          stale: new Date(t.observed_at) < new Date(Date.now() - 30 * 86400000),
        })),
      topics: TOPICS,
    }),
  );
  route("post", "/threats", admin, (req, res) => {
    const input = validate(
      z
        .object({
          title: z.string().trim().min(5).max(150),
          topic: z.enum(TOPICS),
          description: z.string().trim().min(10).max(4000),
          source: z.string().trim().min(3).max(200),
          sourceUrl: z.string().url().max(2000).or(z.literal("")),
          observedAt: z.string().datetime(),
          region: z.string().max(100),
          industry: z.string().max(100),
          departments: z.array(z.string().max(100)).max(50),
        })
        .strict()
        .refine((t) => new Date(t.observedAt).getTime() <= Date.now() + 60000),
      req.body,
    );
    if (input.sourceUrl && !/^https:\/\//.test(input.sourceUrl))
      problem(400, "SOURCE_URL", "Use an HTTPS reference URL.");
    const id = randomUUID();
    s.run(
      "INSERT INTO threat_bulletins VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      id,
      org(req),
      input.title,
      input.topic,
      input.description,
      input.source,
      input.sourceUrl,
      input.observedAt,
      iso(),
      input.region,
      input.industry,
      JSON.stringify(input.departments),
      req.auth.id,
    );
    s.audit(
      org(req),
      req.auth.id,
      "Threat bulletin added",
      id,
      { source: input.source, observedAt: input.observedAt },
      { topic: input.topic },
    );
    res.status(201).json({ id });
  });
  route("get", "/threats/:id/recommendation", admin, (req, res) => {
    const threat = s.one(
      "SELECT * FROM threat_bulletins WHERE id=? AND organization_id=?",
      req.params.id,
      org(req),
    );
    if (!threat) problem(404, "THREAT_NOT_FOUND", "Threat was not found.");
    const departments = JSON.parse(threat.departments_json);
    const users = s
      .profiles(org(req))
      .filter(
        (u) =>
          u.role === "employee" &&
          (!departments.length || departments.includes(u.department)),
      );
    res.json({
      key: `threat:${threat.id}`,
      topic: threat.topic,
      kind: "Learning",
      userIds: users.map((u) => u.id),
      evidence: [
        {
          id: threat.id,
          kind: "threat_bulletin",
          source: threat.source,
          description: threat.title,
        },
      ],
      observation: `${threat.title}. Source: ${threat.source}; observed ${threat.observed_at.slice(0, 10)}.`,
      impact:
        "A relevant bulletin supports training; it does not establish that every recipient was targeted.",
      expectedOutcome: `Recognize ${threat.topic.toLowerCase()} requests and verify them through trusted channels.`,
      confidence:
        new Date(threat.observed_at) < new Date(Date.now() - 30 * 86400000)
          ? "Low"
          : "Medium",
      provenance: "Recommended · source-matched rules",
    });
  });
  route("get", "/audit", admin, (req, res) =>
    res.json({
      events: s
        .all(
          "SELECT * FROM intelligence_audit WHERE organization_id=? ORDER BY created_at DESC LIMIT 200",
          org(req),
        )
        .map((e) => ({
          ...e,
          input: JSON.parse(e.input_json),
          output: JSON.parse(e.output_json),
          input_json: undefined,
          output_json: undefined,
        })),
    }),
  );
  route("get", "/outcomes", viewers, (req, res) => {
    const records = s.deliveryRecords(org(req));
    const recent = records.filter(
      (r) => new Date(r.sentAt) > new Date(Date.now() - 30 * 86400000),
    );
    const report = recent.filter((r) => r.reportedAt);
    const clicks = recent.filter((r) => r.clickedAt);
    const detections = report.filter((r) => !r.clickedAt);
    const times = report
      .map((r) => (new Date(r.reportedAt) - new Date(r.sentAt)) / 60000)
      .filter((n) => n >= 0)
      .sort((a, b) => a - b);
    const minimum = s.settings(org(req)).minimum_sample;
    const enough = new Set(recent.map((r) => r.userId)).size >= minimum;
    res.json({
      outcomes: s.outcomes(org(req)),
      metrics: {
        practiceOpportunities: recent.length,
        reportingRate: enough
          ? Math.round((report.length / recent.length) * 100)
          : null,
        clickRate: enough
          ? Math.round((clicks.length / recent.length) * 100)
          : null,
        detectionRate: enough
          ? Math.round((detections.length / recent.length) * 100)
          : null,
        medianReportMinutes:
          enough && times.length
            ? Math.round(times[Math.floor(times.length / 2)])
            : null,
      },
      minimumSample: minimum,
      definitions: {
        detectionRate:
          "Reported without clicking / measured practice opportunities.",
        reportingRate: "Reported / measured practice opportunities.",
        clickRate: "Clicked / measured practice opportunities.",
        medianReportMinutes:
          "Median minutes from sent email or opened in-app scenario to first report.",
      },
    });
  });
  route("get", "/exports/:format", admin, (req, res) => {
    const overview = s.overview(org(req));
    const users = s.profiles(org(req));
    const outcomes = s.outcomes(org(req));
    s.audit(
      org(req),
      req.auth.id,
      "Human risk report exported",
      null,
      { format: req.params.format },
      { profiles: users.length },
    );
    if (req.params.format === "csv") {
      const cell = (v) =>
        `"${String(v ?? "")
          .replace(/^[=+@\-\t\r]/, "'$&")
          .replaceAll('"', '""')}"`;
      const rows = [
        [
          "Employee",
          "Department",
          "Human Risk Index",
          "Coverage",
          "Awareness",
          "Primary driver",
          "Model version",
        ],
        ...users.map((u) => [
          u.name,
          u.department,
          u.score,
          u.coverage,
          u.awareness.score,
          u.drivers[0]?.topic,
          ENGINE_VERSION,
        ]),
      ];
      return res
        .type("text/csv")
        .attachment("averis-human-risk.csv")
        .send(rows.map((row) => row.map(cell).join(",")).join("\r\n"));
    }
    if (req.params.format !== "pdf")
      problem(400, "INVALID_FORMAT", "Choose CSV or PDF.");
    const pdf = new PDFDocument({ margin: 48 });
    res.type("application/pdf").attachment("averis-human-risk-report.pdf");
    pdf.pipe(res);
    pdf.fillColor("#b72b30").fontSize(22).text("AVERIS");
    pdf
      .fillColor("#25272b")
      .fontSize(20)
      .text("Human Risk Intelligence Report");
    pdf
      .fontSize(10)
      .fillColor("#666666")
      .text(
        `${req.auth.organization.name} | ${iso().slice(0, 10)} | ${ENGINE_VERSION}`,
      );
    pdf
      .moveDown()
      .fontSize(13)
      .fillColor("#25272b")
      .text(
        `Human Risk Index: ${overview.score ?? "Unmeasured"} | Measured profiles: ${overview.measured}/${overview.total}`,
      );
    pdf.moveDown().fontSize(11).text(overview.explanation);
    pdf.moveDown().text("Department view");
    for (const d of overview.departments)
      pdf
        .fontSize(10)
        .text(
          `${d.name}: ${d.suppressed ? "Suppressed: insufficient sample" : d.score + " / 100"} | ${d.count} people`,
        );
    pdf.moveDown().text("Intervention effectiveness");
    for (const o of outcomes) {
      if (pdf.y > 700) pdf.addPage();
      pdf
        .fontSize(10)
        .text(
          `${o.topic} / ${o.kind}: ${o.status}; before ${o.before.clickRate ?? "unmeasured"}%, after ${o.after.clickRate ?? "unmeasured"}%`,
        );
    }
    pdf
      .moveDown()
      .fontSize(9)
      .text(
        "Scores guide security support, not employee performance. Risk is deterministic and evidence-based. Comparisons are observational and do not establish causation.",
      );
    pdf.end();
  });

  route("get", "/me", ["employee"], (req, res) => {
    s.sync(org(req));
    const p = s.profiles(org(req)).find((u) => u.id === req.auth.id);
    if (!p) problem(404, "USER_NOT_FOUND", "Profile unavailable.");
    const positive = p.ledger.filter((e) =>
      ["simulation_reported", "report_confirmed", "verified_request"].includes(
        e.kind,
      ),
    );
    const coaching = s
      .all(
        "SELECT * FROM coaching_assignments WHERE organization_id=? AND user_id=? ORDER BY created_at DESC",
        org(req),
        req.auth.id,
      )
      .map((c) => ({
        ...c,
        content: JSON.parse(c.content_json),
        content_json: undefined,
      }));
    const practice = s.all(
      "SELECT id,topic,channel,difficulty,status,created_at,expires_at FROM practice_assignments WHERE organization_id=? AND user_id=? ORDER BY created_at DESC",
      org(req),
      req.auth.id,
    );
    const complete = p.ledger.filter(
      (e) => e.kind === "learning_completed",
    ).length;
    const xp =
      positive.length * 20 +
      complete * 10 +
      coaching.filter((c) => c.completed_at).length * 5;
    const weeks = new Set(
      p.ledger
        .filter((e) =>
          [
            "simulation_reported",
            "report_confirmed",
            "learning_completed",
            "coaching_completed",
          ].includes(e.kind),
        )
        .map((e) =>
          Math.floor(new Date(e.occurred_at).getTime() / (7 * 86400000)),
        ),
    );
    let streak = 0;
    let week = Math.floor(Date.now() / (7 * 86400000));
    if (!weeks.has(week)) week--;
    while (weeks.has(week)) {
      streak++;
      week--;
    }
    res.json({
      awareness: p.awareness,
      level: p.plan.level,
      plan: p.plan,
      coaching,
      practice,
      xp,
      streak,
      reports: positive.length,
      badges: [
        ...(positive.length
          ? [
              {
                name: "First Threat Reported",
                description:
                  "A verified report contributes to the team’s awareness.",
              },
            ]
          : []),
        ...(positive.filter((e) => e.kind === "simulation_reported").length >= 3
          ? [
              {
                name: "Phishing Spotter",
                description: "Reported three practice scenarios.",
              },
            ]
          : []),
        ...(streak >= 4
          ? [
              {
                name: "Consistent Learner",
                description: "Four weeks of positive learning activity.",
              },
            ]
          : []),
      ],
      skills: TOPICS.map((topic) => ({
        topic,
        level: skillLevel(p.ledger.filter((e) => e.topic === topic)),
        measured: p.ledger.some(
          (e) => e.topic === topic && e.kind !== "role_context",
        ),
      })).filter((t) => t.measured),
      sources: [
        "Assigned learning",
        "Graded assessments",
        "Controlled practice",
        "Security-confirmed reports",
      ],
      privacy:
        "Your personal view contains skills and progress, not an employee risk label.",
    });
  });
  route("post", "/coaching/:id/complete", ["employee"], (req, res) => {
    validate(z.object({ acknowledged: z.literal(true) }).strict(), req.body);
    const row = s.one(
      "SELECT * FROM coaching_assignments WHERE organization_id=? AND user_id=? AND id=?",
      org(req),
      req.auth.id,
      req.params.id,
    );
    if (!row) problem(404, "COACHING_NOT_FOUND", "Coaching was not found.");
    s.db.transaction(() => {
      if (!row.completed_at) {
        s.run(
          "UPDATE coaching_assignments SET status='Completed',completed_at=? WHERE id=?",
          iso(),
          row.id,
        );
        s.ingest(org(req), {
          userId: req.auth.id,
          kind: "coaching_completed",
          topic: row.topic,
          source: "AVERIS Coach",
          sourceId: row.id,
          description:
            "Acknowledged a short coaching moment. Follow-up behavior remains to be measured.",
          occurredAt: iso(),
        });
      }
    })();
    res.json({ completed: true });
  });
  route("get", "/practice", ["super_admin", "admin"], (req, res) =>
    res.json({
      assignments: s
        .all(
          "SELECT p.*,u.name,u.department FROM practice_assignments p JOIN users u ON u.id=p.user_id WHERE p.organization_id=? ORDER BY p.created_at DESC",
          org(req),
        )
        .map((p) => ({
          ...p,
          document: JSON.parse(p.document_json),
          document_json: undefined,
          token_hash: undefined,
        })),
      provider: providerStatus(s.settings(org(req)).ai_enabled),
      smtpConfigured: Boolean(process.env.SMTP_HOST),
      channels: [
        "Email",
        "SMS",
        "QR",
        "Collaboration",
        "Voice",
        "Callback",
        "Deepfake",
      ].map((name) => ({
        name,
        status:
          name === "Email" && process.env.SMTP_HOST
            ? "SMTP delivery + in-app practice"
            : "Scenario only",
      })),
    }),
  );
  const ownedPractice = (req) => {
    const p = s.one(
      "SELECT * FROM practice_assignments WHERE organization_id=? AND user_id=? AND id=?",
      org(req),
      req.auth.id,
      req.params.id,
    );
    if (!p) problem(404, "PRACTICE_NOT_FOUND", "Challenge was not found.");
    if (p.expires_at < iso())
      problem(
        410,
        "PRACTICE_EXPIRED",
        "This challenge has ended. Your next activity is on your home page.",
      );
    return p;
  };
  route("get", "/practice/:id", ["employee"], (req, res) => {
    const p = ownedPractice(req);
    const document = JSON.parse(p.document_json);
    const complete = p.clicked_at || p.reported_at;
    res.json({
      practice: {
        id: p.id,
        topic: p.topic,
        channel: p.channel,
        difficulty: p.difficulty,
        status: p.status,
        subject: document.subject,
        message: document.message,
        context: document.context,
        expiresAt: p.expires_at,
        delivery: p.delivery,
      },
      coaching: complete
        ? coachingContent(p.topic, Boolean(p.reported_at && !p.clicked_at))
        : null,
    });
  });
  route("post", "/practice/:id/event", ["employee"], (req, res) => {
    const input = validate(
      z.object({ event: z.enum(["opened", "clicked", "reported"]) }).strict(),
      req.body,
    );
    const p = ownedPractice(req);
    const key = {
      opened: "opened_at",
      clicked: "clicked_at",
      reported: "reported_at",
    }[input.event];
    s.db.transaction(() => {
      if (p.clicked_at || p.reported_at) return;
      s.run(
        `UPDATE practice_assignments SET ${key}=COALESCE(${key},?),status=? WHERE id=?`,
        iso(),
        input.event === "opened" ? "In progress" : "Completed",
        p.id,
      );
      if (input.event !== "opened") {
        s.ingest(org(req), {
          userId: req.auth.id,
          kind:
            input.event === "clicked"
              ? "simulation_clicked"
              : "simulation_reported",
          topic: p.topic,
          source: "AVERIS adaptive practice",
          sourceId: p.id,
          description:
            input.event === "clicked"
              ? "Interacted with a controlled practice request."
              : "Reported a controlled practice request.",
          occurredAt: iso(),
        });
        deps.scoreEvent(
          org(req),
          req.auth.id,
          "behavior",
          input.event === "reported" ? 100 : 0,
          "Adaptive practice response",
          `practice:${p.id}`,
        );
        if (input.event === "reported")
          deps.scoreEvent(
            org(req),
            req.auth.id,
            "reporting",
            100,
            "Reported an adaptive practice scenario",
            `practice:${p.id}`,
          );
      }
    })();
    res.json({
      recorded: true,
      coaching:
        input.event === "opened"
          ? null
          : coachingContent(
              p.topic,
              Boolean(
                p.reported_at || (!p.clicked_at && input.event === "reported"),
              ),
            ),
    });
  });
  route("post", "/practice/:id/send", admin, (req, res) => {
    validate(z.object({ acknowledged: z.literal(true) }).strict(), req.body);
    const p = s.one(
      "SELECT * FROM practice_assignments WHERE organization_id=? AND id=?",
      org(req),
      req.params.id,
    );
    if (!p || p.channel !== "Email")
      problem(
        404,
        "DELIVERY_UNAVAILABLE",
        "Email delivery is available only for email practice assignments.",
      );
    if (p.expires_at < iso() || p.status === "Completed")
      problem(
        409,
        "PRACTICE_ENDED",
        "Only active, incomplete practice can be sent.",
      );
    if (!process.env.SMTP_HOST)
      problem(
        409,
        "SMTP_UNCONFIGURED",
        "Configure SMTP before sending email practice.",
      );
    const user = s.one(
      "SELECT id FROM users WHERE organization_id=? AND id=? AND active=1",
      org(req),
      p.user_id,
    );
    if (!user) problem(404, "USER_NOT_FOUND", "Employee is no longer active.");
    const document = JSON.parse(p.document_json);
    deps.queue(
      org(req),
      p.user_id,
      "email",
      {
        title: document.subject,
        text: `AVERIS controlled security practice\n\n${document.message}\n\nReview your practice in the authenticated workspace: ${(process.env.PUBLIC_APP_URL || "http://localhost:4173").replace(/\/$/, "")}/employee/challenges/${p.id}\n\nDo not send passwords or authentication codes.`,
      },
      `practice-delivery:${p.id}`,
    );
    s.run(
      "UPDATE practice_assignments SET delivery='Email queued' WHERE id=?",
      p.id,
    );
    s.audit(
      org(req),
      req.auth.id,
      "Email practice queued",
      p.id,
      { acknowledged: true },
      { delivery: "SMTP queue" },
    );
    res.json({ queued: true });
  });
  route("post", "/reports/:id/triage", admin, async (req, res) => {
    const input = validate(z.object({ useAI: z.boolean() }).strict(), req.body);
    const report = s.one(
      "SELECT * FROM phishing_reports WHERE organization_id=? AND id=?",
      org(req),
      req.params.id,
    );
    if (!report) problem(404, "REPORT_NOT_FOUND", "Report was not found.");
    let analysis = {
      classification: "Unknown",
      confidence: "Low",
      indicators: [],
      summary:
        "Automated analysis is unavailable. A security reviewer should assess the original message.",
      nextAction:
        "Review sender, context, and links using your approved security tools. Do not close the report without a human decision.",
    };
    let provenance = "Human review required",
      model = null;
    if (input.useAI) {
      const result = await generateAI({
        enabled: s.settings(org(req)).ai_enabled,
        kind: "triage",
        input: {
          subject: report.subject,
          description: report.description,
          channel: report.channel,
        },
        schema: triageSchema,
      });
      analysis = result.document;
      provenance = result.provenance;
      model = result.model;
    }
    s.run(
      "INSERT INTO report_triage VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(report_id) DO UPDATE SET classification=excluded.classification,confidence=excluded.confidence,indicators_json=excluded.indicators_json,summary=excluded.summary,next_action=excluded.next_action,provenance=excluded.provenance,model=excluded.model,created_by=excluded.created_by,created_at=excluded.created_at",
      report.id,
      org(req),
      analysis.classification,
      analysis.confidence,
      JSON.stringify(analysis.indicators),
      analysis.summary,
      analysis.nextAction,
      provenance,
      model,
      req.auth.id,
      iso(),
    );
    s.audit(
      org(req),
      req.auth.id,
      "Report triage prepared",
      report.id,
      { sourceId: report.id },
      { ...analysis, provenance, model },
    );
    res.json({ analysis, provenance, model, reportStatus: report.status });
  });
  route("get", "/reports/:id/triage", admin, (req, res) => {
    const row = s.one(
      "SELECT * FROM report_triage WHERE report_id=? AND organization_id=?",
      req.params.id,
      org(req),
    );
    res.json({
      triage: row
        ? {
            ...row,
            indicators: JSON.parse(row.indicators_json),
            indicators_json: undefined,
          }
        : null,
      provider: providerStatus(s.settings(org(req)).ai_enabled),
    });
  });
  route("post", "/brief", admin, async (req, res) => {
    const overview = s.overview(org(req));
    if (!overview.brief.length)
      return res.json({
        brief: [],
        message: "No meaningful changes to summarize.",
      });
    const result = await generateAI({
      enabled: s.settings(org(req)).ai_enabled,
      kind: "risk_brief",
      input: {
        summary: overview.brief,
        coverage: overview.coverage,
        score: overview.score,
        trend: overview.trend,
      },
      schema: z
        .object({
          summary: z.string().max(2000),
          evidence: z.array(z.string().max(1000)).max(5),
        })
        .strict(),
    });
    s.audit(
      org(req),
      req.auth.id,
      "Risk brief generated",
      null,
      { signals: overview.eventCount },
      { ...result },
    );
    res.json(result);
  });

  registerConnectors();
  function registerConnectors() {
    route("get", "/integrations", admin, (req, res) =>
      res.json({
        connectors: s.all(
          "SELECT id,name,active,created_at,last_seen_at FROM signal_connectors WHERE organization_id=?",
          org(req),
        ),
        integrations: [
          {
            name: "Organization SSO / OIDC",
            category: "Identity",
            status: ssoConfigured() ? "Configured" : "Configuration required",
          },
          {
            name: "Email / SMTP",
            category: "Email",
            status: process.env.SMTP_HOST
              ? "Configured"
              : "Configuration required",
          },
          {
            name: "Signed webhook / REST API",
            category: "Signals",
            status: "Available",
          },
          ...[
            "Microsoft Entra ID",
            "Okta",
            "Google Workspace",
            "Microsoft 365",
            "Gmail",
            "Microsoft Defender",
            "CrowdStrike",
            "Zscaler",
            "Workday",
            "BambooHR",
            "SCIM",
            "Teams",
            "Slack",
            "Microsoft Sentinel",
            "Splunk",
          ].map((name) => ({
            name,
            category: "Named connector",
            status: "Planned",
          })),
        ],
      }),
    );
    route("post", "/connectors", admin, (req, res) => {
      const input = validate(
        z.object({ name: z.string().trim().min(3).max(120) }).strict(),
        req.body,
      );
      const id = randomUUID(),
        token = randomBytes(32).toString("base64url"),
        secret = randomBytes(32).toString("hex");
      s.run(
        "INSERT INTO signal_connectors(id,organization_id,name,token_hash,signing_secret,created_by,created_at) VALUES (?,?,?,?,?,?,?)",
        id,
        org(req),
        input.name,
        hash(token),
        seal(secret, sessionSecret),
        req.auth.id,
        iso(),
      );
      s.audit(
        org(req),
        req.auth.id,
        "Signal connector created",
        id,
        { name: input.name },
        {},
      );
      res.status(201).json({
        id,
        token,
        signingSecret: secret,
        endpoint: `/api/signals/${id}`,
      });
    });
    route("post", "/connectors/:id/revoke", admin, (req, res) => {
      const result = s.run(
        "UPDATE signal_connectors SET active=0 WHERE organization_id=? AND id=?",
        org(req),
        req.params.id,
      );
      if (!result.changes)
        problem(404, "CONNECTOR_NOT_FOUND", "Connector was not found.");
      s.audit(
        org(req),
        req.auth.id,
        "Signal connector revoked",
        req.params.id,
        {},
        {},
      );
      res.json({ revoked: true });
    });
    app.post(
      "/api/signals/:id",
      rateLimit({
        windowMs: 60000,
        limit: 60,
        standardHeaders: true,
        legacyHeaders: false,
      }),
      wrap((req, res) => {
        const connector = s.one(
          "SELECT * FROM signal_connectors WHERE id=? AND active=1",
          req.params.id,
        );
        const token = req.get("authorization")?.replace(/^Bearer /, "");
        if (!connector || !token || hash(token) !== connector.token_hash)
          problem(401, "CONNECTOR_AUTH", "Connector authentication failed.");
        const timestamp = req.get("x-averis-timestamp") || "",
          signature = req.get("x-averis-signature") || "",
          deliveryId = req.get("x-averis-delivery-id") || "";
        if (
          !/^\d{13}$/.test(timestamp) ||
          Math.abs(Date.now() - Number(timestamp)) > 300000 ||
          !/^\w[\w-]{5,199}$/.test(deliveryId) ||
          !/^[a-f0-9]{64}$/i.test(signature)
        )
          problem(
            401,
            "INVALID_SIGNATURE",
            "Use a fresh timestamp, delivery ID, and valid signature.",
          );
        const expected = createHmac(
          "sha256",
          unseal(connector.signing_secret, sessionSecret),
        )
          .update(`${timestamp}.${deliveryId}.`)
          .update(req.rawBody || Buffer.from(JSON.stringify(req.body)))
          .digest();
        const actual = Buffer.from(signature, "hex");
        if (
          actual.length !== expected.length ||
          !timingSafeEqual(actual, expected)
        )
          problem(401, "INVALID_SIGNATURE", "Signature validation failed.");
        const input = validate(
          z.object({ events: z.array(signalInput).min(1).max(100) }).strict(),
          req.body,
        );
        const result = s.db.transaction(() => {
          if (
            s.one(
              "SELECT 1 FROM connector_deliveries WHERE connector_id=? AND delivery_id=?",
              connector.id,
              deliveryId,
            )
          )
            return { duplicate: true };
          const ids = input.events.map((event) =>
            s.ingest(connector.organization_id, {
              ...event,
              source: `Connector: ${connector.id}`,
            }),
          );
          s.run(
            "INSERT INTO connector_deliveries VALUES (?,?,?)",
            connector.id,
            deliveryId,
            iso(),
          );
          s.run(
            "UPDATE signal_connectors SET last_seen_at=? WHERE id=?",
            iso(),
            connector.id,
          );
          s.audit(
            connector.organization_id,
            null,
            "External signals ingested",
            connector.id,
            { deliveryId, count: ids.length },
            { ids },
          );
          return { accepted: ids.length };
        })();
        res.json(result);
      }),
    );
  }
  return { tick: automation.tick, service: s };
}
