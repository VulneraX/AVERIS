export function migrateIntelligence(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS intelligence_settings (
      organization_id TEXT PRIMARY KEY REFERENCES organizations(id),
      mode TEXT NOT NULL DEFAULT 'Observe', minimum_sample INTEGER NOT NULL DEFAULT 5,
      retention_days INTEGER NOT NULL DEFAULT 365, cadence_days INTEGER NOT NULL DEFAULT 30,
      ai_enabled INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS risk_contexts (
      organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
      business_role TEXT NOT NULL, location TEXT NOT NULL DEFAULT '', impact INTEGER NOT NULL,
      privileged INTEGER NOT NULL DEFAULT 0, rationale TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(organization_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS risk_signals (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL, topic TEXT NOT NULL, value REAL, source TEXT NOT NULL, source_id TEXT NOT NULL,
      description TEXT NOT NULL, occurred_at TEXT NOT NULL, ingested_at TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1, invalidated INTEGER NOT NULL DEFAULT 0,
      UNIQUE(organization_id,user_id,source,source_id)
    );
    CREATE INDEX IF NOT EXISTS risk_signals_lookup ON risk_signals(organization_id,user_id,occurred_at);
    CREATE TABLE IF NOT EXISTS risk_cohorts (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL,
      description TEXT NOT NULL, conditions_json TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intelligence_decisions (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), recommendation_key TEXT NOT NULL,
      kind TEXT NOT NULL, topic TEXT NOT NULL, user_ids_json TEXT NOT NULL, evidence_json TEXT NOT NULL,
      observation TEXT NOT NULL, expected_outcome TEXT NOT NULL, status TEXT NOT NULL,
      actor_id TEXT, policy_id TEXT, program_id TEXT, created_at TEXT NOT NULL, system_version TEXT NOT NULL,
      UNIQUE(organization_id,recommendation_key)
    );
    CREATE TABLE IF NOT EXISTS coaching_assignments (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
      topic TEXT NOT NULL, reason TEXT NOT NULL, content_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Assigned',
      source_id TEXT NOT NULL, created_at TEXT NOT NULL, completed_at TEXT,
      UNIQUE(organization_id,user_id,source_id)
    );
    CREATE TABLE IF NOT EXISTS threat_bulletins (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), title TEXT NOT NULL,
      topic TEXT NOT NULL, description TEXT NOT NULL, source TEXT NOT NULL, source_url TEXT NOT NULL,
      observed_at TEXT NOT NULL, updated_at TEXT NOT NULL, region TEXT NOT NULL, industry TEXT NOT NULL,
      departments_json TEXT NOT NULL, created_by TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intelligence_drafts (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), kind TEXT NOT NULL,
      title TEXT NOT NULL, input_json TEXT NOT NULL, document_json TEXT NOT NULL, provenance TEXT NOT NULL,
      model TEXT, status TEXT NOT NULL DEFAULT 'Draft', version INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL, reviewed_by TEXT, approved_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      published_revision_id TEXT
    );
    CREATE TABLE IF NOT EXISTS intelligence_audit (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), actor_id TEXT,
      action TEXT NOT NULL, entity_id TEXT, system_version TEXT NOT NULL, input_json TEXT NOT NULL,
      output_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intervention_policies (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL,
      goal TEXT NOT NULL, cohort_id TEXT NOT NULL REFERENCES risk_cohorts(id), topic TEXT NOT NULL,
      action TEXT NOT NULL, wait_days INTEGER NOT NULL, cadence_days INTEGER NOT NULL,
      continuous INTEGER NOT NULL DEFAULT 0, enabled INTEGER NOT NULL DEFAULT 0,
      approved_by TEXT, approved_at TEXT, version INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intervention_steps (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), policy_id TEXT NOT NULL REFERENCES intervention_policies(id),
      user_id TEXT NOT NULL REFERENCES users(id), decision_id TEXT NOT NULL, due_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Waiting', result TEXT, updated_at TEXT NOT NULL,
      UNIQUE(policy_id,user_id,decision_id)
    );
    CREATE TABLE IF NOT EXISTS practice_assignments (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
      draft_id TEXT REFERENCES intelligence_drafts(id), topic TEXT NOT NULL, channel TEXT NOT NULL,
      difficulty INTEGER NOT NULL, document_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Assigned',
      delivery TEXT NOT NULL DEFAULT 'Scenario only', source_id TEXT NOT NULL, token_hash TEXT UNIQUE,
      created_at TEXT NOT NULL, expires_at TEXT NOT NULL, opened_at TEXT, clicked_at TEXT, reported_at TEXT,
      UNIQUE(organization_id,user_id,source_id)
    );
    CREATE TABLE IF NOT EXISTS signal_connectors (
      id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE, signing_secret TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT
    );
    CREATE TABLE IF NOT EXISTS connector_deliveries (
      connector_id TEXT NOT NULL REFERENCES signal_connectors(id), delivery_id TEXT NOT NULL,
      created_at TEXT NOT NULL, PRIMARY KEY(connector_id,delivery_id)
    );
    CREATE TABLE IF NOT EXISTS report_triage (
      report_id TEXT PRIMARY KEY REFERENCES phishing_reports(id), organization_id TEXT NOT NULL REFERENCES organizations(id),
      classification TEXT NOT NULL, confidence TEXT NOT NULL, indicators_json TEXT NOT NULL,
      summary TEXT NOT NULL, next_action TEXT NOT NULL, provenance TEXT NOT NULL, model TEXT,
      created_by TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
}
