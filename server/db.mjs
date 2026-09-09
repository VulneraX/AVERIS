import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { createInitialProductState } from './seed-data.mjs';

const databasePath = resolve(process.env.DATABASE_PATH || '.data/averis.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    industry TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'employee')),
    department TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    password_changed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, email)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
  );

  CREATE TABLE IF NOT EXISTS product_states (
    organization_id TEXT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
    metadata_json TEXT NOT NULL DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT NOT NULL,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (duration_minutes BETWEEN 1 AND 600),
    passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
    max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 20),
    retry_delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (retry_delay_minutes BETWEEN 0 AND 43200),
    shuffle_questions INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organization_id, id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id, course_id) REFERENCES courses(organization_id, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_index INTEGER NOT NULL CHECK (correct_index >= 0),
    explanation TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id, course_id) REFERENCES courses(organization_id, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL DEFAULT '',
    course_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    question_order_json TEXT NOT NULL,
    answers_json TEXT NOT NULL DEFAULT '[]',
    score INTEGER,
    passed INTEGER,
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    next_retry_at TEXT,
    FOREIGN KEY (organization_id, course_id) REFERENCES courses(organization_id, id) ON DELETE CASCADE,
    UNIQUE (organization_id, user_id, campaign_id, course_id, attempt_number)
  );

  CREATE TABLE IF NOT EXISTS email_outbox (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    template TEXT NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0,
    scheduled_for TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT,
    last_error TEXT,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulation_recipients (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, campaign_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS simulation_events (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL REFERENCES simulation_recipients(id) ON DELETE CASCADE,
    event TEXT NOT NULL CHECK (event IN ('opened', 'clicked', 'reported', 'no_action')),
    ip_hash TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    course_title TEXT NOT NULL,
    score INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Revoked')),
    issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, user_id, course_id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(organization_id, active);
  CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(organization_id, course_id, position);
  CREATE INDEX IF NOT EXISTS idx_questions_course ON questions(organization_id, course_id, active);
  CREATE INDEX IF NOT EXISTS idx_attempts_user_course ON quiz_attempts(organization_id, user_id, campaign_id, course_id, attempt_number DESC);
  CREATE INDEX IF NOT EXISTS idx_outbox_pending ON email_outbox(status, scheduled_for);
  CREATE INDEX IF NOT EXISTS idx_simulation_events_campaign ON simulation_events(organization_id, campaign_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_certificates_public ON certificates(id, status);
`);

// v2: the same course may be assigned by multiple campaigns. Preserve existing
// attempts under an empty legacy campaign while making new attempts campaign-scoped.
if (!db.prepare("PRAGMA table_info('quiz_attempts')").all().some((column) => column.name === 'campaign_id')) {
  db.pragma('foreign_keys = OFF');
  db.transaction(() => {
    db.exec(`
      ALTER TABLE quiz_attempts RENAME TO quiz_attempts_legacy;
      CREATE TABLE quiz_attempts (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        campaign_id TEXT NOT NULL DEFAULT '',
        course_id TEXT NOT NULL,
        attempt_number INTEGER NOT NULL,
        question_order_json TEXT NOT NULL,
        answers_json TEXT NOT NULL DEFAULT '[]',
        score INTEGER,
        passed INTEGER,
        started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT,
        next_retry_at TEXT,
        FOREIGN KEY (organization_id, course_id) REFERENCES courses(organization_id, id) ON DELETE CASCADE,
        UNIQUE (organization_id, user_id, campaign_id, course_id, attempt_number)
      );
      INSERT INTO quiz_attempts
        (id, organization_id, user_id, campaign_id, course_id, attempt_number, question_order_json, answers_json, score, passed, started_at, completed_at, next_retry_at)
      SELECT id, organization_id, user_id, '', course_id, attempt_number, question_order_json, answers_json, score, passed, started_at, completed_at, next_retry_at
      FROM quiz_attempts_legacy;
      DROP TABLE quiz_attempts_legacy;
      CREATE INDEX IF NOT EXISTS idx_attempts_user_course ON quiz_attempts(organization_id, user_id, campaign_id, course_id, attempt_number DESC);
    `);
  })();
  db.pragma('foreign_keys = ON');
}

const defaultCourses = [
  ['phishing-awareness', 'Phishing Awareness', 'Phishing', 7, 'Kenali email, tautan, lampiran, dan taktik phishing sebelum bertindak.'],
  ['password-account-security', 'Password & Account Security', 'Account Security', 6, 'Gunakan password unik, pengelola password, dan MFA untuk melindungi akun.'],
  ['social-engineering', 'Social Engineering', 'Social Engineering', 8, 'Kenali manipulasi, urgensi palsu, dan verifikasi permintaan melalui kanal resmi.'],
  ['data-protection-basics', 'Data Protection Basics', 'Data Protection', 7, 'Tangani data organisasi dan pelanggan sesuai klasifikasi dan kebutuhan akses.'],
  ['safe-browsing-device-security', 'Safe Browsing & Device Security', 'Device Security', 6, 'Terapkan kebiasaan browsing dan perlindungan perangkat yang aman.'],
  ['business-email-compromise', 'Business Email Compromise', 'Email Security', 8, 'Kenali penyamaran eksekutif dan perubahan instruksi pembayaran.'],
  ['secure-remote-working', 'Secure Remote Working', 'Workplace Security', 6, 'Jaga keamanan informasi saat bekerja dari rumah atau ruang publik.'],
];

const defaultQuestionTemplates = [
  ['Apa tindakan paling aman saat email mendesak meminta Anda membuka tautan login?', ['Buka segera agar tidak terlambat', 'Balas email untuk bertanya', 'Verifikasi pengirim lewat kanal resmi dan akses situs secara langsung', 'Teruskan ke semua rekan'], 2, 'Urgensi adalah teknik rekayasa sosial; verifikasi lewat kanal terpisah.'],
  ['Apa manfaat utama autentikasi multifaktor (MFA)?', ['Menggantikan kebutuhan password', 'Menambah lapisan verifikasi jika password bocor', 'Membuat semua tautan aman', 'Menghapus kebutuhan pembaruan perangkat'], 1, 'MFA mengurangi dampak ketika satu faktor autentikasi diketahui pihak lain.'],
  ['Bagaimana menangani lampiran yang tidak diharapkan?', ['Buka di ponsel', 'Ubah nama file lalu buka', 'Verifikasi konteks dan laporkan jika mencurigakan', 'Unggah ke media sosial'], 2, 'Lampiran tak terduga harus diverifikasi dan ditangani melalui prosedur pelaporan.'],
  ['Apa tanda umum rekayasa sosial?', ['Permintaan rutin melalui sistem resmi', 'Tekanan waktu dan permintaan melewati prosedur', 'Dokumentasi yang lengkap', 'Persetujuan berlapis'], 1, 'Tekanan dan upaya melewati kontrol normal merupakan indikator penting.'],
  ['Apa yang harus dilakukan ketika menemukan aktivitas mencurigakan?', ['Diamkan sampai ada korban', 'Hapus bukti', 'Laporkan segera melalui kanal keamanan resmi', 'Balas pelaku'], 2, 'Pelaporan cepat membantu tim keamanan membatasi dampak dan menyelidiki.'],
];

function seedContent(organizationId) {
  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses
      (id, organization_id, title, category, duration_minutes, description, passing_score, max_attempts, retry_delay_minutes)
    VALUES (?, ?, ?, ?, ?, ?, 70, 3, 0)
  `);
  const insertLesson = db.prepare(`INSERT OR IGNORE INTO lessons (id, organization_id, course_id, position, title, content) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertQuestion = db.prepare(`INSERT OR IGNORE INTO questions (id, organization_id, course_id, prompt, options_json, correct_index, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const [id, title, category, duration, description] of defaultCourses) {
    insertCourse.run(id, organizationId, title, category, duration, description);
    insertLesson.run(`${organizationId}:${id}:lesson-1`, organizationId, id, 1, 'Prinsip utama', description);
    defaultQuestionTemplates.forEach(([prompt, options, correctIndex, explanation], index) => {
      insertQuestion.run(`${organizationId}:${id}:q-${index + 1}`, organizationId, id, prompt, JSON.stringify(options), correctIndex, explanation);
    });
  }
}

function syncSeedCertificates(organizationId) {
  const state = getProductState(organizationId);
  const findUser = db.prepare('SELECT id FROM users WHERE organization_id = ? AND name = ? COLLATE NOCASE');
  const insert = db.prepare(`INSERT OR IGNORE INTO certificates (id, organization_id, user_id, course_id, course_title, score, status, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const certificate of state.certificates || []) {
    const user = findUser.get(organizationId, certificate.employeeName);
    if (!user) continue;
    const parsedDate = new Date(certificate.issuedAt);
    insert.run(certificate.id, organizationId, user.id, certificate.courseId, certificate.courseTitle, certificate.score,
      certificate.status === 'Revoked' ? 'Revoked' : 'Issued', Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString());
  }
}

function randomPassword() {
  return `${randomBytes(12).toString('base64url')}!aA7`;
}

function seedDatabase() {
  const slug = process.env.BOOTSTRAP_ORG_SLUG || 'acme-indonesia';
  let organization = db.prepare('SELECT * FROM organizations WHERE slug = ?').get(slug);
  let organizationCreated = false;

  if (!organization) {
    organizationCreated = true;
    const id = randomUUID();
    db.prepare('INSERT INTO organizations (id, name, slug, industry) VALUES (?, ?, ?, ?)')
      .run(id, process.env.BOOTSTRAP_ORG_NAME || 'ACME Indonesia', slug, 'Technology Services');
    db.prepare('INSERT INTO product_states (organization_id, state_json) VALUES (?, ?)')
      .run(id, JSON.stringify(createInitialProductState()));
    organization = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
  }

  const definitions = [
    ['super_admin', 'Syarif Rahman', 'Security', 'BOOTSTRAP_SUPER_ADMIN_EMAIL', 'BOOTSTRAP_SUPER_ADMIN_PASSWORD', 'owner@acme.co.id'],
    ['admin', 'AVERIS Administrator', 'Security', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD', 'admin@acme.co.id'],
    ['manager', 'Finance Manager', 'Finance', 'BOOTSTRAP_MANAGER_EMAIL', 'BOOTSTRAP_MANAGER_PASSWORD', 'manager@acme.co.id'],
    ['employee', 'Andini Putri', 'Finance', 'BOOTSTRAP_EMPLOYEE_EMAIL', 'BOOTSTRAP_EMPLOYEE_PASSWORD', 'andini@acme.co.id'],
  ];
  const generated = [];

  for (const [role, name, department, emailKey, passwordKey, defaultEmail] of definitions) {
    const email = (process.env[emailKey] || defaultEmail).trim().toLowerCase();
    const exists = db.prepare('SELECT id FROM users WHERE organization_id = ? AND email = ?')
      .get(organization.id, email);
    if (exists) continue;

    const suppliedPassword = process.env[passwordKey]?.trim();
    const password = suppliedPassword || randomPassword();
    db.prepare(`
      INSERT INTO users (id, organization_id, email, password_hash, name, role, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), organization.id, email, bcrypt.hashSync(password, 12), name, role, department);
    generated.push({ email, password, role, generated: !suppliedPassword });
  }

  seedContent(organization.id);
  syncSeedCertificates(organization.id);

  if (organizationCreated || generated.length) {
    console.log('\nAVERIS bootstrap accounts (shown once):');
    for (const item of generated) {
      console.log(`  ${item.role.padEnd(12)} ${item.email.padEnd(28)} ${item.password}`);
    }
    console.log('Set BOOTSTRAP_* values in .env before first run to control these credentials.\n');
  }
}

seedDatabase();

export function getProductState(organizationId) {
  const row = db.prepare('SELECT state_json FROM product_states WHERE organization_id = ?').get(organizationId);
  if (!row) {
    const state = createInitialProductState();
    db.prepare('INSERT INTO product_states (organization_id, state_json) VALUES (?, ?)')
      .run(organizationId, JSON.stringify(state));
    return state;
  }
  return JSON.parse(row.state_json);
}

export function saveProductState(organizationId, state) {
  db.prepare(`
    INSERT INTO product_states (organization_id, state_json, version, updated_at)
    VALUES (?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(organization_id) DO UPDATE SET
      state_json = excluded.state_json,
      version = product_states.version + 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(organizationId, JSON.stringify(state));
}

export function writeAudit({ organizationId, actorUserId = null, action, entityType, entityId = null, outcome = 'success', metadata = {}, ip = null, userAgent = null }) {
  db.prepare(`
    INSERT INTO audit_logs
      (id, organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata_json, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), organizationId, actorUserId, action, entityType, entityId, outcome, JSON.stringify(metadata), ip, userAgent);
}

export function pruneExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

export { databasePath };
