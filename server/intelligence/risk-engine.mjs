export const ENGINE_VERSION = "averis-risk/2.0.0";
export const WINDOW_DAYS = 90;
export const clamp = (value) => Math.max(0, Math.min(100, value));
export const mean = (values) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;
export const riskLabel = (value) =>
  value === null
    ? "Unmeasured"
    : value < 25
      ? "Minimal"
      : value < 50
        ? "Moderate"
        : value < 75
          ? "Elevated"
          : "Critical";
export const SIGNAL_KINDS = [
  "knowledge_assessed",
  "simulation_clicked",
  "simulation_reported",
  "report_confirmed",
  "learning_completed",
  "coaching_completed",
  "threat_targeted",
  "exposure_observed",
  "identity_risk",
  "identity_verified",
  "unsafe_sharing",
  "verified_request",
  "role_context",
];
export const TOPICS = [
  "Phishing",
  "BEC",
  "QR Phishing",
  "Smishing",
  "Vishing",
  "Social Engineering",
  "MFA",
  "Passkeys",
  "Device Code Phishing",
  "OAuth Consent",
  "Password Security",
  "Data Protection",
  "AI Security",
  "Shadow AI",
  "Secure Collaboration",
  "Remote Work",
  "Secure Browsing",
  "Malware",
  "Ransomware",
  "Incident Reporting",
  "Insider Risk Awareness",
  "Secure Development",
  "Vendor Risk",
  "Executive Security",
];
export function inferTopic(text = "") {
  const patterns = [
    ["QR Phishing", /\bqr\b/i],
    ["BEC", /\bbec\b|invoice|payment|payroll|email compromise/i],
    ["Device Code Phishing", /device code/i],
    ["OAuth Consent", /oauth|consent/i],
    ["MFA", /\bmfa\b|multi.factor/i],
    ["Passkeys", /passkey/i],
    ["Password Security", /password/i],
    ["AI Security", /\bai\b|artificial/i],
    ["Data Protection", /data|privacy/i],
    ["Secure Collaboration", /sharing|collaborat/i],
  ];
  return (
    patterns.find(([, pattern]) => pattern.test(text))?.[0] ||
    TOPICS.find((t) => text.toLowerCase().includes(t.toLowerCase())) ||
    "Phishing"
  );
}
function apply(factors, event) {
  const change = (key, delta, baseline) => {
    factors[key] = clamp((factors[key] ?? baseline) + delta);
  };
  switch (event.kind) {
    case "role_context":
      factors.impact = clamp(event.value);
      break;
    case "knowledge_assessed":
      factors.vulnerability = clamp(100 - event.value);
      break;
    case "simulation_clicked":
      change("vulnerability", 12, 50);
      break;
    case "unsafe_sharing":
      change("vulnerability", 10, 50);
      break;
    case "identity_risk":
      change("vulnerability", 8, 50);
      break;
    case "identity_verified":
      change("vulnerability", -5, 50);
      break;
    case "simulation_reported":
      change("vulnerability", -8, 50);
      break;
    case "report_confirmed":
      change("vulnerability", -6, 50);
      break;
    case "verified_request":
      change("vulnerability", -5, 50);
      break;
    case "threat_targeted":
      change("threat", 20, 0);
      break;
    case "exposure_observed":
      factors.threat = clamp(event.value);
      break;
    // Participation alone never proves a safer decision.
  }
}
export function factorScore(factors) {
  return Object.values(factors).some((v) => v === null)
    ? null
    : Math.round(
        (factors.threat * factors.vulnerability * factors.impact) / 10000,
      );
}
export function replayRisk(events, asOf = new Date().toISOString()) {
  const end = new Date(asOf).getTime();
  const cutoff = end - WINDOW_DAYS * 86400000;
  const valid = events.filter(
    (e) =>
      !e.invalidated && e.verified && new Date(e.occurred_at).getTime() <= end,
  );
  const context = valid
    .filter((e) => e.kind === "role_context")
    .sort(
      (a, b) =>
        a.occurred_at.localeCompare(b.occurred_at) ||
        a.ingested_at.localeCompare(b.ingested_at),
    )
    .at(-1);
  const active = valid.filter(
    (e) =>
      e.kind !== "role_context" && new Date(e.occurred_at).getTime() >= cutoff,
  );
  if (context) active.push(context);
  active.sort(
    (a, b) =>
      a.occurred_at.localeCompare(b.occurred_at) ||
      a.ingested_at.localeCompare(b.ingested_at) ||
      a.id.localeCompare(b.id),
  );
  const factors = { threat: null, vulnerability: null, impact: null };
  const ledger = active.map((event) => {
    const before = factorScore(factors);
    const previous = { ...factors };
    apply(factors, event);
    const after = factorScore(factors);
    return {
      ...event,
      before,
      after,
      delta: before === null || after === null ? null : after - before,
      factorChanges: Object.keys(factors)
        .filter((k) => factors[k] !== previous[k])
        .map((k) => ({ factor: k, previous: previous[k], value: factors[k] })),
    };
  });
  const score = factorScore(factors);
  const known = Object.values(factors).filter((v) => v !== null).length;
  const coverage = Math.round((known / 3) * 100);
  const confidence =
    coverage < 100
      ? "Low"
      : ledger.filter(
            (e) => e.kind !== "role_context" && e.factorChanges.length > 0,
          ).length >= 5
        ? "High"
        : "Medium";
  const driverEvents = ledger.filter((e) =>
    [
      "simulation_clicked",
      "unsafe_sharing",
      "identity_risk",
      "threat_targeted",
    ].includes(e.kind),
  );
  const driverMap = new Map();
  for (const e of driverEvents) {
    const d = driverMap.get(e.topic) || {
      topic: e.topic,
      count: 0,
      evidence: [],
    };
    d.count++;
    d.evidence.push(e.id);
    driverMap.set(e.topic, d);
  }
  return {
    score,
    label: riskLabel(score),
    factors,
    coverage,
    confidence,
    missing: Object.keys(factors).filter((k) => factors[k] === null),
    ledger: ledger.reverse(),
    drivers: [...driverMap.values()].sort((a, b) => b.count - a.count),
    version: ENGINE_VERSION,
    windowDays: WINDOW_DAYS,
    explanation:
      "Threat × vulnerability × impact / 10,000. Missing factors remain unmeasured. Confidence describes evidence coverage, not a probability.",
  };
}
export function skillLevel(events) {
  const measured = events.filter(
    (e) =>
      !e.invalidated &&
      e.verified &&
      [
        "knowledge_assessed",
        "simulation_clicked",
        "simulation_reported",
        "verified_request",
      ].includes(e.kind),
  );
  const safe = measured.filter(
    (e) =>
      e.kind === "simulation_reported" ||
      e.kind === "verified_request" ||
      (e.kind === "knowledge_assessed" && e.value >= 80),
  ).length;
  const rate = measured.length ? safe / measured.length : 0;
  return measured.length >= 15 && rate >= 0.95
    ? "Resilient"
    : measured.length >= 10 && rate >= 0.85
      ? "Advanced"
      : measured.length >= 5 && rate >= 0.8
        ? "Skilled"
        : measured.length >= 2 && rate >= 0.6
          ? "Developing"
          : "Foundation";
}
export function adaptivePlan(profile, baseline = 30) {
  const recent = profile.ledger.filter(
    (e) => new Date(e.occurred_at) > new Date(Date.now() - 60 * 86400000),
  );
  const unsafe = recent.filter(
    (e) => e.kind === "simulation_clicked" || e.kind === "unsafe_sharing",
  );
  const safe = recent.filter((e) =>
    ["simulation_reported", "verified_request", "report_confirmed"].includes(
      e.kind,
    ),
  );
  const level = skillLevel(recent);
  const topic =
    profile.drivers[0]?.topic ||
    (profile.context?.business_role.match(/finance|payment/i)
      ? "BEC"
      : "Phishing");
  const cadenceDays =
    unsafe.length >= 2
      ? Math.max(7, Math.round(baseline / 2))
      : safe.length >= 3 && !unsafe.length
        ? Math.min(90, baseline * 2)
        : baseline;
  return {
    topic,
    level,
    difficulty: {
      Foundation: 2,
      Developing: 4,
      Skilled: 6,
      Advanced: 8,
      Resilient: 9,
    }[level],
    cadenceDays,
    reason:
      unsafe.length >= 2
        ? `${unsafe.length} observed decisions need reinforcement; focus on ${topic}.`
        : safe.length >= 3 && !unsafe.length
          ? "Consistent verified safe behavior supports a lighter cadence."
          : profile.context?.business_role.match(/finance|payment/i)
            ? "Payment-related responsibility makes verification of financial requests relevant."
            : "Establish evidence before changing the baseline cadence.",
    outcome:
      topic === "BEC"
        ? "Verify payment-detail changes through a trusted channel."
        : `Recognize and report ${topic.toLowerCase()} requests before acting.`,
  };
}
export function cohortMatches(profile, conditions, at = Date.now()) {
  if (conditions.department && profile.department !== conditions.department)
    return false;
  if (
    conditions.businessRole &&
    !profile.context?.business_role
      .toLowerCase()
      .includes(conditions.businessRole.toLowerCase())
  )
    return false;
  if (conditions.excludeRole && profile.role === conditions.excludeRole)
    return false;
  if (conditions.privileged && !profile.context?.privileged) return false;
  if (
    conditions.minimumRisk !== undefined &&
    (profile.score === null || profile.score < conditions.minimumRisk)
  )
    return false;
  if (
    conditions.newWithinDays &&
    new Date(profile.created_at).getTime() <
      at - conditions.newWithinDays * 86400000
  )
    return false;
  if (conditions.signalKind || conditions.topic) {
    const matches = profile.ledger.filter(
      (e) =>
        (!conditions.signalKind || e.kind === conditions.signalKind) &&
        (!conditions.topic || e.topic === conditions.topic) &&
        new Date(e.occurred_at).getTime() >=
          at - (conditions.windowDays || 60) * 86400000,
    );
    if (matches.length < (conditions.minimumCount || 1)) return false;
  }
  return true;
}
