// Additive, transactional migrations. Legacy data is retained for review, never
// treated as individually verified learning or score evidence.
export function migrate(db) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  const migrations = [
    [
      1,
      `
      CREATE TABLE programs (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
        name TEXT NOT NULL, objective TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Scheduled','Active','Completed','Archived','Cancelled')),
        start_at TEXT, due_at TEXT, baseline INTEGER NOT NULL DEFAULT 0, followup INTEGER NOT NULL DEFAULT 1,
        simulation TEXT, reminders INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE program_audience (program_id TEXT NOT NULL REFERENCES programs(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(program_id,user_id));
      CREATE TABLE course_revisions (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), course_id TEXT NOT NULL,
        version INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('Draft','Published','Archived')),
        document_json TEXT NOT NULL, created_by TEXT REFERENCES users(id), created_at TEXT NOT NULL,
        UNIQUE(organization_id,course_id,version)
      );
      CREATE TABLE program_courses (program_id TEXT NOT NULL REFERENCES programs(id), revision_id TEXT NOT NULL REFERENCES course_revisions(id), PRIMARY KEY(program_id,revision_id));
      CREATE TABLE learning_assignments (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), program_id TEXT NOT NULL REFERENCES programs(id),
        user_id TEXT NOT NULL REFERENCES users(id), revision_id TEXT NOT NULL REFERENCES course_revisions(id),
        lesson_index INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Not Started',
        due_at TEXT NOT NULL, started_at TEXT, completed_at TEXT, updated_at TEXT NOT NULL,
        UNIQUE(program_id,user_id,revision_id)
      );
      CREATE TABLE program_assessments (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), program_id TEXT NOT NULL REFERENCES programs(id),
        user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL CHECK(kind IN ('Baseline','Follow-up')),
        questions_json TEXT NOT NULL, score INTEGER, completed_at TEXT, UNIQUE(program_id,user_id,kind)
      );
      CREATE TABLE learning_attempts (
        id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES learning_assignments(id), attempt INTEGER NOT NULL,
        questions_json TEXT NOT NULL, answers_json TEXT, score INTEGER, passed INTEGER,
        started_at TEXT NOT NULL, completed_at TEXT, retry_at TEXT, UNIQUE(assignment_id,attempt)
      );
      CREATE TABLE score_events (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
        component TEXT NOT NULL CHECK(component IN ('knowledge','behavior','reporting','improvement')),
        previous_value REAL, value REAL NOT NULL CHECK(value BETWEEN 0 AND 100),
        reason TEXT NOT NULL, source_id TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(organization_id,user_id,component,source_id)
      );
      CREATE TABLE user_notifications (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL, title TEXT NOT NULL, link TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE
      );
      CREATE TABLE phishing_reports (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), reporter_id TEXT NOT NULL REFERENCES users(id),
        sender TEXT NOT NULL, subject TEXT NOT NULL, description TEXT NOT NULL, channel TEXT NOT NULL,
        fingerprint TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Submitted', notes TEXT NOT NULL DEFAULT '',
        classification TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        UNIQUE(organization_id,reporter_id,fingerprint)
      );
      CREATE TABLE certificate_records (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT NOT NULL REFERENCES users(id),
        assignment_id TEXT NOT NULL UNIQUE REFERENCES learning_assignments(id), title TEXT NOT NULL, score INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Valid' CHECK(status IN ('Valid','Revoked')), issued_at TEXT NOT NULL, revoked_at TEXT, reason TEXT
      );
      CREATE TABLE delivery_jobs (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), user_id TEXT REFERENCES users(id),
        kind TEXT NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Pending', attempts INTEGER NOT NULL DEFAULT 0,
        available_at TEXT NOT NULL, lease_until TEXT, error TEXT, completed_at TEXT, created_at TEXT NOT NULL, dedupe_key TEXT NOT NULL UNIQUE
      );
      CREATE TABLE simulation_targets (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), program_id TEXT NOT NULL REFERENCES programs(id),
        user_id TEXT NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL UNIQUE, sent_at TEXT, expires_at TEXT NOT NULL,
        UNIQUE(program_id,user_id)
      );
      CREATE TABLE safe_simulation_events (
        id TEXT PRIMARY KEY, target_id TEXT NOT NULL REFERENCES simulation_targets(id),
        event TEXT NOT NULL CHECK(event IN ('opened','clicked','reported')), ip_hash TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(target_id,event)
      );
      CREATE TABLE identity_tokens (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL,
        expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL
      );
      CREATE TABLE identity_policy (user_id TEXT PRIMARY KEY REFERENCES users(id), must_change INTEGER NOT NULL DEFAULT 0, mfa_secret TEXT, mfa_enabled INTEGER NOT NULL DEFAULT 0, last_totp_step INTEGER);
      CREATE TABLE tenant_settings (organization_id TEXT PRIMARY KEY REFERENCES organizations(id), locale TEXT NOT NULL DEFAULT 'id', timezone TEXT NOT NULL DEFAULT 'Asia/Makassar', reminders INTEGER NOT NULL DEFAULT 1, retention_days INTEGER NOT NULL DEFAULT 365);
      CREATE TABLE worker_health (name TEXT PRIMARY KEY, last_run TEXT NOT NULL, last_error TEXT);
      CREATE INDEX idx_programs_org ON programs(organization_id,status);
      CREATE INDEX idx_assignments_user ON learning_assignments(organization_id,user_id);
      CREATE INDEX idx_score_user ON score_events(organization_id,user_id,created_at);
      CREATE INDEX idx_jobs_ready ON delivery_jobs(status,available_at,lease_until);
      CREATE INDEX idx_reports_org ON phishing_reports(organization_id,created_at);
    `,
    ],
    [
      2,
      `
      CREATE TABLE assessment_responses (id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL UNIQUE REFERENCES program_assessments(id), answers_json TEXT NOT NULL, score INTEGER NOT NULL, completed_at TEXT NOT NULL);
      CREATE TABLE employee_groups (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(organization_id,name));
      CREATE TABLE employee_group_members (group_id TEXT NOT NULL REFERENCES employee_groups(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(group_id,user_id));
    `,
    ],
    [
      3,
      `
      CREATE TABLE sso_flows (state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, nonce TEXT NOT NULL, expires_at TEXT NOT NULL);
      CREATE TABLE oidc_identities (issuer TEXT NOT NULL, subject TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, PRIMARY KEY(issuer,subject), UNIQUE(issuer,user_id));
    `,
    ],
    [
      4,
      `CREATE TABLE score_event_invalidations (id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES score_events(id), invalidated_at TEXT NOT NULL, restored_at TEXT, reason TEXT NOT NULL); CREATE INDEX idx_score_invalidations ON score_event_invalidations(event_id,invalidated_at);`,
    ],
  ];
  for (const [version, sql] of migrations) {
    if (
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(version)
    )
      continue;
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations(version) VALUES (?)").run(
        version,
      );
    })();
  }
}
