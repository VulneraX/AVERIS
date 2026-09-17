import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { once } from "node:events";
import { createHash } from "node:crypto";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { totp } from "./identity.mjs";
import express from "express";
import { registerWorkspace } from "./workspace.mjs";

const directory = mkdtempSync(join(tmpdir(), "averis-workspace-test-"));
const databasePath = join(directory, "workspace.sqlite");
const secret = "workspace-test-secret-only-32-characters-minimum";
const password = "Test-Strong-Password!2026";
let server, database, url, owner, employee, manager, other, otherTenant;
let campaignId, revision, assignmentId, certificateId;
async function call(path, { cookie, body, method = "GET" } = {}) {
  const res = await fetch(url + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data =
    res.status === 204
      ? null
      : res.headers.get("content-type")?.includes("application/json")
        ? await res.json()
        : await res.arrayBuffer();
  return { status: res.status, data, headers: res.headers };
}
async function login(email, otp) {
  const res = await call("/api/auth/login", {
    method: "POST",
    body: { email, password, ...(otp ? { otp } : {}) },
  });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  return {
    cookie: res.headers.get("set-cookie").split(";")[0],
    ...res.data.user,
  };
}
const ws = (path, cookie, body, method) =>
  call("/api/workspace" + path, {
    cookie,
    body,
    method: method || (body ? "POST" : "GET"),
  });
before(async () => {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  url = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["server/index.mjs"], {
    stdio: ["ignore", "ignore", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "development",
      HOST: "127.0.0.1",
      PORT: String(port),
      DATABASE_PATH: databasePath,
      SESSION_SECRET: secret,
      SMTP_HOST: "",
      OIDC_ISSUER: "",
      LEGACY_API_ENABLED: "false",
      BOOTSTRAP_ORG_SLUG: "acme-indonesia",
      BOOTSTRAP_SUPER_ADMIN_EMAIL: "owner@acme.co.id",
      BOOTSTRAP_ADMIN_EMAIL: "admin@acme.co.id",
      BOOTSTRAP_MANAGER_EMAIL: "manager@acme.co.id",
      BOOTSTRAP_EMPLOYEE_EMAIL: "andini@acme.co.id",
      BOOTSTRAP_SUPER_ADMIN_PASSWORD: password,
      BOOTSTRAP_ADMIN_PASSWORD: password,
      BOOTSTRAP_MANAGER_PASSWORD: password,
      BOOTSTRAP_EMPLOYEE_PASSWORD: password,
    },
  });
  let stderr = "";
  server.stderr.on("data", (b) => (stderr += b));
  for (let i = 0; i < 150; i++) {
    try {
      if ((await call("/api/health")).status === 200) break;
    } catch {}
    if (i === 149) throw new Error(stderr);
    await new Promise((r) => setTimeout(r, 100));
  }
  database = new Database(databasePath);
  owner = await login("owner@acme.co.id");
  employee = await login("andini@acme.co.id");
  manager = await login("manager@acme.co.id");
  database
    .prepare(
      "INSERT INTO users(id,organization_id,email,password_hash,name,role,department) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      "employee-other",
      owner.organization.id,
      "other@acme.co.id",
      bcrypt.hashSync(password, 12),
      "Other Employee",
      "employee",
      "Finance",
    );
  other = await login("other@acme.co.id");
  database
    .prepare("INSERT INTO organizations(id,name,slug) VALUES (?,?,?)")
    .run("separate-tenant", "Separate Tenant", "separate");
  database
    .prepare(
      "INSERT INTO users(id,organization_id,email,password_hash,name,role,department) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      "separate-user",
      "separate-tenant",
      "other@tenant.test",
      bcrypt.hashSync(password, 12),
      "Other Owner",
      "super_admin",
      "Security",
    );
  otherTenant = await login("other@tenant.test");
});
after(async () => {
  database?.close();
  if (server && !server.killed) {
    server.kill();
    await once(server, "exit");
  }
  rmSync(directory, { recursive: true, force: true });
});

test("fresh workspace has no fabricated activity or scores; legacy API is retired", async () => {
  const s = await ws("/summary", owner.cookie);
  assert.equal(s.status, 200);
  assert.equal(s.data.summary.score, null);
  assert.equal(s.data.summary.assignmentCompletion, null);
  assert.equal(s.data.summary.quizPassRate, null);
  assert.equal(s.data.summary.assigned, 0);
  assert.equal((await ws("/summary", employee.cookie)).status, 403);
  assert.equal(
    (await call("/api/product-state", { cookie: owner.cookie })).status,
    410,
  );
  assert.equal((await call("/api/health")).data.database, undefined);
  assert.equal((await call("/api/auth/options")).data.ssoConfigured, false);
  assert.equal((await call("/api/auth/sso/start")).status, 503);
  assert.equal(
    (await call("/api/auth/sso/callback?state=invalid")).status,
    503,
  );
});

test("employee groups validate tenant ownership and notification reads are personal", async () => {
  const bad = await ws("/groups", owner.cookie, {
    name: "Invalid tenant group",
    userIds: [otherTenant.id],
  });
  assert.equal(bad.status, 400);
  assert.equal(
    (
      await ws("/groups", manager.cookie, {
        name: "No access",
        userIds: [employee.id],
      })
    ).status,
    403,
  );
  const created = await ws("/groups", owner.cookie, {
    name: "Finance cohort",
    userIds: [employee.id, other.id, employee.id],
  });
  assert.equal(created.status, 201);
  const groups = (await ws("/groups", owner.cookie)).data.groups;
  assert.deepEqual(
    groups.find((g) => g.id === created.data.id).userIds.sort(),
    [employee.id, other.id].sort(),
  );
  assert.equal((await ws("/groups", otherTenant.cookie)).data.groups.length, 0);
  assert.equal(
    (
      await ws("/groups", otherTenant.cookie, {
        id: created.data.id,
        name: "Foreign edit",
        userIds: [],
      })
    ).status,
    404,
  );
  assert.deepEqual(
    (await ws("/notifications", employee.cookie)).data.notifications,
    [],
  );
});
test("course revision and campaign launch create separate individual assignments with baseline gates", async () => {
  const courses = await ws("/courses", owner.cookie);
  assert.equal(courses.status, 200);
  revision = courses.data.courses.find(
    (c) => c.document.title === "Phishing Awareness",
  );
  assert.ok(revision);
  const draft = await ws("/campaigns", manager.cookie, {
    name: "Measured onboarding",
    objective: "Verify phishing recognition before and after learning",
    ownerId: owner.id,
    userIds: [employee.id, other.id],
    courseIds: [revision.id],
    startAt: null,
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    baseline: true,
    followup: true,
    simulation: "Password Expiration",
    reminders: true,
  });
  assert.equal(draft.status, 201, JSON.stringify(draft.data));
  campaignId = draft.data.id;
  assert.equal(
    (
      await ws(`/campaigns/${campaignId}/action`, manager.cookie, {
        action: "launch",
        version: 1,
      })
    ).status,
    403,
  );
  assert.equal(
    (await ws(`/campaigns/${campaignId}`, otherTenant.cookie)).status,
    404,
  );
  const launch = await ws(`/campaigns/${campaignId}/action`, owner.cookie, {
    action: "launch",
    version: 1,
  });
  assert.equal(launch.status, 200, JSON.stringify(launch.data));
  const me = await ws("/me", employee.cookie);
  assert.equal(me.data.assignments.length, 1);
  assignmentId = me.data.assignments[0].id;
  const otherMe = await ws("/me", other.cookie);
  assert.notEqual(otherMe.data.assignments[0].id, assignmentId);
  assert.equal(
    (await ws(`/learning/${assignmentId}`, other.cookie)).status,
    404,
  );
  assert.equal(
    (await ws(`/learning/${assignmentId}`, employee.cookie)).status,
    409,
  );
  const baseline = me.data.assessments.find((a) => a.kind === "Baseline");
  const payload = await ws(`/assessments/${baseline.id}`, employee.cookie);
  assert.equal(payload.data.questions[0].correct, undefined);
  assert.equal(payload.data.questions[0].explanation, undefined);
  assert.equal(
    (await ws(`/assessments/${baseline.id}`, employee.cookie, { score: 100 }))
      .status,
    400,
  );
  const answers = revision.document.questions.map((q) =>
    q.correct.map((i) => (i + 1) % q.options.length),
  );
  const result = await ws(`/assessments/${baseline.id}`, employee.cookie, {
    answers,
  });
  assert.equal(result.status, 200);
  assert.equal(result.data.score, 0);
  assert.equal(
    (await ws(`/assessments/${baseline.id}`, employee.cookie, { answers }))
      .status,
    409,
  );
  assert.equal(
    (await ws("/me", other.cookie)).data.assignments[0].lesson_index,
    0,
  );
});
test("published learning edits preserve assignment content and answer keys", async () => {
  const edited = {
    ...revision.document,
    title: "Revised Phishing Awareness",
    questions: revision.document.questions.map((q) => ({ ...q, correct: [0] })),
  };
  const update = await ws("/courses", owner.cookie, {
    courseId: revision.course_id,
    baseVersion: revision.version,
    status: "Published",
    document: edited,
  });
  assert.equal(update.status, 201, JSON.stringify(update.data));
  assert.equal(
    (
      await ws("/courses", owner.cookie, {
        courseId: revision.course_id,
        baseVersion: revision.version,
        status: "Published",
        document: edited,
      })
    ).status,
    409,
  );
  const learning = await ws(`/learning/${assignmentId}`, employee.cookie);
  assert.equal(learning.data.document.title, revision.document.title);
  assert.equal(learning.data.document.questions, undefined);
  assert.equal(
    (
      await ws(`/learning/${assignmentId}/progress`, employee.cookie, {
        lessonIndex: 100,
      })
    ).status,
    400,
  );
  for (let i = 1; i <= learning.data.document.lessons.length; i++)
    assert.equal(
      (
        await ws(`/learning/${assignmentId}/progress`, employee.cookie, {
          lessonIndex: i,
        })
      ).status,
      204,
    );
});
test("server grading, duplicate submit protection, follow-up unlock, score ledger and correct report denominators", async () => {
  const quiz = await ws(`/learning/${assignmentId}/quiz`, employee.cookie, {});
  assert.equal(quiz.status, 200, JSON.stringify(quiz.data));
  assert.ok(
    quiz.data.questions.every(
      (q) => !("correct" in q) && !("explanation" in q),
    ),
  );
  const answers = quiz.data.questions.map(
    (q) =>
      revision.document.questions.find((x) => x.prompt === q.prompt).correct,
  );
  const result = await ws(
    `/learning/${assignmentId}/quiz/${quiz.data.attempt.id}`,
    employee.cookie,
    { answers },
  );
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(result.data.score, 100);
  assert.equal(result.data.passed, true);
  assert.equal(
    (
      await ws(
        `/learning/${assignmentId}/quiz/${quiz.data.attempt.id}`,
        employee.cookie,
        { answers },
      )
    ).status,
    409,
  );
  const me = await ws("/me", employee.cookie);
  assert.equal(me.data.assignments[0].status, "Completed");
  assert.equal(me.data.certificates.length, 1);
  certificateId = me.data.certificates[0].id;
  const followup = me.data.assessments.find((a) => a.kind === "Follow-up");
  assert.equal(followup.locked, false);
  const fp = await ws(`/assessments/${followup.id}`, employee.cookie);
  const followResult = await ws(
    `/assessments/${followup.id}`,
    employee.cookie,
    {
      answers: fp.data.questions.map(
        (q) =>
          revision.document.questions.find((x) => x.prompt === q.prompt)
            .correct,
      ),
    },
  );
  assert.equal(followResult.data.change, 100);
  const summary = await ws("/summary?period=all", owner.cookie);
  assert.equal(summary.data.summary.assignmentCompletion, 50);
  assert.equal(summary.data.summary.quizPassRate, 100);
  assert.equal(summary.data.summary.participation, 50);
  assert.equal(summary.data.summary.delivered, 0);
  assert.equal(summary.data.summary.clickRate, null);
  const otherMe = await ws("/me", other.cookie);
  assert.equal(otherMe.data.score, null);
  assert.equal(otherMe.data.assignments[0].status, "Not Started");
  assert.ok((await ws("/me", employee.cookie)).data.events.length >= 3);
});
test("certificate PDF is real; verification is privacy-minimized and revocation is enforced", async () => {
  const pdf = await ws(`/certificates/${certificateId}/pdf`, employee.cookie);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(pdf.data).subarray(0, 5).toString(), "%PDF-");
  assert.equal(
    (await ws(`/certificates/${certificateId}/pdf`, other.cookie)).status,
    404,
  );
  const verify = await call(`/api/public/verify/${certificateId}`);
  assert.equal(verify.data.status, "Valid");
  assert.equal(verify.data.certificate.employee, undefined);
  assert.equal(verify.data.certificate.score, undefined);
  assert.equal(
    (
      await ws(`/certificates/${certificateId}/revoke`, manager.cookie, {
        reason: "Not authorized",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await ws(`/certificates/${certificateId}/revoke`, owner.cookie, {
        reason: "Evidence reviewed by security team",
      })
    ).status,
    204,
  );
  assert.equal(
    (await call(`/api/public/verify/${certificateId}`)).data.status,
    "Revoked",
  );
  assert.equal(
    (await ws(`/certificates/${certificateId}/pdf`, employee.cookie)).status,
    409,
  );
  assert.equal((await call("/api/public/verify/unknown")).status, 404);
  assert.equal(
    (await ws(`/certificates/${certificateId}/reissue`, owner.cookie, {}))
      .status,
    204,
  );
});
test("phishing reports persist, deduplicate, enforce review permissions and do not reward submissions", async () => {
  const before = (await ws("/me", employee.cookie)).data.events.length;
  const input = {
    sender: "suspicious@example.test",
    subject: "Unexpected sign in",
    description: "This asks for my password through an unfamiliar domain.",
    channel: "Email",
  };
  const report = await ws("/phishing", employee.cookie, input);
  assert.equal(report.status, 201);
  const duplicate = await ws("/phishing", employee.cookie, input);
  assert.equal(duplicate.data.id, report.data.id);
  assert.equal(duplicate.data.duplicate, true);
  assert.equal((await ws("/me", employee.cookie)).data.events.length, before);
  const review = {
    status: "Confirmed Suspicious",
    classification: "Suspicious",
    notes: "Internal investigation detail",
  };
  assert.equal(
    (await ws(`/phishing/${report.data.id}`, employee.cookie, review, "PATCH"))
      .status,
    403,
  );
  assert.equal(
    (
      await ws(
        `/phishing/${report.data.id}`,
        otherTenant.cookie,
        review,
        "PATCH",
      )
    ).status,
    404,
  );
  assert.equal(
    (await ws(`/phishing/${report.data.id}`, owner.cookie, review, "PATCH"))
      .status,
    204,
  );
  assert.equal(
    (await ws(`/phishing/${report.data.id}`, owner.cookie, review, "PATCH"))
      .status,
    204,
  );
  assert.equal(
    (await ws("/me", employee.cookie)).data.events.length,
    before + 1,
  );
  assert.equal(
    (await ws("/phishing", employee.cookie)).data.reports[0].notes,
    undefined,
  );
  assert.equal(
    (await ws("/phishing", manager.cookie)).data.reports[0].notes,
    undefined,
    "Internal investigation notes are restricted to security administrators",
  );
  assert.equal((await ws("/phishing", other.cookie)).data.reports.length, 0);
  await ws(
    `/phishing/${report.data.id}`,
    owner.cookie,
    {
      status: "Safe",
      classification: "Safe",
      notes: "Corrected after checking with the sender",
    },
    "PATCH",
  );
  assert.equal(
    (await ws("/me", employee.cookie)).data.components.reporting,
    null,
  );
  assert.equal(
    (await ws("/me", employee.cookie)).data.events.length,
    before + 1,
    "Historical ledger is not deleted",
  );
  await ws(`/phishing/${report.data.id}`, owner.cookie, review, "PATCH");
  assert.equal(
    (await ws("/me", employee.cookie)).data.components.reporting,
    100,
  );
  assert.equal(
    (await ws("/me", employee.cookie)).data.events.length,
    before + 1,
    "Reconfirmation cannot duplicate the credit",
  );
});
test("safe simulation tracking is idempotent, rejects credentials, and pseudonymizes IP", async () => {
  const job = database
    .prepare(
      "SELECT payload_json FROM delivery_jobs WHERE kind='simulation' AND user_id=?",
    )
    .get(employee.id);
  const token = JSON.parse(job.payload_json).text.match(
    /\/simulation\/([^\s]+)/,
  )[1];
  const sent = await call(`/api/public/exercise/${token}`, {
    method: "POST",
    body: { event: "reported" },
  });
  assert.equal(sent.status, 202);
  await call(`/api/public/exercise/${token}`, {
    method: "POST",
    body: { event: "reported" },
  });
  assert.equal(
    (
      await call(`/api/public/exercise/${token}`, {
        method: "POST",
        body: { event: "credentialAttempted" },
      })
    ).status,
    400,
  );
  const target = database
    .prepare(
      "SELECT id FROM simulation_targets WHERE program_id=? AND user_id=?",
    )
    .get(campaignId, employee.id);
  const events = database
    .prepare("SELECT * FROM safe_simulation_events WHERE target_id=?")
    .all(target.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].ip_hash.length, 64);
  assert.equal(
    (
      await call("/api/public/exercise/invalid", {
        method: "POST",
        body: { event: "clicked" },
      })
    ).status,
    202,
  );
});
test("invitations, mandatory temporary password change and single-use reset tokens", async () => {
  const invited = await ws("/people", owner.cookie, {
    name: "Invited Employee",
    email: "invited@example.test",
    department: "Finance",
    role: "employee",
  });
  assert.equal(invited.status, 201);
  assert.equal(invited.data.temporaryPassword, undefined);
  const job = database
    .prepare(
      "SELECT payload_json FROM delivery_jobs WHERE user_id=? AND kind='identity'",
    )
    .get(invited.data.id);
  const token = JSON.parse(job.payload_json).text.split("#")[1];
  const reset = await call("/api/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
  assert.equal(reset.status, 204, JSON.stringify(reset.data));
  assert.equal(
    (
      await call("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
      })
    ).status,
    400,
  );
  const invitedUser = await login("invited@example.test");
  assert.equal(invitedUser.mustChangePassword, false);
  const created = await ws("/people", owner.cookie, {
    name: "Temporary Employee",
    email: "temporary@example.test",
    department: "Finance",
    role: "employee",
    temporaryPassword: password,
  });
  assert.equal(created.status, 201);
  const temp = await login("temporary@example.test");
  assert.equal(temp.mustChangePassword, true);
  assert.equal((await ws("/me", temp.cookie)).status, 403);
  assert.equal(
    (
      await call("/api/auth/change-password", {
        cookie: temp.cookie,
        method: "POST",
        body: { currentPassword: password, newPassword: password + "!" },
      })
    ).status,
    204,
  );
  assert.equal((await ws("/me", temp.cookie)).status, 200);
});
test("MFA uses RFC 6238 vectors, encrypted secret and replay protection; sessions revoke", async () => {
  assert.equal(totp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 1), "287082");
  const setup = await ws("/mfa/setup", owner.cookie, { password });
  assert.equal(setup.status, 200);
  const secretKey = setup.data.secret;
  assert.notEqual(
    database
      .prepare("SELECT mfa_secret FROM identity_policy WHERE user_id=?")
      .get(owner.id).mfa_secret,
    secretKey,
  );
  assert.equal(
    (await ws("/mfa/confirm", owner.cookie, { otp: totp(secretKey) })).status,
    204,
  );
  assert.equal(
    (
      await call("/api/auth/login", {
        method: "POST",
        body: { email: owner.email, password },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await call("/api/auth/login", {
        method: "POST",
        body: { email: owner.email, password, otp: totp(secretKey) },
      })
    ).status,
    401,
  );
  const nextCode = totp(secretKey, Math.floor(Date.now() / 30000) + 1);
  const second = await login(owner.email, nextCode);
  const sessions = await ws("/sessions", owner.cookie);
  const another = sessions.data.sessions.find((s) => !s.current);
  assert.ok(another);
  assert.equal(
    (await ws(`/sessions/${another.id}`, owner.cookie, undefined, "DELETE"))
      .status,
    204,
  );
  assert.equal((await ws("/me", second.cookie)).status, 401);
});
test("reports export safely and course/tenant writes reject unauthorized access", async () => {
  for (const category of [
    "Executive",
    "Campaign",
    "Employee",
    "Compliance Evidence",
  ]) {
    const pdf = await ws(
      `/exports/pdf?category=${encodeURIComponent(category)}&period=all`,
      owner.cookie,
    );
    assert.equal(pdf.status, 200, JSON.stringify(pdf.data));
    assert.equal(Buffer.from(pdf.data).subarray(0, 5).toString(), "%PDF-");
  }
  const csv = await ws(
    "/exports/csv?category=Compliance%20Evidence&period=all",
    owner.cookie,
  );
  assert.equal(csv.status, 200);
  assert.match(Buffer.from(csv.data).toString(), /Phishing Awareness/);
  assert.equal((await ws("/courses", employee.cookie)).status, 403);
  assert.equal(
    (
      await ws("/courses", manager.cookie, {
        document: revision.document,
        status: "Published",
      })
    ).status,
    403,
  );
  assert.equal(
    (await ws("/summary?organization_id=foreign", owner.cookie)).status,
    400,
  );
  const separate = await ws("/summary", otherTenant.cookie);
  assert.equal(separate.data.summary.assigned, 0);
});

test("scheduled campaigns activate once, blocked audiences do not stop other work, and quiz retry gates persist", async () => {
  const custom = await ws("/courses", owner.cookie, {
    status: "Published",
    document: {
      ...revision.document,
      title: "Retry policy validation",
      maxAttempts: 2,
      retryMinutes: 5,
      questions: [
        {
          prompt: "Select both safe actions",
          type: "multiple",
          options: [
            "Verify the sender",
            "Share passwords",
            "Report suspicious links",
          ],
          correct: [0, 2],
          explanation: "Verify and report; never share passwords.",
        },
      ],
    },
  });
  assert.equal(custom.status, 201);
  const newId = custom.data.course.id;
  const payload = {
    name: "Scheduled validation",
    objective: "Validate persisted scheduling and retries",
    ownerId: owner.id,
    userIds: [other.id],
    courseIds: [newId],
    startAt: new Date(Date.now() + 3600000).toISOString(),
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    baseline: false,
    followup: false,
    simulation: null,
    reminders: true,
  };
  const create = await ws("/campaigns", owner.cookie, payload);
  assert.equal(create.status, 201, JSON.stringify(create.data));
  const programId = create.data.id;
  assert.equal(
    (
      await ws(`/campaigns/${programId}/action`, owner.cookie, {
        action: "launch",
        version: 1,
      })
    ).data.campaign.status,
    "Scheduled",
  );
  assert.equal(
    database
      .prepare("SELECT COUNT(*) n FROM learning_assignments WHERE program_id=?")
      .get(programId).n,
    0,
  );
  database
    .prepare("UPDATE programs SET start_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), programId);
  const worker = registerWorkspace(express(), {
    db: database,
    sessionSecret: secret,
    authRequired: (_req, _res, next) => next(),
    allowRoles: () => (_req, _res, next) => next(),
    validate: (schema, value) => schema.parse(value),
    writeAudit: () => {},
  });
  await worker.tick();
  await worker.tick();
  const assignments = database
    .prepare("SELECT * FROM learning_assignments WHERE program_id=?")
    .all(programId);
  assert.equal(assignments.length, 1);
  const aid = assignments[0].id;
  const content = await ws(`/learning/${aid}`, other.cookie);
  assert.equal(content.status, 200);
  for (
    let lessonIndex = 1;
    lessonIndex <= revision.document.lessons.length;
    lessonIndex++
  )
    assert.equal(
      (await ws(`/learning/${aid}/progress`, other.cookie, { lessonIndex }))
        .status,
      204,
    );
  const first = await ws(`/learning/${aid}/quiz`, other.cookie, {});
  assert.equal(first.data.questions[0].correct, undefined);
  const wrong = await ws(
    `/learning/${aid}/quiz/${first.data.attempt.id}`,
    other.cookie,
    { answers: [[0]] },
  );
  assert.equal(wrong.data.passed, false);
  assert.equal(
    (await ws(`/learning/${aid}/quiz`, other.cookie, {})).data.error.code,
    "RETRY_NOT_READY",
  );
  database
    .prepare("UPDATE learning_attempts SET retry_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), first.data.attempt.id);
  const second = await ws(`/learning/${aid}/quiz`, other.cookie, {});
  assert.equal(second.data.attempt.number, 2);
  assert.equal(
    (
      await ws(
        `/learning/${aid}/quiz/${second.data.attempt.id}`,
        other.cookie,
        { answers: [[2, 0]] },
      )
    ).data.passed,
    true,
  );
  assert.equal(
    (await ws(`/learning/${aid}/quiz`, other.cookie, {})).data.error.code,
    "ALREADY_PASSED",
  );
  const scoped = (
    await ws(`/summary?campaignId=${programId}&period=all`, owner.cookie)
  ).data;
  assert.equal(scoped.summary.assigned, 1);
  assert.equal(scoped.users.find((u) => u.id === other.id).assigned, 1);
  assert.equal(scoped.users.find((u) => u.id === other.id).completion, 100);
  const blocked = await ws("/campaigns", owner.cookie, {
    ...payload,
    name: "Missing active audience",
  });
  await ws(`/campaigns/${blocked.data.id}/action`, owner.cookie, {
    action: "launch",
    version: 1,
  });
  database
    .prepare("UPDATE programs SET start_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), blocked.data.id);
  database
    .prepare("DELETE FROM program_audience WHERE program_id=?")
    .run(blocked.data.id);
  await worker.tick();
  assert.equal(
    database
      .prepare("SELECT status FROM programs WHERE id=?")
      .get(blocked.data.id).status,
    "Draft",
  );
  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) n FROM user_notifications WHERE dedupe_key LIKE 'activation-blocked:%'",
      )
      .get().n,
    1,
  );
});

const intel = (path, actor = owner, body, method) =>
  ws("/intelligence" + path, actor.cookie, body, method);
test("intelligence keeps AI disabled, evidence scoped, and employee risk private", async () => {
  const settings = await intel("/settings");
  assert.equal(settings.status, 200);
  assert.equal(settings.data.settings.mode, "Observe");
  assert.equal(settings.data.provider.enabled, false);
  assert.equal((await intel("/profiles", employee)).status, 403);
  assert.equal((await intel("/profiles", manager)).status, 403);
  assert.equal((await intel(`/profiles/${otherTenant.id}`)).status, 404);
  const context = await intel(
    `/profiles/${other.id}/context`,
    owner,
    {
      businessRole: "Payment approver",
      location: "Makassar",
      impact: 75,
      privileged: true,
      rationale: "Approves payments for the finance department.",
    },
    "PUT",
  );
  assert.equal(context.status, 200, JSON.stringify(context.data));
  const signal = {
    userId: other.id,
    kind: "exposure_observed",
    topic: "BEC",
    value: 80,
    sourceId: "security-incident-1",
    description: "Verified targeted payment request exposure.",
    occurredAt: new Date().toISOString(),
  };
  const first = await intel("/signals", owner, signal);
  assert.equal(first.status, 201);
  assert.equal((await intel("/signals", owner, signal)).data.id, first.data.id);
  assert.equal(
    (await intel("/signals", owner, { ...signal, userId: otherTenant.id }))
      .status,
    404,
  );
  assert.equal(
    (
      await intel("/signals", owner, {
        ...signal,
        occurredAt: "2099-01-01T00:00:00.000Z",
      })
    ).status,
    400,
  );
  const profile = (await intel(`/profiles/${other.id}`)).data.profile;
  assert.equal(profile.factors.impact, 75);
  assert.equal(profile.factors.threat, 80);
  assert.ok(profile.ledger.every((e) => e.source && e.source_id));
  const me = (await intel("/me", other)).data;
  for (const key of ["score", "risk", "factors", "ledger", "drivers", "label"])
    assert.equal(key in me, false);
  assert.ok(me.awareness);
  assert.ok(me.level);
  assert.ok(me.skills);
  const generated = await intel("/studios", owner, {
    kind: "content",
    topic: "BEC",
    generate: true,
  });
  assert.equal(generated.status, 503);
  assert.equal(generated.data.error.code, "AI_UNCONFIGURED");
  assert.equal(
    (await intel("/sources/url", owner, { url: "https://127.0.0.1/private" }))
      .status,
    400,
  );
});

test("studio review is versioned, publication gated, and source text preserved", async () => {
  const source = "Policy guidance. ".repeat(1600);
  let draft = (
    await intel("/studios", owner, {
      kind: "content",
      topic: "BEC",
      title: "Policy to practical decisions",
      sourceText: source,
      sourceLabel: "Finance policy",
    })
  ).data.draft;
  assert.equal(draft.status, "Draft");
  assert.equal(draft.document.lessons.map((l) => l.content).join(""), source);
  assert.equal((await intel(`/studios/${draft.id}`, otherTenant)).status, 404);
  assert.equal(
    (
      await intel(`/studios/${draft.id}/action`, owner, {
        action: "publish",
        version: draft.version,
        acknowledged: true,
      })
    ).status,
    409,
  );
  let response = await intel(`/studios/${draft.id}/action`, owner, {
    action: "review",
    version: draft.version,
    acknowledged: true,
  });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  draft = response.data.draft;
  const invalid = {
    ...draft.document,
    questions: [draft.document.questions[0], draft.document.questions[0]],
  };
  assert.equal(
    (
      await intel(
        `/studios/${draft.id}`,
        owner,
        { version: draft.version, document: invalid },
        "PUT",
      )
    ).status,
    400,
  );
  response = await intel(
    `/studios/${draft.id}`,
    owner,
    {
      version: draft.version,
      document: { ...draft.document, title: "Updated verified payment policy" },
    },
    "PUT",
  );
  assert.equal(response.status, 200);
  draft = response.data.draft;
  assert.equal(draft.status, "Draft");
  assert.equal(draft.reviewed_by, null);
  assert.equal(
    (
      await intel(
        `/studios/${draft.id}`,
        owner,
        { version: 1, document: draft.document },
        "PUT",
      )
    ).status,
    409,
  );
  for (const action of ["review", "approve", "publish"]) {
    response = await intel(`/studios/${draft.id}/action`, owner, {
      action,
      version: draft.version,
      acknowledged: true,
    });
    assert.equal(response.status, 200, JSON.stringify(response.data));
    draft = response.data.draft;
  }
  assert.equal(draft.status, "Published");
  assert.ok(draft.published_revision_id);
  assert.equal(
    database
      .prepare("SELECT status FROM course_revisions WHERE id=?")
      .get(draft.published_revision_id).status,
    "Published",
  );
  assert.equal(
    (
      await intel(
        `/studios/${draft.id}`,
        owner,
        { version: draft.version, document: draft.document },
        "PUT",
      )
    ).status,
    409,
  );
});

test("approved practice is private, safe, idempotent, and rewards the recorded decision", async () => {
  let draft = (
    await intel("/studios", owner, {
      kind: "simulation",
      topic: "BEC",
      channel: "Email",
      title: "Payment verification practice",
    })
  ).data.draft;
  assert.equal(
    (
      await intel(`/studios/${draft.id}/assign`, owner, {
        userIds: [other.id],
        acknowledged: true,
      })
    ).status,
    409,
  );
  for (const action of ["review", "approve"])
    draft = (
      await intel(`/studios/${draft.id}/action`, owner, {
        action,
        version: draft.version,
        acknowledged: true,
      })
    ).data.draft;
  assert.equal(
    (
      await intel(`/studios/${draft.id}/assign`, owner, {
        userIds: [otherTenant.id],
        acknowledged: true,
      })
    ).status,
    404,
  );
  const assignment = await intel(`/studios/${draft.id}/assign`, owner, {
    userIds: [other.id],
    acknowledged: true,
  });
  assert.equal(assignment.status, 201, JSON.stringify(assignment.data));
  const p = database
    .prepare("SELECT * FROM practice_assignments WHERE draft_id=?")
    .get(draft.id);
  assert.ok(p);
  assert.equal((await intel(`/practice/${p.id}`, employee)).status, 404);
  const initial = await intel(`/practice/${p.id}`, other);
  assert.equal(initial.data.coaching, null);
  assert.equal(initial.data.practice.indicators, undefined);
  assert.equal(
    (await intel(`/practice/${p.id}/send`, owner, { acknowledged: true })).data
      .error.code,
    "SMTP_UNCONFIGURED",
  );
  await intel(`/practice/${p.id}/event`, other, { event: "opened" });
  await intel(`/practice/${p.id}/event`, other, { event: "clicked" });
  await intel(`/practice/${p.id}/event`, other, { event: "reported" });
  await intel(`/practice/${p.id}/event`, other, { event: "opened" });
  const completed = database
    .prepare("SELECT * FROM practice_assignments WHERE id=?")
    .get(p.id);
  assert.equal(completed.status, "Completed");
  assert.ok(completed.clicked_at);
  assert.equal(completed.reported_at, null);
  assert.equal(
    database
      .prepare("SELECT COUNT(*) n FROM risk_signals WHERE source_id=?")
      .get(p.id).n,
    1,
  );
  assert.ok((await intel(`/practice/${p.id}`, other)).data.coaching);
  assert.equal(
    (
      await intel(`/practice/${p.id}/event`, other, {
        event: "clicked",
        password: "must-not-accept",
      })
    ).status,
    400,
  );
});

test("signed connector enforces exact bytes, timestamp, tenant, delivery and event deduplication", async () => {
  const { createHmac } = await import("node:crypto");
  const connector = (
    await intel("/connectors", owner, { name: "Verified security events" })
  ).data;
  const event = {
    userId: other.id,
    kind: "identity_verified",
    topic: "MFA",
    sourceId: "identity-event-7",
    description: "Verified authentication protection from the source system.",
    occurredAt: new Date().toISOString(),
  };
  const signed = async (
    events,
    id = "delivery-000001",
    stamp = String(Date.now()),
    tamper = false,
  ) => {
    const body = JSON.stringify({ events }, null, 2);
    const signature = createHmac("sha256", connector.signingSecret)
      .update(`${stamp}.${id}.${body}`)
      .digest("hex");
    const response = await fetch(url + connector.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${connector.token}`,
        "x-averis-timestamp": stamp,
        "x-averis-delivery-id": id,
        "x-averis-signature": signature,
      },
      body: tamper ? body + " " : body,
    });
    return { status: response.status, data: await response.json() };
  };
  assert.equal(
    (await signed([event], "delivery-tamper", String(Date.now()), true)).status,
    401,
  );
  assert.equal(
    (await signed([event], "delivery-expired", String(Date.now() - 600001)))
      .status,
    401,
  );
  assert.equal(
    (await signed([{ ...event, userId: otherTenant.id }], "delivery-foreign"))
      .status,
    404,
  );
  assert.equal((await signed([event])).data.accepted, 1);
  assert.equal((await signed([event])).data.duplicate, true);
  assert.equal(
    (await signed([event], "delivery-repeat-event")).data.accepted,
    1,
  );
  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) n FROM risk_signals WHERE source=? AND source_id=?",
      )
      .get(`Connector: ${connector.id}`, event.sourceId).n,
    1,
  );
  const listing = (await intel("/integrations")).data;
  assert.equal(JSON.stringify(listing).includes(connector.token), false);
  await intel(`/connectors/${connector.id}/revoke`, owner, {});
  assert.equal((await signed([event], "delivery-revoked")).status, 401);
});

test("autopilot respects Observe, explicit approval, cadence, wait, and follow-up outcomes", async () => {
  const cohort = (
    await intel("/cohorts", owner, {
      name: "Payment practice cohort",
      description: "Verified BEC behavior signals",
      conditions: {
        topic: "BEC",
        signalKind: "simulation_clicked",
        minimumCount: 2,
        windowDays: 60,
      },
    })
  ).data;
  const policy = (
    await intel("/policies", owner, {
      name: "Payment verification reinforcement",
      goal: "Support independent payment verification",
      cohortId: cohort.id,
      topic: "BEC",
      action: "Coaching",
      waitDays: 1,
      cadenceDays: 7,
      continuous: true,
    })
  ).data;
  const orgId = owner.organization.id;
  const now = new Date().toISOString();
  for (let i = 0; i < 2; i++)
    database
      .prepare(
        "INSERT INTO risk_signals(id,organization_id,user_id,kind,topic,source,source_id,description,occurred_at,ingested_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        `autopilot-test-${i}`,
        orgId,
        other.id,
        "simulation_clicked",
        "BEC",
        "Verified test fixture",
        `fixture-${i}`,
        "Controlled decision requires support.",
        now,
        now,
      );
  const worker = registerWorkspace(express(), {
    db: database,
    sessionSecret: secret,
    authRequired: (_req, _res, next) => next(),
    allowRoles: () => (_req, _res, next) => next(),
    validate: (schema, value) => schema.parse(value),
    writeAudit: () => {},
  });
  await intel(`/policies/${policy.id}/approval`, owner, {
    enabled: true,
    version: 1,
    acknowledged: true,
  });
  await worker.tick();
  assert.equal(
    database
      .prepare("SELECT COUNT(*) n FROM intervention_steps WHERE policy_id=?")
      .get(policy.id).n,
    0,
  );
  const settings = (await intel("/settings")).data.settings;
  await intel(
    "/settings",
    owner,
    {
      mode: "Automate",
      minimumSample: 5,
      retentionDays: 365,
      cadenceDays: 30,
      aiEnabled: false,
      version: settings.version,
      acknowledged: true,
    },
    "PUT",
  );
  await worker.tick();
  await worker.tick();
  let steps = database
    .prepare("SELECT * FROM intervention_steps WHERE policy_id=?")
    .all(policy.id);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].status, "Waiting");
  database
    .prepare("UPDATE intervention_steps SET due_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), steps[0].id);
  await worker.tick();
  let step = database
    .prepare("SELECT * FROM intervention_steps WHERE id=?")
    .get(steps[0].id);
  assert.equal(step.status, "Practice assigned");
  await intel(`/practice/${step.result}/event`, other, { event: "reported" });
  database
    .prepare("UPDATE intervention_steps SET due_at=? WHERE id=?")
    .run(new Date(Date.now() - 1000).toISOString(), step.id);
  await worker.tick();
  step = database
    .prepare("SELECT * FROM intervention_steps WHERE id=?")
    .get(step.id);
  assert.equal(step.status, "Positive behavior");
  const outcomes = (await intel("/outcomes", manager)).data.outcomes;
  assert.ok(
    outcomes.every(
      (o) =>
        o.users >= 5 ||
        (o.before.clickRate === null && o.after.clickRate === null),
    ),
  );
  await intel(`/policies/${policy.id}/approval`, owner, {
    enabled: false,
    version: 2,
    acknowledged: true,
  });
});
