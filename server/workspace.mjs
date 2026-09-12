import {
  randomUUID,
  randomBytes,
  createHash,
  createHmac,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { parse } from "csv-parse/sync";
import { rateLimit } from "express-rate-limit";
import { migrate } from "./migrations.mjs";
import { newTotpSecret, totp, seal, unseal, verifyMfa } from "./identity.mjs";
import { ssoConfigured } from "./sso.mjs";
import { registerIntelligence } from "./intelligence/routes.mjs";

const now = () => new Date().toISOString();
const id = () => randomUUID();
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => JSON.parse(value);
const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
const average = (values) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
const fail = (status, code, message) => {
  throw Object.assign(new Error(message), { status, code });
};
const admin = ["super_admin", "admin"];
const viewers = [...admin, "manager"];
const weights = {
  knowledge: 0.35,
  behavior: 0.3,
  reporting: 0.2,
  improvement: 0.15,
};
const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);
const baseUrl = () =>
  (process.env.PUBLIC_APP_URL || "http://localhost:4173").replace(/\/$/, "");
const courseSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    category: z.string().trim().min(2).max(100),
    description: z.string().trim().max(2000),
    duration: z.number().int().min(1).max(600),
    difficulty: z.enum(["Foundation", "Intermediate", "Advanced"]),
    language: z.enum(["id", "en"]),
    passingScore: z.number().int().min(1).max(100),
    maxAttempts: z.number().int().min(1).max(20),
    retryMinutes: z.number().int().min(0).max(43200),
    lessons: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(150),
            content: z.string().trim().min(1).max(20000),
            kind: z
              .enum(["Article", "Scenario", "Checklist", "Security tip"])
              .default("Article"),
          })
          .strict(),
      )
      .min(1)
      .max(40),
    questions: z
      .array(
        z
          .object({
            prompt: z.string().trim().min(3).max(2000),
            type: z.enum(["choice", "multiple", "boolean", "scenario"]),
            options: z.array(z.string().trim().min(1).max(500)).min(2).max(10),
            correct: z.array(z.number().int().min(0)).min(1),
            explanation: z.string().trim().min(1).max(2000),
          })
          .strict()
          .refine(
            (q) =>
              new Set(q.correct).size === q.correct.length &&
              q.correct.every((i) => i < q.options.length) &&
              (q.type === "multiple" || q.correct.length === 1) &&
              (q.type !== "boolean" || q.options.length === 2),
          ),
      )
      .min(1)
      .max(100),
  })
  .strict();
const campaignSchema = z
  .object({
    name: z.string().trim().min(3).max(150),
    objective: z.string().trim().min(3).max(2000),
    ownerId: z.string().min(1),
    userIds: z.array(z.string()).max(5000),
    courseIds: z.array(z.string()).max(30),
    startAt: z.string().datetime().nullable(),
    dueAt: z.string().datetime().nullable(),
    baseline: z.boolean(),
    followup: z.boolean(),
    simulation: z
      .enum([
        "Password Expiration",
        "Shared Document",
        "Delivery Notification",
        "Account Security Alert",
        "Payroll / HR Notice",
      ])
      .nullable(),
    reminders: z.boolean(),
    version: z.number().int().optional(),
  })
  .strict();

export function registerWorkspace(app, deps) {
  const { db, authRequired, allowRoles, validate, writeAudit, sessionSecret } =
    deps;
  migrate(db);
  const q = (sql, ...args) => db.prepare(sql).all(...args);
  const one = (sql, ...args) => db.prepare(sql).get(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const org = (req) => req.auth.organization.id;
  const audit = (req, action, entityType, entityId, metadata = {}) =>
    writeAudit({
      organizationId: org(req),
      actorUserId: req.auth.id,
      action,
      entityType,
      entityId,
      metadata,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  const transaction = (fn) => db.transaction(fn)();
  const wrap = (fn) => async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (e) {
      next(e);
    }
  };
  const route = (method, path, roles, fn) =>
    app[method](
      `/api/workspace${path}`,
      authRequired,
      ...(roles ? [allowRoles(...roles)] : []),
      wrap(fn),
    );
  const accountLimiter = rateLimit({
    windowMs: 15 * 60000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Please wait before trying again.",
      },
    },
  });
  app.use("/api/workspace/mfa", accountLimiter);
  const course = (organizationId, revisionId) => {
    const row = one(
      "SELECT * FROM course_revisions WHERE organization_id=? AND id=?",
      organizationId,
      revisionId,
    );
    if (!row) fail(404, "COURSE_NOT_FOUND", "Learning content was not found.");
    return {
      ...row,
      document: json(row.document_json),
      document_json: undefined,
    };
  };
  // Seed the content catalog once, without importing unverified tenant scores.
  for (const row of q("SELECT * FROM courses")) {
    if (
      one(
        "SELECT id FROM course_revisions WHERE organization_id=? AND course_id=?",
        row.organization_id,
        row.id,
      )
    )
      continue;
    const questions = q(
      "SELECT * FROM questions WHERE organization_id=? AND course_id=? AND active=1",
      row.organization_id,
      row.id,
    );
    const lessons = q(
      "SELECT title,content FROM lessons WHERE organization_id=? AND course_id=? ORDER BY position",
      row.organization_id,
      row.id,
    );
    if (!questions.length || !lessons.length) continue;
    const document = {
      title: row.title,
      category: row.category,
      description: row.description,
      duration: row.duration_minutes,
      difficulty: "Foundation",
      language: "id",
      passingScore: row.passing_score,
      maxAttempts: row.max_attempts,
      retryMinutes: row.retry_delay_minutes,
      lessons: lessons.map((l) => ({ ...l, kind: "Article" })),
      questions: questions.map((q) => ({
        prompt: q.prompt,
        type: "choice",
        options: json(q.options_json),
        correct: [q.correct_index],
        explanation: q.explanation,
      })),
    };
    run(
      "INSERT INTO course_revisions(id,organization_id,course_id,version,status,document_json,created_at) VALUES (?,?,?,1,?,?,?)",
      id(),
      row.organization_id,
      row.id,
      "Published",
      JSON.stringify(document),
      now(),
    );
  }

  function scoreFor(organizationId, userId, before) {
    const rows = q(
      "SELECT e.* FROM score_events e WHERE organization_id=? AND user_id=? AND (? IS NULL OR created_at<?) AND NOT EXISTS (SELECT 1 FROM score_event_invalidations v WHERE v.event_id=e.id AND v.invalidated_at<=? AND (v.restored_at IS NULL OR v.restored_at>?)) ORDER BY created_at,e.rowid",
      organizationId,
      userId,
      before || null,
      before || null,
      before || now(),
      before || now(),
    );
    const components = {
      knowledge: null,
      behavior: null,
      reporting: null,
      improvement: null,
    };
    for (const row of rows) components[row.component] = row.value;
    const coverage = Object.entries(components).reduce(
      (n, [k, v]) => n + (v === null ? 0 : weights[k]),
      0,
    );
    const score = coverage
      ? Math.round(
          Object.entries(components).reduce(
            (n, [k, v]) => n + (v ?? 0) * weights[k],
            0,
          ) / coverage,
        )
      : null;
    return {
      score,
      components,
      coverage: Math.round(coverage * 100),
      lastUpdated: rows.at(-1)?.created_at || null,
      risk:
        score === null
          ? "Unmeasured"
          : score < 60
            ? "High"
            : score < 80
              ? "Medium"
              : "Low",
    };
  }
  function scoreEvent(
    organizationId,
    userId,
    component,
    value,
    reason,
    sourceId,
  ) {
    const previous = scoreFor(organizationId, userId).components[component];
    run(
      "INSERT OR IGNORE INTO score_events(id,organization_id,user_id,component,previous_value,value,reason,source_id,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      id(),
      organizationId,
      userId,
      component,
      previous,
      Math.min(100, Math.max(0, value)),
      reason,
      sourceId,
      now(),
    );
  }
  function notify(
    organizationId,
    userId,
    kind,
    title,
    link,
    key,
    email = true,
  ) {
    run(
      "INSERT OR IGNORE INTO user_notifications(id,organization_id,user_id,kind,title,link,created_at,dedupe_key) VALUES (?,?,?,?,?,?,?,?)",
      id(),
      organizationId,
      userId,
      kind,
      title,
      link,
      now(),
      key,
    );
    if (email)
      queue(
        organizationId,
        userId,
        "email",
        { title, text: `${title}\n${baseUrl()}${link}` },
        key,
      );
  }
  function queue(organizationId, userId, kind, payload, key) {
    run(
      "INSERT OR IGNORE INTO delivery_jobs(id,organization_id,user_id,kind,payload_json,available_at,created_at,dedupe_key) VALUES (?,?,?,?,?,?,?,?)",
      id(),
      organizationId,
      userId,
      kind,
      JSON.stringify(payload),
      now(),
      now(),
      key,
    );
  }
  function assignment(req, assignmentId) {
    const row = one(
      "SELECT a.*,p.status program_status,p.baseline FROM learning_assignments a JOIN programs p ON p.id=a.program_id WHERE a.organization_id=? AND a.user_id=? AND a.id=?",
      org(req),
      req.auth.id,
      assignmentId,
    );
    if (!row)
      fail(
        404,
        "ASSIGNMENT_NOT_FOUND",
        "This learning is not assigned to your account.",
      );
    if (row.program_status !== "Active")
      fail(409, "PROGRAM_INACTIVE", "This learning program is not active.");
    const baseline = one(
      "SELECT id FROM program_assessments WHERE program_id=? AND user_id=? AND kind='Baseline' AND completed_at IS NULL",
      row.program_id,
      req.auth.id,
    );
    if (baseline)
      fail(
        409,
        "BASELINE_REQUIRED",
        "Complete the initial assessment before starting this learning.",
      );
    return row;
  }
  function assignmentsFor(organizationId, userId) {
    return q(
      "SELECT a.*,p.name program_name,p.status program_status,r.document_json FROM learning_assignments a JOIN programs p ON p.id=a.program_id JOIN course_revisions r ON r.id=a.revision_id WHERE a.organization_id=? AND (? IS NULL OR a.user_id=?) ORDER BY a.due_at,a.id",
      organizationId,
      userId || null,
      userId || null,
    ).map((a) => {
      const d = json(a.document_json);
      return {
        ...a,
        document_json: undefined,
        title: d.title,
        category: d.category,
        duration: d.duration,
        lessons: d.lessons.length,
        overdue: a.status !== "Completed" && a.due_at < now(),
        progress:
          a.status === "Completed"
            ? 100
            : Math.round((a.lesson_index / d.lessons.length) * 100),
      };
    });
  }
  function assessmentsFor(organizationId, userId) {
    return q(
      "SELECT a.*,p.name program_name,p.status program_status FROM program_assessments a JOIN programs p ON p.id=a.program_id WHERE a.organization_id=? AND (? IS NULL OR a.user_id=?) ORDER BY a.rowid",
      organizationId,
      userId || null,
      userId || null,
    ).map((a) => ({
      ...a,
      questions_json: undefined,
      locked:
        a.program_status !== "Active" ||
        (a.kind === "Follow-up" &&
          Boolean(
            one(
              "SELECT id FROM learning_assignments WHERE program_id=? AND user_id=? AND status!='Completed'",
              a.program_id,
              a.user_id,
            ),
          )),
    }));
  }
  function people(organizationId) {
    const assignments = assignmentsFor(organizationId);
    return q(
      "SELECT id,email,name,department,role,active,created_at FROM users WHERE organization_id=? ORDER BY name",
      organizationId,
    ).map((u) => {
      const own = assignments.filter((a) => a.user_id === u.id);
      const completed = own.filter((a) => a.status === "Completed").length;
      return {
        ...u,
        ...scoreFor(organizationId, u.id),
        assigned: own.length,
        completed,
        completion: pct(completed, own.length),
        overdue: own.filter((a) => a.overdue).length,
        lastActivity:
          own
            .map((a) => a.updated_at)
            .sort()
            .at(-1) || null,
      };
    });
  }
  function metrics(organizationId, filters = {}) {
    const allPeople = people(organizationId).filter(
      (u) => u.role === "employee" && u.active,
    );
    const members = filters.campaignId
      ? new Set(
          q(
            "SELECT user_id FROM program_audience WHERE program_id=?",
            filters.campaignId,
          ).map((r) => r.user_id),
        )
      : null;
    const users = allPeople.filter(
      (u) =>
        (!filters.department || u.department === filters.department) &&
        (!filters.risk || u.risk === filters.risk) &&
        (!members || members.has(u.id)),
    );
    const ids = new Set(users.map((u) => u.id));
    const assignments = assignmentsFor(organizationId).filter(
      (a) =>
        ids.has(a.user_id) &&
        (!filters.campaignId || a.program_id === filters.campaignId),
    );
    // Keep employee export totals and department overdue counts in the same
    // campaign scope as the summary, rather than leaking cross-program totals.
    for (const user of users) {
      const selected = assignments.filter((a) => a.user_id === user.id);
      user.assigned = selected.length;
      user.completed = selected.filter((a) => a.completed_at).length;
      user.overdue = selected.filter((a) => a.overdue).length;
      user.completion = pct(user.completed, user.assigned);
    }
    const since =
      filters.from ||
      (filters.period && filters.period !== "all"
        ? new Date(Date.now() - Number(filters.period) * 86400000).toISOString()
        : null);
    const until = filters.to || null;
    const attempts = q(
      "SELECT t.*,a.user_id,a.program_id,r.document_json FROM learning_attempts t JOIN learning_assignments a ON a.id=t.assignment_id JOIN course_revisions r ON r.id=a.revision_id WHERE a.organization_id=? AND t.completed_at IS NOT NULL ORDER BY t.completed_at",
      organizationId,
    ).filter(
      (t) =>
        ids.has(t.user_id) &&
        (!filters.campaignId || t.program_id === filters.campaignId) &&
        (!since || t.completed_at >= since) &&
        (!until || t.completed_at <= until),
    );
    const targets = q(
      "SELECT * FROM simulation_targets WHERE organization_id=?",
      organizationId,
    ).filter(
      (t) =>
        ids.has(t.user_id) &&
        (!filters.campaignId || t.program_id === filters.campaignId) &&
        t.sent_at &&
        (!since || t.sent_at >= since) &&
        (!until || t.sent_at <= until),
    );
    const targetIds = new Set(targets.map((t) => t.id));
    const events = q(
      "SELECT e.* FROM safe_simulation_events e JOIN simulation_targets t ON t.id=e.target_id WHERE t.organization_id=?",
      organizationId,
    ).filter(
      (e) => targetIds.has(e.target_id) && (!until || e.created_at <= until),
    );
    const reported = events.filter((e) => e.event === "reported");
    const clicked = events.filter((e) => e.event === "clicked");
    const scored = users.filter((u) => u.score !== null);
    const current = average(scored.map((u) => u.score));
    const previous = since
      ? average(
          users
            .map((u) => scoreFor(organizationId, u.id, since).score)
            .filter((s) => s !== null),
        )
      : null;
    const topics = [
      ...new Set(attempts.map((t) => json(t.document_json).category)),
    ]
      .map((topic) => ({
        topic,
        score: average(
          attempts
            .filter((t) => json(t.document_json).category === topic)
            .map((t) => t.score),
        ),
        attempts: attempts.filter(
          (t) => json(t.document_json).category === topic,
        ).length,
      }))
      .sort((a, b) => a.score - b.score);
    const departments = [...new Set(users.map((u) => u.department || "—"))].map(
      (department) => {
        const group = users.filter((u) => (u.department || "—") === department);
        return {
          department,
          employees: group.length,
          score: average(group.map((u) => u.score).filter((s) => s !== null)),
          overdue: group.reduce((n, u) => n + u.overdue, 0),
          measured: group.filter((u) => u.score !== null).length,
        };
      },
    );
    const summary = {
      employees: users.length,
      score: current,
      previousScore: previous,
      change: current !== null && previous !== null ? current - previous : null,
      coverage: pct(scored.length, users.length),
      componentCoverage: average(scored.map((u) => u.coverage)),
      assigned: assignments.length,
      participation: pct(
        new Set(assignments.filter((a) => a.started_at).map((a) => a.user_id))
          .size,
        new Set(assignments.map((a) => a.user_id)).size,
      ),
      assignmentCompletion: pct(
        assignments.filter((a) => a.completed_at).length,
        assignments.length,
      ),
      quizPassRate: pct(
        attempts.filter((t) => t.passed).length,
        attempts.length,
      ),
      attempts: attempts.length,
      overdue: assignments.filter((a) => a.overdue).length,
      reportingRate: pct(reported.length, targets.length),
      clickRate: pct(clicked.length, targets.length),
      delivered: targets.length,
      opened: events.filter((e) => e.event === "opened").length,
      clicked: clicked.length,
      reported: reported.length,
      noAction: targets.filter(
        (t) =>
          !events.some(
            (e) =>
              e.target_id === t.id && ["clicked", "reported"].includes(e.event),
          ),
      ).length,
      reportMinutes: average(
        reported.map((e) =>
          Math.max(
            0,
            (new Date(e.created_at) -
              new Date(targets.find((t) => t.id === e.target_id).sent_at)) /
              60000,
          ),
        ),
      ),
    };
    return {
      summary,
      users,
      assignments,
      attempts: attempts.map((t) => ({
        ...t,
        questions_json: undefined,
        answers_json: undefined,
        document_json: undefined,
      })),
      topics,
      departments,
      risk: ["High", "Medium", "Low", "Unmeasured"].map((label) => ({
        label,
        count: users.filter((u) => u.risk === label).length,
      })),
      events,
      targets,
      methodology: {
        weights,
        missing:
          "Available components are reweighted; coverage indicates measured evidence, not certainty.",
        thresholds: { high: 60, medium: 80 },
        version: "1.0",
      },
    };
  }

  route("get", "/summary", viewers, (req, res) =>
    res.json(
      metrics(
        org(req),
        validate(
          z
            .object({
              period: z.enum(["7", "30", "90", "365", "all"]).default("30"),
              department: z.string().max(100).optional(),
              risk: z.enum(["High", "Medium", "Low", "Unmeasured"]).optional(),
              campaignId: z.string().optional(),
              from: z.string().datetime().optional(),
              to: z.string().datetime().optional(),
            })
            .strict(),
          req.query,
        ),
      ),
    ),
  );
  route("get", "/people", viewers, (req, res) =>
    res.json({
      people: people(org(req)).filter(
        (u) => req.auth.role !== "manager" || u.role === "employee",
      ),
    }),
  );
  route("get", "/people/:id", viewers, (req, res) => {
    const user = people(org(req)).find(
      (u) =>
        u.id === req.params.id &&
        (req.auth.role !== "manager" || u.role === "employee"),
    );
    if (!user) fail(404, "USER_NOT_FOUND", "Employee was not found.");
    res.json({
      user,
      assignments: assignmentsFor(org(req), user.id),
      assessments: assessmentsFor(org(req), user.id),
      events: q(
        "SELECT * FROM score_events WHERE organization_id=? AND user_id=? ORDER BY created_at DESC,rowid DESC",
        org(req),
        user.id,
      ),
      attempts: q(
        "SELECT t.id,t.score,t.passed,t.attempt,t.completed_at FROM learning_attempts t JOIN learning_assignments a ON a.id=t.assignment_id WHERE a.organization_id=? AND a.user_id=?",
        org(req),
        user.id,
      ),
      simulations: q(
        "SELECT t.id,t.sent_at,e.event,e.created_at FROM simulation_targets t LEFT JOIN safe_simulation_events e ON e.target_id=t.id WHERE t.organization_id=? AND t.user_id=?",
        org(req),
        user.id,
      ),
      certificates: q(
        "SELECT * FROM certificate_records WHERE organization_id=? AND user_id=?",
        org(req),
        user.id,
      ),
    });
  });
  route("get", "/me", null, (req, res) =>
    res.json({
      ...scoreFor(org(req), req.auth.id),
      assignments: assignmentsFor(org(req), req.auth.id),
      assessments: assessmentsFor(org(req), req.auth.id),
      events: q(
        "SELECT * FROM score_events WHERE organization_id=? AND user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100",
        org(req),
        req.auth.id,
      ),
      certificates: q(
        "SELECT * FROM certificate_records WHERE organization_id=? AND user_id=? ORDER BY issued_at DESC",
        org(req),
        req.auth.id,
      ),
      notifications: q(
        "SELECT * FROM user_notifications WHERE organization_id=? AND user_id=? ORDER BY created_at DESC LIMIT 30",
        org(req),
        req.auth.id,
      ),
    }),
  );
  route("post", "/notifications/:id/read", null, (req, res) => {
    run(
      "UPDATE user_notifications SET read_at=? WHERE id=? AND organization_id=? AND user_id=?",
      now(),
      req.params.id,
      org(req),
      req.auth.id,
    );
    res.status(204).end();
  });

  route("get", "/courses", viewers, (req, res) => {
    const rows = q(
      "SELECT r.* FROM course_revisions r WHERE organization_id=? AND version=(SELECT MAX(version) FROM course_revisions c WHERE c.organization_id=r.organization_id AND c.course_id=r.course_id) ORDER BY created_at DESC",
      org(req),
    );
    res.json({
      courses: rows.map((r) => {
        const d = json(r.document_json);
        const usage = one(
          "SELECT COUNT(*) assigned,SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) completed FROM learning_assignments WHERE organization_id=? AND revision_id IN (SELECT id FROM course_revisions WHERE organization_id=? AND course_id=?)",
          org(req),
          org(req),
          r.course_id,
        );
        return {
          ...r,
          document_json: undefined,
          document: d,
          isDefault: r.course_id.startsWith("averis-v2:"),
          ...usage,
        };
      }),
    });
  });
  route("get", "/courses/:id", viewers, (req, res) => {
    const r = course(org(req), req.params.id);
    res.json({
      course: r,
      versions: q(
        "SELECT id,version,status,created_at FROM course_revisions WHERE organization_id=? AND course_id=? ORDER BY version DESC",
        org(req),
        r.course_id,
      ),
    });
  });
  route("post", "/courses", admin, (req, res) => {
    const input = validate(
      z
        .object({
          document: courseSchema,
          courseId: z.string().optional(),
          baseVersion: z.number().int().optional(),
          status: z.enum(["Draft", "Published"]),
        })
        .strict(),
      req.body,
    );
    const courseId = input.courseId || id();
    let revisionId;
    transaction(() => {
      const latest =
        one(
          "SELECT MAX(version) version FROM course_revisions WHERE organization_id=? AND course_id=?",
          org(req),
          courseId,
        )?.version || 0;
      if (input.courseId && (!latest || input.baseVersion !== latest))
        fail(
          409,
          "VERSION_CONFLICT",
          "Content changed. Reload the latest version before saving.",
        );
      revisionId = id();
      run(
        "INSERT INTO course_revisions(id,organization_id,course_id,version,status,document_json,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)",
        revisionId,
        org(req),
        courseId,
        latest + 1,
        input.status,
        JSON.stringify(input.document),
        req.auth.id,
        now(),
      );
      audit(
        req,
        input.status === "Published"
          ? "Learning published"
          : "Learning draft saved",
        "course",
        courseId,
        { version: latest + 1 },
      );
    });
    res.status(201).json({ course: course(org(req), revisionId) });
  });
  route("post", "/courses/:id/archive", admin, (req, res) => {
    const r = course(org(req), req.params.id);
    run(
      "UPDATE course_revisions SET status='Archived' WHERE organization_id=? AND course_id=?",
      org(req),
      r.course_id,
    );
    audit(req, "Learning archived", "course", r.course_id);
    res.status(204).end();
  });

  function program(organizationId, programId) {
    const row = one(
      "SELECT * FROM programs WHERE organization_id=? AND id=?",
      organizationId,
      programId,
    );
    if (!row) fail(404, "CAMPAIGN_NOT_FOUND", "Campaign was not found.");
    return row;
  }
  function programDetail(organizationId, programId) {
    const p = program(organizationId, programId);
    const m = metrics(organizationId, { campaignId: p.id, period: "all" });
    const assessments = q(
      "SELECT id,user_id,kind,score,completed_at FROM program_assessments WHERE program_id=?",
      p.id,
    );
    const before = average(
      assessments
        .filter((a) => a.kind === "Baseline" && a.score !== null)
        .map((a) => a.score),
    );
    const after = average(
      assessments
        .filter((a) => a.kind === "Follow-up" && a.score !== null)
        .map((a) => a.score),
    );
    return {
      ...p,
      userIds: q(
        "SELECT user_id FROM program_audience WHERE program_id=?",
        p.id,
      ).map((r) => r.user_id),
      courses: q(
        "SELECT revision_id FROM program_courses WHERE program_id=?",
        p.id,
      ).map((r) => course(organizationId, r.revision_id)),
      ...m,
      assessments,
      before,
      after,
      improvement: before !== null && after !== null ? after - before : null,
      activity: q(
        "SELECT action,metadata_json,created_at FROM audit_logs WHERE organization_id=? AND entity_id=? ORDER BY created_at DESC LIMIT 50",
        organizationId,
        p.id,
      ).map((r) => ({
        ...r,
        metadata: json(r.metadata_json),
        metadata_json: undefined,
      })),
    };
  }
  route("get", "/campaigns", viewers, (req, res) =>
    res.json({
      campaigns: q(
        "SELECT id FROM programs WHERE organization_id=? ORDER BY created_at DESC",
        org(req),
      ).map((p) => {
        const d = programDetail(org(req), p.id);
        return {
          ...d,
          courses: d.courses.map((c) => ({
            id: c.id,
            title: c.document.title,
          })),
          activity: undefined,
          assignments: undefined,
          attempts: undefined,
          events: undefined,
          targets: undefined,
        };
      }),
    }),
  );
  route("get", "/campaigns/:id", viewers, (req, res) =>
    res.json({ campaign: programDetail(org(req), req.params.id) }),
  );
  function saveProgram(req, programId) {
    const input = validate(campaignSchema, req.body);
    transaction(() => {
      const previous = programId ? program(org(req), programId) : null;
      if (
        previous &&
        (!["Draft", "Scheduled"].includes(previous.status) ||
          previous.version !== input.version)
      )
        fail(
          409,
          "VERSION_CONFLICT",
          "Only the latest draft or scheduled campaign can be edited.",
        );
      if (
        !one(
          "SELECT id FROM users WHERE organization_id=? AND id=? AND role!='employee' AND active=1",
          org(req),
          input.ownerId,
        )
      )
        fail(400, "INVALID_OWNER", "Choose an active program owner.");
      const userIds = [...new Set(input.userIds)];
      const courseIds = [...new Set(input.courseIds)];
      if (
        userIds.some(
          (uid) =>
            !one(
              "SELECT id FROM users WHERE organization_id=? AND id=? AND role='employee' AND active=1",
              org(req),
              uid,
            ),
        )
      )
        fail(
          400,
          "INVALID_AUDIENCE",
          "Audience contains an unavailable employee.",
        );
      if (courseIds.some((cid) => course(org(req), cid).status !== "Published"))
        fail(400, "UNPUBLISHED_CONTENT", "Choose published learning content.");
      if (input.startAt && input.dueAt && input.startAt >= input.dueAt)
        fail(400, "INVALID_DATES", "Deadline must be after the start date.");
      if (
        previous?.status === "Scheduled" &&
        (!input.dueAt || !userIds.length || !courseIds.length)
      )
        fail(
          400,
          "INCOMPLETE_CAMPAIGN",
          "Scheduled campaigns need an audience, learning, and deadline.",
        );
      programId ||= id();
      if (previous)
        run(
          "UPDATE programs SET name=?,objective=?,owner_id=?,start_at=?,due_at=?,baseline=?,followup=?,simulation=?,reminders=?,version=version+1,updated_at=? WHERE id=?",
          input.name,
          input.objective,
          input.ownerId,
          input.startAt,
          input.dueAt,
          Number(input.baseline),
          Number(input.followup),
          input.simulation,
          Number(input.reminders),
          now(),
          programId,
        );
      else
        run(
          "INSERT INTO programs(id,organization_id,name,objective,owner_id,start_at,due_at,baseline,followup,simulation,reminders,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          programId,
          org(req),
          input.name,
          input.objective,
          input.ownerId,
          input.startAt,
          input.dueAt,
          Number(input.baseline),
          Number(input.followup),
          input.simulation,
          Number(input.reminders),
          now(),
          now(),
        );
      run("DELETE FROM program_audience WHERE program_id=?", programId);
      run("DELETE FROM program_courses WHERE program_id=?", programId);
      userIds.forEach((uid) =>
        run("INSERT INTO program_audience VALUES (?,?)", programId, uid),
      );
      courseIds.forEach((cid) =>
        run("INSERT INTO program_courses VALUES (?,?)", programId, cid),
      );
      audit(
        req,
        previous ? "Campaign updated" : "Campaign created",
        "program",
        programId,
        { name: input.name },
      );
    });
    return programId;
  }
  route("post", "/campaigns", viewers, (req, res) =>
    res.status(201).json({ id: saveProgram(req) }),
  );
  route("put", "/campaigns/:id", admin, (req, res) =>
    res.json({ id: saveProgram(req, req.params.id) }),
  );
  function activate(p) {
    const users = q(
      "SELECT u.id FROM program_audience a JOIN users u ON u.id=a.user_id WHERE a.program_id=? AND u.active=1",
      p.id,
    );
    const revisions = q(
      "SELECT revision_id FROM program_courses WHERE program_id=?",
      p.id,
    ).map((r) => course(p.organization_id, r.revision_id));
    if (!users.length || !revisions.length || !p.due_at || p.due_at <= now())
      fail(
        409,
        "INCOMPLETE_CAMPAIGN",
        "Select active employees, learning, and a future deadline before launch.",
      );
    run(
      "UPDATE programs SET status='Active',version=version+1,updated_at=? WHERE id=?",
      now(),
      p.id,
    );
    for (const u of users) {
      for (const r of revisions)
        run(
          "INSERT OR IGNORE INTO learning_assignments(id,organization_id,program_id,user_id,revision_id,due_at,updated_at) VALUES (?,?,?,?,?,?,?)",
          id(),
          p.organization_id,
          p.id,
          u.id,
          r.id,
          p.due_at,
          now(),
        );
      const questions = revisions
        .flatMap((r) => r.document.questions)
        .slice(0, 20);
      for (const kind of [
        p.baseline ? "Baseline" : null,
        p.followup ? "Follow-up" : null,
      ].filter(Boolean))
        run(
          "INSERT OR IGNORE INTO program_assessments(id,organization_id,program_id,user_id,kind,questions_json) VALUES (?,?,?,?,?,?)",
          id(),
          p.organization_id,
          p.id,
          u.id,
          kind,
          JSON.stringify(questions),
        );
      notify(
        p.organization_id,
        u.id,
        "assignment",
        p.name,
        "/employee/learning",
        `assignment:${p.id}:${u.id}`,
      );
      if (
        p.simulation &&
        !one(
          "SELECT id FROM simulation_targets WHERE program_id=? AND user_id=?",
          p.id,
          u.id,
        )
      ) {
        const token = randomBytes(32).toString("base64url");
        const targetId = id();
        run(
          "INSERT INTO simulation_targets(id,organization_id,program_id,user_id,token_hash,expires_at) VALUES (?,?,?,?,?,?)",
          targetId,
          p.organization_id,
          p.id,
          u.id,
          digest(`${sessionSecret}:${token}`),
          p.due_at,
        );
        queue(
          p.organization_id,
          u.id,
          "simulation",
          {
            title: `${p.simulation} — tindakan diperlukan`,
            text: `Halo ${u.name || "rekan"},\n\nAnda menerima notifikasi yang memerlukan perhatian. Tinjau pesan ini dengan teliti sebelum membuka tautan atau membagikan informasi.\n\nBuka simulasi: ${baseUrl()}/simulation/${token}\n\nIni adalah latihan keamanan resmi AVERIS. Jangan memasukkan password atau data rahasia.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:620px;color:#17202a"><div style="border-bottom:4px solid #c6283d;padding:18px 0"><strong style="letter-spacing:2px;color:#c6283d">AVERIS SECURITY NOTICE</strong></div><p>Halo ${String(u.name || "rekan").replace(/[<>]/g, "")},</p><p>Anda menerima notifikasi yang memerlukan perhatian. Periksa pengirim, konteks, alamat tautan, dan urgensi pesan sebelum mengambil tindakan.</p><div style="background:#f8f5f5;border:1px solid #e3d7d9;padding:16px;margin:20px 0"><strong>Action required</strong><p style="margin:8px 0 0">Tinjau detail notifikasi keamanan organisasi Anda.</p></div><p><a href="${baseUrl()}/simulation/${token}" style="display:inline-block;background:#c6283d;color:#fff;padding:12px 18px;text-decoration:none;font-weight:bold">Tinjau notifikasi</a></p><p style="font-size:12px;color:#667085">Jika Anda ragu, gunakan tombol Report Phishing di AVERIS. Jangan pernah memasukkan password pada halaman simulasi.</p><hr/><p style="font-size:11px;color:#98a2b3">Latihan simulasi keamanan resmi AVERIS · Tidak ada kredensial yang dikumpulkan</p></div>`,
            targetId,
          },
          `simulation:${p.id}:${u.id}`,
        );
      }
    }
  }
  route("post", "/campaigns/:id/action", admin, (req, res) => {
    const input = validate(
      z
        .object({
          action: z.enum([
            "launch",
            "draft",
            "cancel",
            "end",
            "archive",
            "remind",
          ]),
          version: z.number().int(),
        })
        .strict(),
      req.body,
    );
    transaction(() => {
      const p = program(org(req), req.params.id);
      if (p.version !== input.version)
        fail(
          409,
          "VERSION_CONFLICT",
          "Campaign changed. Refresh before continuing.",
        );
      const permitted = {
        launch: ["Draft"],
        draft: ["Scheduled"],
        cancel: ["Draft", "Scheduled"],
        end: ["Active"],
        archive: ["Completed"],
        remind: ["Active"],
      };
      if (!permitted[input.action].includes(p.status))
        fail(
          409,
          "INVALID_TRANSITION",
          "This action is not available for the campaign status.",
        );
      if (input.action === "launch") {
        const count = one(
          "SELECT COUNT(*) n FROM program_audience WHERE program_id=?",
          p.id,
        ).n;
        const courses = one(
          "SELECT COUNT(*) n FROM program_courses WHERE program_id=?",
          p.id,
        ).n;
        if (!count || !courses || !p.due_at || p.due_at <= now())
          fail(
            400,
            "INCOMPLETE_CAMPAIGN",
            "Select employees, learning and a future deadline before launch.",
          );
        if (p.start_at && p.start_at > now())
          run(
            "UPDATE programs SET status='Scheduled',version=version+1,updated_at=? WHERE id=?",
            now(),
            p.id,
          );
        else activate(p);
      } else if (input.action === "remind") {
        const users = q(
          "SELECT DISTINCT user_id FROM learning_assignments WHERE program_id=? AND status!='Completed'",
          p.id,
        );
        users.forEach((u) =>
          notify(
            org(req),
            u.user_id,
            "reminder",
            p.name,
            "/employee/learning",
            `manual:${p.id}:${u.user_id}:${now().slice(0, 10)}`,
          ),
        );
      } else
        run(
          "UPDATE programs SET status=?,version=version+1,updated_at=? WHERE id=?",
          {
            draft: "Draft",
            cancel: "Cancelled",
            end: "Completed",
            archive: "Archived",
          }[input.action],
          now(),
          p.id,
        );
      audit(req, `Campaign ${input.action}`, "program", p.id, {
        name: p.name,
        previous: p.status,
      });
    });
    res.json({ campaign: programDetail(org(req), req.params.id) });
  });

  const publicQuestions = (questions) =>
    questions.map(({ correct, explanation, ...q }) => q);
  const grade = (questions, answers) => {
    if (
      questions.length !== answers.length ||
      answers.some(
        (a, i) =>
          !a.length ||
          new Set(a).size !== a.length ||
          a.some((n) => n < 0 || n >= questions[i].options.length) ||
          (questions[i].type !== "multiple" && a.length !== 1),
      )
    )
      fail(
        400,
        "INCOMPLETE_ANSWERS",
        "Answer every question before submitting.",
      );
    const correct = questions.map(
      (q, i) =>
        JSON.stringify([...q.correct].sort()) ===
        JSON.stringify([...answers[i]].sort()),
    );
    return {
      score: Math.round(
        (correct.filter(Boolean).length / questions.length) * 100,
      ),
      review: questions.map((q, i) => ({
        ...q,
        selected: answers[i],
        isCorrect: correct[i],
      })),
    };
  };
  const answerSchema = z
    .object({
      answers: z
        .array(z.array(z.number().int().min(0).max(9)).max(10))
        .min(1)
        .max(100),
    })
    .strict();
  route("get", "/learning/:id", ["employee"], (req, res) => {
    const a = assignment(req, req.params.id);
    const r = course(org(req), a.revision_id);
    const { questions, ...document } = r.document;
    res.json({
      assignment: a,
      document,
      questionCount: questions.length,
      attempts: q(
        "SELECT id,attempt,score,passed,completed_at,retry_at FROM learning_attempts WHERE assignment_id=? ORDER BY attempt DESC",
        a.id,
      ),
    });
  });
  route("post", "/learning/:id/progress", ["employee"], (req, res) => {
    const { lessonIndex } = validate(
      z.object({ lessonIndex: z.number().int().min(0) }).strict(),
      req.body,
    );
    transaction(() => {
      const a = assignment(req, req.params.id);
      const r = course(org(req), a.revision_id);
      if (
        lessonIndex > a.lesson_index + 1 ||
        lessonIndex > r.document.lessons.length
      )
        fail(400, "INVALID_PROGRESS", "Complete the current lesson first.");
      if (a.status !== "Completed")
        run(
          "UPDATE learning_assignments SET lesson_index=?,status=?,started_at=COALESCE(started_at,?),updated_at=? WHERE id=?",
          Math.max(a.lesson_index, lessonIndex),
          lessonIndex === r.document.lessons.length
            ? "Quiz Available"
            : "In Progress",
          now(),
          now(),
          a.id,
        );
    });
    res.status(204).end();
  });
  route("post", "/learning/:id/quiz", ["employee"], (req, res) => {
    let attempt;
    transaction(() => {
      const a = assignment(req, req.params.id);
      const r = course(org(req), a.revision_id);
      if (a.lesson_index < r.document.lessons.length)
        fail(
          409,
          "CONTENT_REQUIRED",
          "Finish the learning before starting the quiz.",
        );
      const attempts = q(
        "SELECT * FROM learning_attempts WHERE assignment_id=? ORDER BY attempt DESC",
        a.id,
      );
      if (attempts.some((t) => t.passed))
        fail(409, "ALREADY_PASSED", "You have already passed this learning.");
      attempt = attempts.find((t) => !t.completed_at);
      if (!attempt) {
        if (attempts.length >= r.document.maxAttempts)
          fail(
            409,
            "ATTEMPTS_EXHAUSTED",
            "All attempts have been used. Contact your administrator for a new assignment.",
          );
        if (attempts[0]?.retry_at > now())
          fail(
            409,
            "RETRY_NOT_READY",
            "Review the lesson and return after the waiting period.",
          );
        const questions = [...r.document.questions];
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        attempt = {
          id: id(),
          attempt: attempts.length + 1,
          questions_json: JSON.stringify(questions),
        };
        run(
          "INSERT INTO learning_attempts(id,assignment_id,attempt,questions_json,started_at) VALUES (?,?,?,?,?)",
          attempt.id,
          a.id,
          attempt.attempt,
          attempt.questions_json,
          now(),
        );
        audit(req, "Quiz started", "assignment", a.id);
      }
    });
    res.json({
      attempt: { id: attempt.id, number: attempt.attempt },
      questions: publicQuestions(json(attempt.questions_json)),
    });
  });
  route("post", "/learning/:id/quiz/:attemptId", ["employee"], (req, res) => {
    const input = validate(answerSchema, req.body);
    let result;
    transaction(() => {
      const a = assignment(req, req.params.id);
      const r = course(org(req), a.revision_id);
      const t = one(
        "SELECT * FROM learning_attempts WHERE id=? AND assignment_id=?",
        req.params.attemptId,
        a.id,
      );
      if (!t) fail(404, "ATTEMPT_NOT_FOUND", "Quiz attempt was not found.");
      if (t.completed_at)
        fail(409, "ATTEMPT_COMPLETED", "This quiz has already been submitted.");
      result = grade(json(t.questions_json), input.answers);
      const passed = result.score >= r.document.passingScore;
      const retryAt = passed
        ? null
        : new Date(Date.now() + r.document.retryMinutes * 60000).toISOString();
      run(
        "UPDATE learning_attempts SET answers_json=?,score=?,passed=?,completed_at=?,retry_at=? WHERE id=?",
        JSON.stringify(input.answers),
        result.score,
        Number(passed),
        now(),
        retryAt,
        t.id,
      );
      scoreEvent(
        org(req),
        req.auth.id,
        "knowledge",
        result.score,
        "Quiz completed",
        t.id,
      );
      if (passed) {
        run(
          "UPDATE learning_assignments SET status='Completed',completed_at=?,updated_at=? WHERE id=?",
          now(),
          now(),
          a.id,
        );
        const certificateId = `AVR-${randomBytes(12).toString("hex").toUpperCase()}`;
        run(
          "INSERT OR IGNORE INTO certificate_records(id,organization_id,user_id,assignment_id,title,score,issued_at) VALUES (?,?,?,?,?,?,?)",
          certificateId,
          org(req),
          req.auth.id,
          a.id,
          r.document.title,
          result.score,
          now(),
        );
        notify(
          org(req),
          req.auth.id,
          "certificate",
          r.document.title,
          "/employee/certificates",
          `certificate:${a.id}`,
        );
        if (
          !one(
            "SELECT id FROM learning_assignments WHERE program_id=? AND user_id=? AND status!='Completed'",
            a.program_id,
            req.auth.id,
          )
        )
          notify(
            org(req),
            req.auth.id,
            "assessment",
            "Follow-up assessment",
            "/employee/learning",
            `followup:${a.program_id}:${req.auth.id}`,
          );
      }
      audit(
        req,
        passed ? "Quiz passed" : "Quiz completed — review needed",
        "assignment",
        a.id,
        { score: result.score },
      );
      result = {
        ...result,
        passed,
        retryAt,
        remainingAttempts: r.document.maxAttempts - t.attempt,
      };
    });
    res.json(result);
  });
  route("get", "/learning/:id/result", ["employee"], (req, res) => {
    const a = one(
      "SELECT * FROM learning_assignments WHERE id=? AND organization_id=? AND user_id=?",
      req.params.id,
      org(req),
      req.auth.id,
    );
    if (!a) fail(404, "ASSIGNMENT_NOT_FOUND", "Learning was not found.");
    const t = one(
      "SELECT * FROM learning_attempts WHERE assignment_id=? AND completed_at IS NOT NULL ORDER BY attempt DESC LIMIT 1",
      a.id,
    );
    if (!t) fail(404, "RESULT_NOT_FOUND", "Complete a quiz to see a result.");
    const r = course(org(req), a.revision_id);
    res.json({
      ...grade(json(t.questions_json), json(t.answers_json)),
      passed: Boolean(t.passed),
      retryAt: t.retry_at,
      remainingAttempts: r.document.maxAttempts - t.attempt,
      title: r.document.title,
    });
  });
  route("get", "/assessments/:id", ["employee"], (req, res) => {
    const a = assessmentsFor(org(req), req.auth.id).find(
      (a) => a.id === req.params.id,
    );
    if (!a) fail(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.");
    if (a.locked)
      fail(409, "ASSESSMENT_LOCKED", "Complete the required learning first.");
    const row = one(
      "SELECT questions_json FROM program_assessments WHERE id=?",
      a.id,
    );
    res.json({
      assessment: a,
      questions: a.completed_at
        ? []
        : publicQuestions(json(row.questions_json)),
      before:
        one(
          "SELECT score FROM program_assessments WHERE program_id=? AND user_id=? AND kind='Baseline'",
          a.program_id,
          req.auth.id,
        )?.score ?? null,
    });
  });
  route("post", "/assessments/:id", ["employee"], (req, res) => {
    const input = validate(answerSchema, req.body);
    let result;
    transaction(() => {
      const a = assessmentsFor(org(req), req.auth.id).find(
        (a) => a.id === req.params.id,
      );
      if (!a) fail(404, "ASSESSMENT_NOT_FOUND", "Assessment was not found.");
      if (a.locked || a.completed_at)
        fail(
          409,
          "ASSESSMENT_UNAVAILABLE",
          "This assessment cannot be submitted now.",
        );
      result = grade(
        json(
          one("SELECT questions_json FROM program_assessments WHERE id=?", a.id)
            .questions_json,
        ),
        input.answers,
      );
      run(
        "UPDATE program_assessments SET score=?,completed_at=? WHERE id=?",
        result.score,
        now(),
        a.id,
      );
      run(
        "INSERT INTO assessment_responses(id,assessment_id,answers_json,score,completed_at) VALUES (?,?,?,?,?)",
        id(),
        a.id,
        JSON.stringify(input.answers),
        result.score,
        now(),
      );
      scoreEvent(
        org(req),
        req.auth.id,
        "knowledge",
        result.score,
        `${a.kind} assessment completed`,
        a.id,
      );
      const before =
        one(
          "SELECT score FROM program_assessments WHERE program_id=? AND user_id=? AND kind='Baseline'",
          a.program_id,
          req.auth.id,
        )?.score ?? null;
      if (a.kind === "Follow-up" && before !== null)
        scoreEvent(
          org(req),
          req.auth.id,
          "improvement",
          50 + (result.score - before) / 2,
          "Baseline to follow-up change",
          a.id,
        );
      audit(req, `${a.kind} assessment completed`, "program", a.program_id, {
        score: result.score,
      });
      result = {
        score: result.score,
        before,
        change: before !== null ? result.score - before : null,
      };
    });
    res.json(result);
  });

  // Remaining routes are registered below in the same tenant-owned service.
  registerOperations();
  registerIdentityAndSettings();
  const intelligence = registerIntelligence(app, { ...deps, scoreFor, scoreEvent, people, notify, queue, activate });
  route("get", "/groups", viewers, (req, res) =>
    res.json({
      groups: q(
        "SELECT * FROM employee_groups WHERE organization_id=? ORDER BY name",
        org(req),
      ).map((g) => ({
        ...g,
        userIds: q(
          "SELECT user_id FROM employee_group_members WHERE group_id=?",
          g.id,
        ).map((u) => u.user_id),
      })),
    }),
  );
  route("post", "/groups", admin, (req, res) => {
    const input = validate(
      z
        .object({
          name: z.string().trim().min(2).max(100),
          userIds: z.array(z.string()).max(5000),
          id: z.string().optional(),
        })
        .strict(),
      req.body,
    );
    const groupId = input.id || id();
    transaction(() => {
      if (
        input.id &&
        !one(
          "SELECT id FROM employee_groups WHERE id=? AND organization_id=?",
          groupId,
          org(req),
        )
      )
        fail(404, "GROUP_NOT_FOUND", "Group was not found.");
      if (
        input.userIds.some(
          (uid) =>
            !one(
              "SELECT id FROM users WHERE id=? AND organization_id=? AND role='employee'",
              uid,
              org(req),
            ),
        )
      )
        fail(
          400,
          "INVALID_AUDIENCE",
          "Choose employees from this organization.",
        );
      if (input.id)
        run(
          "UPDATE employee_groups SET name=? WHERE id=?",
          input.name,
          groupId,
        );
      else
        run(
          "INSERT INTO employee_groups(id,organization_id,name,created_at) VALUES (?,?,?,?)",
          groupId,
          org(req),
          input.name,
          now(),
        );
      run("DELETE FROM employee_group_members WHERE group_id=?", groupId);
      [...new Set(input.userIds)].forEach((uid) =>
        run("INSERT INTO employee_group_members VALUES (?,?)", groupId, uid),
      );
      audit(req, "Employee group saved", "group", groupId);
    });
    res.status(201).json({ id: groupId });
  });
  route("get", "/notifications", null, (req, res) =>
    res.json({
      notifications: q(
        "SELECT id,kind,title,link,read_at,created_at FROM user_notifications WHERE organization_id=? AND user_id=? ORDER BY created_at DESC LIMIT 30",
        org(req),
        req.auth.id,
      ),
    }),
  );

  function registerIdentityAndSettings() {
    function issueReset(user, kind) {
      const token = randomBytes(32).toString("base64url");
      run(
        "UPDATE identity_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
        now(),
        user.id,
      );
      run(
        "INSERT INTO identity_tokens(token_hash,user_id,kind,expires_at,created_at) VALUES (?,?,?,?,?)",
        digest(token),
        user.id,
        kind,
        new Date(
          Date.now() + (kind === "invitation" ? 48 : 1) * 3600000,
        ).toISOString(),
        now(),
      );
      queue(
        user.organization_id,
        user.id,
        "identity",
        {
          title:
            kind === "invitation"
              ? "Invitation to AVERIS"
              : "AVERIS password reset",
          text: `${baseUrl()}/reset-password#${token}`,
        },
        `identity:${digest(token)}`,
      );
    }
    const identityLimit = rateLimit({
      windowMs: 15 * 60000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Please wait before trying again.",
        },
      },
    });
    app.post(
      "/api/auth/forgot-password",
      identityLimit,
      wrap((req, res) => {
        const { email } = validate(
          z.object({ email: z.string().trim().email().max(254) }).strict(),
          req.body,
        );
        const user = one(
          "SELECT * FROM users WHERE email=? AND active=1",
          email.toLowerCase(),
        );
        if (user) transaction(() => issueReset(user, "reset"));
        res.json({ accepted: true });
      }),
    );
    app.post(
      "/api/auth/reset-password",
      identityLimit,
      wrap((req, res) => {
        const input = validate(
          z
            .object({
              token: z.string().min(32).max(128),
              password: passwordSchema,
              otp: z.string().max(6).optional(),
            })
            .strict(),
          req.body,
        );
        transaction(() => {
          const token = one(
            "SELECT t.*,u.organization_id FROM identity_tokens t JOIN users u ON u.id=t.user_id WHERE token_hash=? AND used_at IS NULL AND expires_at>? AND u.active=1",
            digest(input.token),
            now(),
          );
          if (!token)
            fail(
              400,
              "RESET_EXPIRED",
              "This link has expired or has already been used. Request a new link.",
            );
          if (!verifyMfa(db, token.user_id, input.otp, sessionSecret))
            fail(400, "MFA_REQUIRED", "Enter a valid authenticator code.");
          run(
            "UPDATE users SET password_hash=?,password_changed_at=?,updated_at=? WHERE id=?",
            bcrypt.hashSync(input.password, 12),
            now(),
            now(),
            token.user_id,
          );
          run(
            "UPDATE identity_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL",
            now(),
            token.user_id,
          );
          run("DELETE FROM sessions WHERE user_id=?", token.user_id);
          run(
            "UPDATE identity_policy SET must_change=0 WHERE user_id=?",
            token.user_id,
          );
          writeAudit({
            organizationId: token.organization_id,
            actorUserId: token.user_id,
            action: "Password reset",
            entityType: "user",
            entityId: token.user_id,
          });
        });
        res.status(204).end();
      }),
    );
    const personSchema = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(254),
        department: z.string().trim().min(2).max(100),
        role: z.enum(["employee", "manager", "admin", "super_admin"]),
        temporaryPassword: passwordSchema.optional(),
      })
      .strict();
    route("post", "/people", admin, (req, res) => {
      const input = validate(personSchema, req.body);
      if (req.auth.role !== "super_admin" && admin.includes(input.role))
        fail(
          403,
          "FORBIDDEN",
          "Only the tenant owner can create administrator accounts.",
        );
      if (one("SELECT id FROM users WHERE email=?", input.email.toLowerCase()))
        fail(409, "EMAIL_EXISTS", "This email is already registered.");
      const userId = id();
      transaction(() => {
        run(
          "INSERT INTO users(id,organization_id,email,password_hash,name,role,department) VALUES (?,?,?,?,?,?,?)",
          userId,
          org(req),
          input.email.toLowerCase(),
          bcrypt.hashSync(
            input.temporaryPassword || randomBytes(32).toString("hex"),
            12,
          ),
          input.name,
          input.role,
          input.department,
        );
        run(
          "INSERT INTO identity_policy(user_id,must_change) VALUES (?,1)",
          userId,
        );
        if (!input.temporaryPassword)
          issueReset({ id: userId, organization_id: org(req) }, "invitation");
        audit(req, "Employee added", "user", userId);
      });
      res.status(201).json({ id: userId, invited: !input.temporaryPassword });
    });
    route("post", "/people/import", admin, (req, res) => {
      const { csv } = validate(
        z.object({ csv: z.string().min(1).max(2000000) }).strict(),
        req.body,
      );
      let rows;
      try {
        rows = parse(csv, {
          columns: true,
          trim: true,
          skip_empty_lines: true,
          bom: true,
        });
      } catch {
        fail(400, "INVALID_CSV", "Check the CSV format and column names.");
      }
      if (rows.length > 5000)
        fail(400, "IMPORT_LIMIT", "Import up to 5,000 employees at a time.");
      const created = [],
        errors = [];
      transaction(() =>
        rows.forEach((row, index) => {
          const result = personSchema.safeParse({
            ...row,
            role: row.role || "employee",
          });
          if (
            !result.success ||
            !["employee", "manager"].includes(result.data?.role)
          ) {
            errors.push({ row: index + 2, code: "INVALID_ROW" });
            return;
          }
          const input = result.data;
          if (
            one("SELECT id FROM users WHERE email=?", input.email.toLowerCase())
          ) {
            errors.push({ row: index + 2, code: "EMAIL_EXISTS" });
            return;
          }
          const userId = id();
          run(
            "INSERT INTO users(id,organization_id,email,password_hash,name,role,department) VALUES (?,?,?,?,?,?,?)",
            userId,
            org(req),
            input.email.toLowerCase(),
            bcrypt.hashSync(randomBytes(32).toString("hex"), 12),
            input.name,
            input.role,
            input.department,
          );
          run(
            "INSERT INTO identity_policy(user_id,must_change) VALUES (?,1)",
            userId,
          );
          issueReset({ id: userId, organization_id: org(req) }, "invitation");
          created.push({ id: userId, email: input.email });
        }),
      );
      audit(req, "Employees imported", "organization", org(req), {
        created: created.length,
        errors: errors.length,
      });
      res.json({ created, errors });
    });
    route("patch", "/people/:id", admin, (req, res) => {
      const input = validate(
        z
          .object({
            name: z.string().trim().min(2).max(100),
            department: z.string().trim().min(2).max(100),
            role: z.enum(["employee", "manager", "admin", "super_admin"]),
            active: z.boolean(),
          })
          .strict(),
        req.body,
      );
      const target = one(
        "SELECT * FROM users WHERE organization_id=? AND id=?",
        org(req),
        req.params.id,
      );
      if (!target) fail(404, "USER_NOT_FOUND", "Employee was not found.");
      if (
        target.id === req.auth.id &&
        (!input.active || input.role !== target.role)
      )
        fail(409, "SELF_CHANGE", "You cannot remove your own access.");
      if (
        req.auth.role !== "super_admin" &&
        (admin.includes(target.role) || admin.includes(input.role))
      )
        fail(
          403,
          "FORBIDDEN",
          "Only the tenant owner can manage administrators.",
        );
      transaction(() => {
        run(
          "UPDATE users SET name=?,department=?,role=?,active=?,updated_at=? WHERE id=?",
          input.name,
          input.department,
          input.role,
          Number(input.active),
          now(),
          target.id,
        );
        if (!input.active || input.role !== target.role)
          run("DELETE FROM sessions WHERE user_id=?", target.id);
        audit(
          req,
          input.active ? "Employee updated" : "Employee deactivated",
          "user",
          target.id,
        );
      });
      res.status(204).end();
    });
    route("post", "/people/:id/reset", admin, (req, res) => {
      const u = one(
        "SELECT * FROM users WHERE organization_id=? AND id=? AND active=1",
        org(req),
        req.params.id,
      );
      if (!u) fail(404, "USER_NOT_FOUND", "Employee was not found.");
      if (req.auth.role !== "super_admin" && admin.includes(u.role))
        fail(
          403,
          "FORBIDDEN",
          "Only the tenant owner can manage administrators.",
        );
      transaction(() => {
        issueReset(u, "reset");
        audit(req, "Password reset requested", "user", u.id);
      });
      res.status(204).end();
    });
    route("get", "/sessions", null, (req, res) =>
      res.json({
        sessions: q(
          "SELECT id,created_at,last_seen_at,expires_at,ip_address,user_agent FROM sessions WHERE user_id=? AND expires_at>? ORDER BY last_seen_at DESC",
          req.auth.id,
          now(),
        ).map((s) => ({ ...s, current: s.id === req.sessionId })),
        mfaEnabled: Boolean(
          one(
            "SELECT mfa_enabled FROM identity_policy WHERE user_id=?",
            req.auth.id,
          )?.mfa_enabled,
        ),
      }),
    );
    route("delete", "/sessions/:id", null, (req, res) => {
      if (req.params.id === req.sessionId)
        fail(400, "CURRENT_SESSION", "Use sign out for your current session.");
      run(
        "DELETE FROM sessions WHERE id=? AND user_id=?",
        req.params.id,
        req.auth.id,
      );
      audit(req, "Session revoked", "session", req.params.id);
      res.status(204).end();
    });
    route("post", "/mfa/setup", null, (req, res) => {
      const { password } = validate(
        z.object({ password: z.string().max(128) }).strict(),
        req.body,
      );
      const u = one("SELECT password_hash FROM users WHERE id=?", req.auth.id);
      if (!bcrypt.compareSync(password, u.password_hash))
        fail(400, "INVALID_CREDENTIALS", "Password was not accepted.");
      if (
        one(
          "SELECT mfa_enabled FROM identity_policy WHERE user_id=?",
          req.auth.id,
        )?.mfa_enabled
      )
        fail(409, "MFA_ENABLED", "Authenticator is already enabled.");
      const secret = newTotpSecret();
      run(
        "INSERT INTO identity_policy(user_id,mfa_secret) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET mfa_secret=excluded.mfa_secret",
        req.auth.id,
        seal(secret, sessionSecret),
      );
      res.json({
        secret,
        uri: `otpauth://totp/AVERIS:${encodeURIComponent(req.auth.email)}?secret=${secret}&issuer=AVERIS`,
      });
    });
    route("post", "/mfa/confirm", null, (req, res) => {
      const { otp } = validate(
        z.object({ otp: z.string().regex(/^\d{6}$/) }).strict(),
        req.body,
      );
      const p = one(
        "SELECT * FROM identity_policy WHERE user_id=?",
        req.auth.id,
      );
      if (!p?.mfa_secret || p.mfa_enabled)
        fail(409, "MFA_NOT_PENDING", "Start authenticator setup first.");
      if (totp(unseal(p.mfa_secret, sessionSecret)) !== otp)
        fail(
          400,
          "MFA_INVALID",
          "Code was not accepted. Check the time on your device.",
        );
      transaction(() => {
        run(
          "UPDATE identity_policy SET mfa_enabled=1,last_totp_step=? WHERE user_id=?",
          Math.floor(Date.now() / 30000),
          req.auth.id,
        );
        run(
          "DELETE FROM sessions WHERE user_id=? AND id!=?",
          req.auth.id,
          req.sessionId,
        );
        audit(req, "Authenticator enabled", "user", req.auth.id);
      });
      res.status(204).end();
    });
    route("post", "/mfa/disable", null, (req, res) => {
      const { password, otp } = validate(
        z
          .object({
            password: z.string().max(128),
            otp: z.string().regex(/^\d{6}$/),
          })
          .strict(),
        req.body,
      );
      if (
        !bcrypt.compareSync(
          password,
          one("SELECT password_hash FROM users WHERE id=?", req.auth.id)
            .password_hash,
        ) ||
        !verifyMfa(db, req.auth.id, otp, sessionSecret)
      )
        fail(
          400,
          "INVALID_CREDENTIALS",
          "Password or authenticator code was not accepted.",
        );
      run(
        "UPDATE identity_policy SET mfa_enabled=0,mfa_secret=NULL,last_totp_step=NULL WHERE user_id=?",
        req.auth.id,
      );
      audit(req, "Authenticator disabled", "user", req.auth.id);
      res.status(204).end();
    });
    route("get", "/settings", viewers, (req, res) =>
      res.json({
        organization: req.auth.organization,
        settings: one(
          "SELECT * FROM tenant_settings WHERE organization_id=?",
          org(req),
        ) || {
          locale: "id",
          timezone: "Asia/Makassar",
          reminders: 1,
          retention_days: 365,
        },
        smtp: {
          configured: Boolean(process.env.SMTP_HOST),
          host: process.env.SMTP_HOST || null,
          from: process.env.SMTP_FROM || null,
        },
        sso: {
          configured: ssoConfigured(),
          issuer: process.env.OIDC_ISSUER || null,
        },
        health: one("SELECT * FROM worker_health WHERE name=?", "delivery"),
        jobs: q(
          "SELECT id,kind,status,attempts,available_at,completed_at,created_at FROM delivery_jobs WHERE organization_id=? ORDER BY created_at DESC LIMIT 50",
          org(req),
        ),
        jobCounts: q(
          "SELECT status,COUNT(*) count FROM delivery_jobs WHERE organization_id=? GROUP BY status",
          org(req),
        ),
      }),
    );
    route("put", "/settings", admin, (req, res) => {
      const input = validate(
        z
          .object({
            name: z.string().trim().min(2).max(100),
            locale: z.enum(["id", "en"]),
            timezone: z.string().refine((s) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: s });
                return true;
              } catch {
                return false;
              }
            }),
            reminders: z.boolean(),
            retentionDays: z.number().int().min(30).max(3650),
          })
          .strict(),
        req.body,
      );
      transaction(() => {
        run("UPDATE organizations SET name=? WHERE id=?", input.name, org(req));
        run(
          "INSERT INTO tenant_settings(organization_id,locale,timezone,reminders,retention_days) VALUES (?,?,?,?,?) ON CONFLICT(organization_id) DO UPDATE SET locale=excluded.locale,timezone=excluded.timezone,reminders=excluded.reminders,retention_days=excluded.retention_days",
          org(req),
          input.locale,
          input.timezone,
          Number(input.reminders),
          input.retentionDays,
        );
        audit(req, "Organization settings updated", "organization", org(req));
      });
      res.status(204).end();
    });
    route("post", "/jobs/:id/retry", admin, (req, res) => {
      const j = one(
        "SELECT id FROM delivery_jobs WHERE organization_id=? AND id=? AND status='Failed'",
        org(req),
        req.params.id,
      );
      if (!j)
        fail(409, "JOB_NOT_FAILED", "Only failed deliveries can be retried.");
      run(
        "UPDATE delivery_jobs SET status='Pending',attempts=0,available_at=?,error=NULL WHERE id=?",
        now(),
        j.id,
      );
      audit(req, "Delivery retried", "delivery", j.id);
      res.status(204).end();
    });
    route("get", "/audit", viewers, (req, res) => {
      const input = validate(
        z
          .object({
            actor: z.string().max(100).default(""),
            action: z.string().max(100).default(""),
            outcome: z.enum(["success", "failure", "denied", ""]).default(""),
            from: z.string().default(""),
            to: z.string().default(""),
            page: z.coerce.number().int().min(1).default(1),
          })
          .strict(),
        req.query,
      );
      const params = [
        org(req),
        `%${input.actor}%`,
        `%${input.action}%`,
        input.outcome,
        input.outcome,
        input.from,
        input.from,
        input.to,
        input.to,
      ];
      const where =
        "WHERE a.organization_id=? AND COALESCE(u.name,'System') LIKE ? AND a.action LIKE ? AND (?='' OR a.outcome=?) AND (?='' OR a.created_at>=?) AND (?='' OR a.created_at<=?)";
      const logs = q(
        `SELECT a.*,COALESCE(u.name,'System') actor FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ${where} ORDER BY a.created_at DESC,a.rowid DESC LIMIT 30 OFFSET ?`,
        ...params,
        (input.page - 1) * 30,
      );
      res.json({
        logs: logs.map((l) => ({
          ...l,
          metadata_json: undefined,
          metadata: json(l.metadata_json),
        })),
        total: one(
          `SELECT COUNT(*) n FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id ${where}`,
          ...params,
        ).n,
        page: input.page,
      });
    });
  }

  function registerOperations() {
    route("post", "/phishing", ["employee"], (req, res) => {
      const input = validate(
        z
          .object({
            sender: z.string().trim().min(3).max(254),
            subject: z.string().trim().min(3).max(300),
            description: z.string().trim().min(10).max(5000),
            channel: z.enum(["Email", "SMS", "Chat", "Other"]),
          })
          .strict(),
        req.body,
      );
      const fingerprint = digest(
        `${input.sender.toLowerCase()}|${input.subject.toLowerCase()}|${input.channel}`,
      );
      const duplicate = one(
        "SELECT id FROM phishing_reports WHERE organization_id=? AND reporter_id=? AND fingerprint=?",
        org(req),
        req.auth.id,
        fingerprint,
      );
      if (duplicate) return res.json({ id: duplicate.id, duplicate: true });
      if (
        one(
          "SELECT COUNT(*) n FROM phishing_reports WHERE reporter_id=? AND created_at>?",
          req.auth.id,
          new Date(Date.now() - 3600000).toISOString(),
        ).n >= 10
      )
        fail(
          429,
          "REPORT_LIMIT",
          "You have submitted several reports. Please wait before submitting another.",
        );
      const reportId = id();
      transaction(() => {
        run(
          "INSERT INTO phishing_reports(id,organization_id,reporter_id,sender,subject,description,channel,fingerprint,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
          reportId,
          org(req),
          req.auth.id,
          input.sender,
          input.subject,
          input.description,
          input.channel,
          fingerprint,
          now(),
          now(),
        );
        audit(req, "Suspicious message reported", "phishing_report", reportId);
        q(
          "SELECT id FROM users WHERE organization_id=? AND role IN ('admin','super_admin') AND active=1",
          org(req),
        ).forEach((u) =>
          notify(
            org(req),
            u.id,
            "phishing",
            "Suspicious message reported",
            "/admin/reports/inbox",
            `report:${reportId}:${u.id}`,
            false,
          ),
        );
      });
      res.status(201).json({ id: reportId });
    });
    route("get", "/phishing", null, (req, res) =>
      res.json({
        reports: q(
          "SELECT r.*,u.name reporter,u.department FROM phishing_reports r JOIN users u ON u.id=r.reporter_id WHERE r.organization_id=? AND (?=0 OR r.reporter_id=?) ORDER BY r.created_at DESC",
          org(req),
          Number(req.auth.role === "employee"),
          req.auth.id,
        ).map((r) =>
          req.auth.role === "employee"
            ? { ...r, notes: undefined, fingerprint: undefined }
            : r,
        ),
      }),
    );
    route("patch", "/phishing/:id", admin, (req, res) => {
      const input = validate(
        z
          .object({
            status: z.enum([
              "Submitted",
              "Reviewing",
              "Confirmed Suspicious",
              "Safe",
              "Closed",
            ]),
            notes: z.string().trim().max(5000),
            classification: z.enum(["Suspicious", "Safe"]).nullable(),
          })
          .strict(),
        req.body,
      );
      transaction(() => {
        const r = one(
          "SELECT * FROM phishing_reports WHERE organization_id=? AND id=?",
          org(req),
          req.params.id,
        );
        if (!r) fail(404, "REPORT_NOT_FOUND", "Report was not found.");
        if (
          input.status === "Confirmed Suspicious" &&
          input.classification !== "Suspicious"
        )
          fail(
            400,
            "CLASSIFICATION_REQUIRED",
            "Confirm the classification before saving.",
          );
        if (input.status === "Safe" && input.classification !== "Safe")
          fail(
            400,
            "CLASSIFICATION_REQUIRED",
            "Confirm the classification before saving.",
          );
        if (input.status === "Closed" && !input.classification)
          fail(
            400,
            "CLASSIFICATION_REQUIRED",
            "Classify the message before closing the report.",
          );
        run(
          "UPDATE phishing_reports SET status=?,notes=?,classification=?,updated_at=? WHERE id=?",
          input.status,
          input.notes,
          input.classification,
          now(),
          r.id,
        );
        // Only a reviewed classification contributes, once per reporter per day.
        const source = `confirmed:${r.reporter_id}:${r.created_at.slice(0, 10)}`;
        if (input.classification === "Suspicious")
          scoreEvent(
            org(req),
            r.reporter_id,
            "reporting",
            100,
            "Suspicious report confirmed",
            source,
          );
        const credit = one(
          "SELECT id FROM score_events WHERE organization_id=? AND user_id=? AND component='reporting' AND source_id=?",
          org(req),
          r.reporter_id,
          source,
        );
        if (credit) {
          const supported = one(
            "SELECT id FROM phishing_reports WHERE organization_id=? AND reporter_id=? AND substr(created_at,1,10)=? AND classification='Suspicious'",
            org(req),
            r.reporter_id,
            r.created_at.slice(0, 10),
          );
          if (supported)
            run(
              "UPDATE score_event_invalidations SET restored_at=? WHERE event_id=? AND restored_at IS NULL",
              now(),
              credit.id,
            );
          else if (
            !one(
              "SELECT id FROM score_event_invalidations WHERE event_id=? AND restored_at IS NULL",
              credit.id,
            )
          )
            run(
              "INSERT INTO score_event_invalidations(id,event_id,invalidated_at,reason) VALUES (?,?,?,?)",
              id(),
              credit.id,
              now(),
              "Report classification corrected",
            );
        }
        audit(req, "Phishing report reviewed", "phishing_report", r.id, {
          status: input.status,
          classification: input.classification,
        });
      });
      res.status(204).end();
    });
    route("get", "/certificates", null, (req, res) =>
      res.json({
        certificates: q(
          "SELECT c.*,u.name employee,u.department FROM certificate_records c JOIN users u ON u.id=c.user_id WHERE c.organization_id=? AND (?=0 OR c.user_id=?) ORDER BY c.issued_at DESC",
          org(req),
          Number(req.auth.role === "employee"),
          req.auth.id,
        ),
      }),
    );
    route("post", "/certificates/:id/revoke", admin, (req, res) => {
      const { reason } = validate(
        z.object({ reason: z.string().trim().min(5).max(1000) }).strict(),
        req.body,
      );
      const c = one(
        "SELECT * FROM certificate_records WHERE organization_id=? AND id=?",
        org(req),
        req.params.id,
      );
      if (!c) fail(404, "CERTIFICATE_NOT_FOUND", "Certificate was not found.");
      transaction(() => {
        run(
          "UPDATE certificate_records SET status='Revoked',revoked_at=?,reason=? WHERE id=?",
          now(),
          reason,
          c.id,
        );
        audit(req, "Certificate revoked", "certificate", c.id, { reason });
      });
      res.status(204).end();
    });
    route("post", "/certificates/:id/reissue", admin, (req, res) => {
      const c = one(
        "SELECT * FROM certificate_records WHERE organization_id=? AND id=?",
        org(req),
        req.params.id,
      );
      if (!c || c.status !== "Revoked")
        fail(
          409,
          "INVALID_CERTIFICATE",
          "Only revoked certificates can be reinstated.",
        );
      transaction(() => {
        run(
          "UPDATE certificate_records SET status='Valid',revoked_at=NULL WHERE id=?",
          c.id,
        );
        audit(req, "Certificate reinstated", "certificate", c.id, {
          previousReason: c.reason,
        });
      });
      res.status(204).end();
    });
    route("get", "/certificates/:id/pdf", null, (req, res) => {
      const c = one(
        "SELECT c.*,u.name employee FROM certificate_records c JOIN users u ON u.id=c.user_id WHERE c.organization_id=? AND c.id=? AND (?=0 OR c.user_id=?)",
        org(req),
        req.params.id,
        Number(req.auth.role === "employee"),
        req.auth.id,
      );
      if (!c) fail(404, "CERTIFICATE_NOT_FOUND", "Certificate was not found.");
      if (c.status !== "Valid")
        fail(409, "CERTIFICATE_REVOKED", "This certificate has been revoked.");
      const pdf = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 55,
      });
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${c.id}.pdf"`,
      });
      pdf.pipe(res);
      pdf.rect(25, 25, 792, 545).strokeColor("#D9D9D9").stroke();
      pdf.rect(25, 25, 5, 545).fill("#BA282B");
      pdf.fillColor("#222222").fontSize(24).text("AVERIS", { align: "center" });
      pdf
        .fontSize(9)
        .fillColor("#666666")
        .text("by VulneraX", { align: "center" });
      pdf
        .moveDown(3)
        .fontSize(12)
        .text("CERTIFICATE OF COMPLETION", { align: "center" });
      pdf
        .moveDown()
        .fontSize(30)
        .fillColor("#222222")
        .text(c.employee, { align: "center" });
      pdf
        .moveDown(0.5)
        .fontSize(13)
        .fillColor("#666666")
        .text("has successfully completed", { align: "center" });
      pdf
        .moveDown(0.6)
        .fontSize(22)
        .fillColor("#222222")
        .text(c.title, { align: "center" });
      pdf
        .moveDown()
        .fontSize(12)
        .text(`${req.auth.organization.name}  |  Score ${c.score}/100`, {
          align: "center",
        });
      pdf
        .moveDown()
        .fontSize(10)
        .fillColor("#666666")
        .text(`Issued ${c.issued_at.slice(0, 10)}  |  ${c.id}`, {
          align: "center",
        });
      pdf.moveDown().text(`${baseUrl()}/verify/${c.id}`, {
        align: "center",
        link: `${baseUrl()}/verify/${c.id}`,
      });
      pdf.end();
    });
    const publicLimit = rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Please wait before trying again.",
        },
      },
    });
    app.get(
      "/api/public/verify/:id",
      publicLimit,
      wrap((req, res) => {
        const c = one(
          "SELECT id,title,status,issued_at FROM certificate_records WHERE id=?",
          req.params.id,
        );
        if (!c) return res.status(404).json({ status: "Not Found" });
        res.json({ certificate: c, status: c.status });
      }),
    );
    app.post(
      "/api/public/exercise/:token",
      publicLimit,
      wrap((req, res) => {
        const { event } = validate(
          z
            .object({ event: z.enum(["opened", "clicked", "reported"]) })
            .strict(),
          req.body,
        );
        transaction(() => {
          const t = one(
            "SELECT t.* FROM simulation_targets t JOIN programs p ON p.id=t.program_id WHERE token_hash=? AND expires_at>? AND p.status='Active'",
            digest(`${sessionSecret}:${req.params.token}`),
            now(),
          );
          if (!t) return;
          const inserted = run(
            "INSERT OR IGNORE INTO safe_simulation_events(id,target_id,event,ip_hash,created_at) VALUES (?,?,?,?,?)",
            id(),
            t.id,
            event,
            digest(`${sessionSecret}:${req.ip}`),
            now(),
          );
          if (!inserted.changes) return;
          if (event === "clicked")
            scoreEvent(
              t.organization_id,
              t.user_id,
              "behavior",
              0,
              "Simulation link clicked",
              `${t.id}:clicked`,
            );
          if (event === "reported") {
            scoreEvent(
              t.organization_id,
              t.user_id,
              "reporting",
              100,
              "Simulation reported",
              `${t.id}:reported`,
            );
            if (
              !one(
                "SELECT id FROM safe_simulation_events WHERE target_id=? AND event='clicked'",
                t.id,
              )
            )
              scoreEvent(
                t.organization_id,
                t.user_id,
                "behavior",
                100,
                "Simulation reported without clicking",
                `${t.id}:safe`,
              );
          }
          writeAudit({
            organizationId: t.organization_id,
            actorUserId: t.user_id,
            action: `Simulation ${event}`,
            entityType: "program",
            entityId: t.program_id,
          });
        });
        res.status(202).json({ accepted: true });
      }),
    );

    route("get", "/exports/:format", viewers, (req, res) => {
      const filters = validate(
        z
          .object({
            period: z.enum(["7", "30", "90", "365", "all"]).default("30"),
            department: z.string().optional(),
            risk: z.enum(["High", "Medium", "Low", "Unmeasured"]).optional(),
            campaignId: z.string().optional(),
            from: z.string().datetime().optional(),
            to: z.string().datetime().optional(),
            category: z
              .enum([
                "Executive",
                "Campaign",
                "Employee",
                "Compliance Evidence",
              ])
              .default("Executive"),
          })
          .strict(),
        req.query,
      );
      const report = metrics(org(req), filters);
      if (req.params.format === "csv") {
        const cell = (v) =>
          `"${String(v ?? "")
            .replace(/^[=+@\-\t\r]/, "'$&")
            .replaceAll('"', '""')}"`;
        const rows =
          filters.category === "Compliance Evidence"
            ? [
                [
                  "Employee",
                  "Course",
                  "Program",
                  "Due",
                  "Completed",
                  "Status",
                  "Certificate",
                ],
                ...report.assignments.map((a) => [
                  report.users.find((u) => u.id === a.user_id)?.name,
                  a.title,
                  a.program_name,
                  a.due_at,
                  a.completed_at,
                  a.status,
                  one(
                    "SELECT id FROM certificate_records WHERE assignment_id=?",
                    a.id,
                  )?.id || "",
                ]),
              ]
            : [
                [
                  "Employee",
                  "Email",
                  "Department",
                  "Awareness Score",
                  "Coverage",
                  "Risk",
                  "Assigned",
                  "Completed",
                  "Assignment Completion",
                ],
                ...report.users.map((u) => [
                  u.name,
                  u.email,
                  u.department,
                  u.score,
                  u.coverage,
                  u.risk,
                  u.assigned,
                  u.completed,
                  u.completion,
                ]),
              ];
        res
          .set({
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="averis-report.csv"',
          })
          .send("\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"));
        return;
      }
      if (req.params.format !== "pdf")
        fail(404, "FORMAT_NOT_FOUND", "Choose PDF or CSV.");
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="averis-report.pdf"',
      });
      const pdf = new PDFDocument({
        margin: 48,
        size: "A4",
        bufferPages: true,
      });
      pdf.pipe(res);
      pdf.fontSize(22).fillColor("#A82428").text("AVERIS");
      pdf.fontSize(18).fillColor("#222222").text(`${filters.category} Report`);
      pdf
        .moveDown(0.5)
        .fontSize(10)
        .fillColor("#666666")
        .text(`${req.auth.organization.name} | ${now().slice(0, 10)}`);
      pdf.text(
        `Period: ${filters.from || filters.period} to ${filters.to || "today"} | ${filters.department || "All departments"} | ${filters.risk || "All risk levels"}`,
      );
      pdf.moveDown();
      const s = report.summary;
      for (const [label, value] of Object.entries({
        Employees: s.employees,
        "Awareness Score": s.score,
        "Measured employees (%)": s.coverage,
        "Participation (%)": s.participation,
        "Assignment completion (%)": s.assignmentCompletion,
        "Quiz pass rate (%)": s.quizPassRate,
        "Reporting rate (%)": s.reportingRate,
        "Simulation click rate (%)": s.clickRate,
      })) {
        pdf
          .fontSize(11)
          .fillColor("#222222")
          .text(`${label}: ${value ?? "Not measured"}`);
        pdf.moveDown(0.3);
      }
      pdf.moveDown().fontSize(14).text("Department comparison");
      report.departments.forEach((d) =>
        pdf
          .fontSize(10)
          .text(
            `${d.department}: ${d.employees} employees | Score ${d.score ?? "Not measured"} | ${d.overdue} overdue`,
          ),
      );
      if (
        filters.category === "Employee" ||
        filters.category === "Compliance Evidence"
      ) {
        pdf.moveDown().fontSize(14).text(filters.category);
        for (const a of report.assignments) {
          if (pdf.y > 720) pdf.addPage();
          pdf
            .fontSize(10)
            .text(
              `${report.users.find((u) => u.id === a.user_id)?.name} | ${a.title} | ${a.status} | ${a.completed_at?.slice(0, 10) || "Pending"}`,
            );
        }
      }
      pdf
        .moveDown()
        .fontSize(9)
        .fillColor("#666666")
        .text(
          "Score uses available evidence with weight coverage. Assignment completion and quiz pass rate have different denominators. Missing measurements are not zero scores.",
        );
      const range = pdf.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        pdf.switchToPage(i);
        pdf.fontSize(8).text(`AVERIS | ${i + 1} / ${range.count}`, 48, 790, {
          lineBreak: false,
        });
      }
      pdf.end();
    });
  }

  return { tick, scoreFor };

  async function tick() {
    try {
      intelligence.tick();
      transaction(() => {
        for (const s of q("SELECT * FROM tenant_settings")) {
          const cutoff = new Date(
            Date.now() - s.retention_days * 86400000,
          ).toISOString();
          run(
            "DELETE FROM delivery_jobs WHERE organization_id=? AND status='Sent' AND completed_at<?",
            s.organization_id,
            cutoff,
          );
          run(
            "DELETE FROM user_notifications WHERE organization_id=? AND read_at IS NOT NULL AND created_at<?",
            s.organization_id,
            cutoff,
          );
        }
        for (const p of q(
          "SELECT * FROM programs WHERE status='Scheduled' AND start_at<=?",
          now(),
        )) {
          if (p.due_at <= now())
            run(
              "UPDATE programs SET status='Completed',updated_at=? WHERE id=?",
              now(),
              p.id,
            );
          else {
            try {
              activate(p);
            } catch (error) {
              if (error.code !== "INCOMPLETE_CAMPAIGN") throw error;
              run(
                "UPDATE programs SET status='Draft',version=version+1,updated_at=? WHERE id=?",
                now(),
                p.id,
              );
              notify(
                p.organization_id,
                p.owner_id,
                "campaign",
                "Campaign needs an active audience before launch",
                `/admin/campaigns/${p.id}`,
                `activation-blocked:${p.id}:${p.version}`,
                false,
              );
              writeAudit({
                organizationId: p.organization_id,
                action: "Campaign activation blocked",
                entityType: "program",
                entityId: p.id,
                outcome: "failure",
                metadata: { reason: error.code },
              });
            }
          }
        }
        for (const p of q(
          "SELECT * FROM programs WHERE status='Active' AND due_at<=?",
          now(),
        )) {
          run(
            "UPDATE programs SET status='Completed',version=version+1,updated_at=? WHERE id=?",
            now(),
            p.id,
          );
          notify(
            p.organization_id,
            p.owner_id,
            "campaign",
            "Campaign completed",
            `/admin/campaigns/${p.id}`,
            `completed:${p.id}`,
          );
        }
        for (const a of q(
          "SELECT a.*,p.reminders,r.document_json FROM learning_assignments a JOIN programs p ON p.id=a.program_id JOIN course_revisions r ON r.id=a.revision_id WHERE p.status='Active' AND a.status!='Completed' AND p.reminders=1",
        )) {
          const preference = one(
            "SELECT reminders FROM tenant_settings WHERE organization_id=?",
            a.organization_id,
          );
          if (preference?.reminders === 0) continue;
          const days = (new Date(a.due_at) - Date.now()) / 86400000;
          if (days <= 3)
            notify(
              a.organization_id,
              a.user_id,
              days < 0 ? "overdue" : "due",
              json(a.document_json).title,
              "/employee/learning",
              `due:${a.id}:${now().slice(0, 10)}`,
            );
        }
        run(
          "INSERT INTO worker_health(name,last_run,last_error) VALUES (?,?,NULL) ON CONFLICT(name) DO UPDATE SET last_run=excluded.last_run,last_error=NULL",
          "delivery",
          now(),
        );
      });
      if (!process.env.SMTP_HOST) return;
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      for (let i = 0; i < 25; i++) {
        let job;
        transaction(() => {
          job = one(
            "SELECT * FROM delivery_jobs WHERE ((status IN ('Pending','Failed') AND available_at<=?) OR (status='Sending' AND lease_until<?)) AND attempts<5 ORDER BY available_at LIMIT 1",
            now(),
            now(),
          );
          if (job)
            run(
              "UPDATE delivery_jobs SET status='Sending',lease_until=?,attempts=attempts+1 WHERE id=?",
              new Date(Date.now() + 300000).toISOString(),
              job.id,
            );
        });
        if (!job) break;
        try {
          const u = one(
            "SELECT email,active FROM users WHERE id=?",
            job.user_id,
          );
          if (!u?.active) throw new Error("Recipient inactive");
          const payload = json(job.payload_json);
          if (payload.targetId) {
            const target = one(
              "SELECT t.expires_at,p.status FROM simulation_targets t JOIN programs p ON p.id=t.program_id WHERE t.id=?",
              payload.targetId,
            );
            if (
              !target ||
              target.status !== "Active" ||
              target.expires_at <= now()
            ) {
              run(
                "UPDATE delivery_jobs SET status='Cancelled',completed_at=?,lease_until=NULL,error='Campaign inactive or expired',payload_json='{}' WHERE id=?",
                now(),
                job.id,
              );
              continue;
            }
          }
          await transport.sendMail({
            from: process.env.SMTP_FROM || "AVERIS <no-reply@localhost>",
            to: u.email,
            subject: payload.title,
            text: payload.text,
            html: payload.html || undefined,
            messageId: `<${job.id}@averis.local>`,
          });
          transaction(() => {
            run(
              "UPDATE delivery_jobs SET status='Sent',completed_at=?,lease_until=NULL,error=NULL,payload_json='{}' WHERE id=?",
              now(),
              job.id,
            );
            if (payload.targetId)
              run(
                "UPDATE simulation_targets SET sent_at=? WHERE id=?",
                now(),
                payload.targetId,
              );
          });
        } catch (e) {
          run(
            "UPDATE delivery_jobs SET status='Failed',lease_until=NULL,available_at=?,error=? WHERE id=?",
            new Date(
              Date.now() + Math.pow(2, job.attempts) * 60000,
            ).toISOString(),
            String(e.message).slice(0, 500),
            job.id,
          );
        }
      }
    } catch (e) {
      run(
        "INSERT INTO worker_health(name,last_run,last_error) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET last_error=excluded.last_error",
        "delivery",
        now(),
        String(e.message).slice(0, 500),
      );
      console.error(
        JSON.stringify({
          level: "error",
          event: "worker.failed",
          message: e.message,
        }),
      );
    }
  }
}
