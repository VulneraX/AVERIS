import test from "node:test";
import assert from "node:assert/strict";
import {
  replayRisk,
  adaptivePlan,
  cohortMatches,
  skillLevel,
} from "./risk-engine.mjs";
import {
  validateQuestions,
  validateSimulation,
  generateAI,
  draftCourseSchema,
} from "./ai.mjs";
import {
  courseDocument,
  simulationDocument,
  COMPETENCIES,
} from "./catalog.mjs";
const at = "2026-09-12T12:00:00.000Z";
const event = (kind, value, index = 0, extra = {}) => ({
  id: String(index),
  kind,
  value,
  topic: "Phishing",
  verified: 1,
  invalidated: 0,
  occurred_at: `2026-09-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
  ingested_at: at,
  ...extra,
});
test("risk requires three observed factors; ledger replays exact changes", () => {
  assert.equal(replayRisk([], at).score, null);
  const events = [
    event("role_context", 75),
    event("knowledge_assessed", 60, 1),
    event("exposure_observed", 80, 2),
    event("simulation_clicked", null, 3),
    event("simulation_reported", null, 4),
  ];
  const r = replayRisk(events, at);
  assert.deepEqual(r.factors, { threat: 80, vulnerability: 44, impact: 75 });
  assert.equal(r.score, 26);
  assert.equal(r.coverage, 100);
  assert.equal(r.ledger[0].before, 31);
  assert.equal(r.ledger[0].delta, -5);
  assert.deepEqual(replayRisk([...events].reverse(), at), r);
  assert.equal(replayRisk(events, "2026-09-03T12:00:00.000Z").score, 24);
  assert.equal(
    replayRisk(
      events.filter((e) => e.kind !== "exposure_observed"),
      at,
    ).score,
    null,
  );
});
test("participation is not behavior; invalid, stale and future evidence cannot lower risk", () => {
  const base = [
    event("role_context", 100, 0, { occurred_at: "2020-01-01T00:00:00.000Z" }),
    event("exposure_observed", 100, 1),
    event("knowledge_assessed", 50, 2),
  ];
  const noisy = [
    ...base,
    event("learning_completed", null, 3),
    event("coaching_completed", null, 4),
    event("knowledge_assessed", 100, 5, { invalidated: 1 }),
    event("knowledge_assessed", 100, 6, { verified: 0 }),
    event("knowledge_assessed", 100, 7, {
      occurred_at: "2026-09-20T00:00:00.000Z",
    }),
  ];
  assert.equal(replayRisk(noisy, at).score, 50);
  assert.equal(replayRisk(noisy, "2027-01-01T00:00:00.000Z").score, null);
  assert.equal(
    replayRisk(noisy, "2027-01-01T00:00:00.000Z").factors.impact,
    100,
  );
});
test("adaptive pacing is supported by safe or repeated unsafe decisions", () => {
  const date = new Date().toISOString();
  const unsafe = [0, 1].map((i) =>
    event("simulation_clicked", null, i, { occurred_at: date }),
  );
  const profile = {
    ledger: unsafe,
    drivers: [{ topic: "BEC" }],
    context: { business_role: "Finance" },
    score: 45,
    department: "Finance",
    role: "employee",
    created_at: date,
  };
  assert.equal(adaptivePlan(profile).cadenceDays, 15);
  assert.equal(adaptivePlan(profile).difficulty, 2);
  const safe = [0, 1, 2, 3, 4].map((i) =>
    event("simulation_reported", null, i, { occurred_at: date }),
  );
  assert.equal(skillLevel(safe), "Skilled");
  assert.equal(adaptivePlan({ ...profile, ledger: safe }).cadenceDays, 60);
  assert.equal(
    cohortMatches(profile, {
      department: "Finance",
      signalKind: "simulation_clicked",
      minimumCount: 2,
    }),
    true,
  );
  assert.equal(
    cohortMatches(profile, { department: "Finance", minimumRisk: 50 }),
    false,
  );
});
test("24 editorial competencies have valid varied answer mappings and controlled simulations", () => {
  assert.equal(COMPETENCIES.length, 24);
  for (const c of COMPETENCIES) {
    const topic = Array.isArray(c) ? c[0] : c.topic;
    const document = courseDocument(topic);
    assert.doesNotThrow(() => draftCourseSchema.parse(document));
    assert.doesNotThrow(() => validateQuestions(document.questions));
    assert.ok(new Set(document.questions.map((q) => q.correct[0])).size > 1);
    assert.doesNotThrow(() =>
      validateSimulation(simulationDocument(topic, 4, "Email")),
    );
  }
  const document = courseDocument("Phishing");
  assert.throws(
    () => validateQuestions([document.questions[0], document.questions[0]]),
    /duplicate/i,
  );
  assert.throws(
    () => validateQuestions([{ ...document.questions[0], correct: [99] }]),
    /mapping/i,
  );
  assert.throws(
    () =>
      validateSimulation({
        ...simulationDocument("Phishing", 2, "Email"),
        message: "Open https://external.example and authorize the request.",
      }),
    /plain-text/i,
  );
});
test("unconfigured AI fails explicitly without returning a fabricated draft", async () => {
  await assert.rejects(
    generateAI({
      enabled: false,
      kind: "content",
      input: {},
      schema: draftCourseSchema,
    }),
    (e) => e.status === 503 && e.code === "AI_UNCONFIGURED",
  );
});
