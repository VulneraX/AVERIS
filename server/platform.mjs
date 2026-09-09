import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { parse as parseCsv } from 'csv-parse/sync';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';

const adminRoles = ['super_admin', 'admin'];
const viewerRoles = ['super_admin', 'admin', 'manager'];
const campaignStatuses = ['Draft', 'Scheduled', 'Active', 'Completed', 'Closed', 'Cancelled'];

const cleanDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || randomUUID();
const randomPassword = () => `${randomBytes(12).toString('base64url')}!aA7`;
const parseJson = (value, fallback = []) => { try { return JSON.parse(value); } catch { return fallback; } };
const dateIso = () => new Date().toISOString();

function audienceMatches(audience, user) {
  const target = String(audience || '').trim().toLowerCase();
  const department = String(user.department || '').trim().toLowerCase();
  return target === 'all employees' || target === department || target === `${department} department`;
}

function courseRecord(row, lessons = [], questions = []) {
  return {
    id: row.id, title: row.title, category: row.category, description: row.description,
    durationMinutes: row.duration_minutes, passingScore: row.passing_score,
    maxAttempts: row.max_attempts, retryDelayMinutes: row.retry_delay_minutes,
    shuffleQuestions: Boolean(row.shuffle_questions), active: Boolean(row.active),
    lessons, questions,
  };
}

function sanitizeQuestion(row, includeAnswer = false) {
  return {
    id: row.id, prompt: row.prompt, options: parseJson(row.options_json), explanation: row.explanation,
    active: Boolean(row.active), ...(includeAnswer ? { correctIndex: row.correct_index } : {}),
  };
}

function getCourse(db, organizationId, courseId, includeAnswers = true) {
  const row = db.prepare('SELECT * FROM courses WHERE organization_id = ? AND id = ?').get(organizationId, courseId);
  if (!row) return null;
  const lessons = db.prepare('SELECT id, position, title, content FROM lessons WHERE organization_id = ? AND course_id = ? ORDER BY position').all(organizationId, courseId);
  const questions = db.prepare('SELECT * FROM questions WHERE organization_id = ? AND course_id = ? ORDER BY created_at, id').all(organizationId, courseId).map((item) => sanitizeQuestion(item, includeAnswers));
  return courseRecord(row, lessons, questions);
}

function queueEmail(db, message) {
  db.prepare(`
    INSERT OR IGNORE INTO email_outbox
      (id, organization_id, recipient_user_id, recipient_email, template, subject, text_body, html_body, scheduled_for, idempotency_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), message.organizationId, message.userId || null, message.email, message.template,
    message.subject, message.text, message.html || null, message.scheduledFor || dateIso(), message.key);
}

function smtpTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function processEmailOutbox(db, limit = 25, organizationId = null) {
  const transport = smtpTransport();
  if (!transport) return { configured: false, processed: 0, sent: 0, failed: 0 };
  const messages = organizationId
    ? db.prepare(`SELECT * FROM email_outbox WHERE organization_id = ? AND status IN ('queued', 'failed') AND attempts < 5 AND scheduled_for <= ? ORDER BY created_at LIMIT ?`).all(organizationId, dateIso(), limit)
    : db.prepare(`SELECT * FROM email_outbox WHERE status IN ('queued', 'failed') AND attempts < 5 AND scheduled_for <= ? ORDER BY created_at LIMIT ?`).all(dateIso(), limit);
  let sent = 0;
  let failed = 0;
  for (const message of messages) {
    db.prepare("UPDATE email_outbox SET status = 'sending', attempts = attempts + 1 WHERE id = ?").run(message.id);
    try {
      await transport.sendMail({ from: process.env.SMTP_FROM || 'AVERIS <no-reply@localhost>', to: message.recipient_email, subject: message.subject, text: message.text_body, html: message.html_body || undefined });
      db.prepare("UPDATE email_outbox SET status = 'sent', sent_at = CURRENT_TIMESTAMP, last_error = NULL WHERE id = ?").run(message.id);
      sent += 1;
    } catch (error) {
      db.prepare("UPDATE email_outbox SET status = 'failed', last_error = ? WHERE id = ?").run(String(error.message || error).slice(0, 500), message.id);
      failed += 1;
    }
  }
  return { configured: true, processed: messages.length, sent, failed };
}

function usersForAudience(db, organizationId, audience) {
  return db.prepare("SELECT id, email, name, department FROM users WHERE organization_id = ? AND role = 'employee' AND active = 1 ORDER BY name")
    .all(organizationId).filter((user) => audienceMatches(audience, user));
}

function ensureSimulationRecipient(db, { organizationId, campaignId, user, secret, campaignName }) {
  const existing = db.prepare('SELECT id FROM simulation_recipients WHERE organization_id = ? AND campaign_id = ? AND user_id = ?').get(organizationId, campaignId, user.id);
  if (existing) return;
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(`${secret}:${token}`).digest('hex');
  db.prepare('INSERT INTO simulation_recipients (id, organization_id, campaign_id, user_id, token_hash) VALUES (?, ?, ?, ?, ?)')
    .run(randomUUID(), organizationId, campaignId, user.id, tokenHash);
  const baseUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:4173').replace(/\/$/, '');
  const link = `${baseUrl}/simulation/${encodeURIComponent(token)}`;
  queueEmail(db, {
    organizationId, userId: user.id, email: user.email, template: 'phishing_simulation',
    subject: `Simulasi keamanan: ${campaignName}`, text: `Simulasi keamanan organisasi. Buka ${link}`,
    html: `<p>Simulasi keamanan organisasi.</p><p><a href="${link}">Buka simulasi</a></p>`,
    key: `simulation:${organizationId}:${campaignId}:${user.id}`,
  });
}

export function runScheduler({ db, getProductState, saveProductState, writeAudit, simulationSecret, organizationId = null }) {
  const organizations = organizationId ? db.prepare('SELECT id FROM organizations WHERE id = ?').all(organizationId) : db.prepare('SELECT id FROM organizations').all();
  const now = new Date();
  const result = { organizations: organizations.length, activated: 0, completed: 0, overdue: 0, queued: 0 };
  for (const organization of organizations) {
    const state = getProductState(organization.id);
    let changed = false;
    for (const campaign of state.campaigns) {
      const start = cleanDate(campaign.startDate);
      const end = cleanDate(campaign.endDate);
      if (campaign.status === 'Scheduled' && (!start || start <= now)) {
        campaign.status = 'Active'; changed = true; result.activated += 1;
        for (const simulation of state.simulations.filter((item) => item.campaignId === campaign.id && item.status === 'Scheduled')) simulation.status = 'Active';
      }
      if (campaign.status === 'Active' && end && end < now) {
        campaign.status = 'Completed'; changed = true; result.completed += 1;
        for (const simulation of state.simulations.filter((item) => item.campaignId === campaign.id && ['Scheduled', 'Active'].includes(item.status))) simulation.status = 'Completed';
      }
      if (campaign.status !== 'Active') continue;
      const users = usersForAudience(db, organization.id, campaign.audience);
      for (const user of users) {
        queueEmail(db, {
          organizationId: organization.id, userId: user.id, email: user.email, template: 'campaign_assignment',
          subject: `Learning baru: ${campaign.name}`, text: `Anda mendapat assignment ${campaign.name}. Silakan masuk ke AVERIS untuk menyelesaikannya.`,
          key: `assignment:${organization.id}:${campaign.id}:${user.id}`,
        });
        if (campaign.simulation) ensureSimulationRecipient(db, { organizationId: organization.id, campaignId: campaign.id, user, secret: simulationSecret, campaignName: campaign.name });
      }
      for (const simulation of state.simulations.filter((item) => item.campaignId === campaign.id)) {
        simulation.status = 'Active'; simulation.delivered = users.length;
      }
    }
    for (const assignment of state.assignments) {
      const due = cleanDate(assignment.dueDate);
      if (due && due < now && !['Completed', 'Overdue'].includes(assignment.status)) {
        assignment.status = 'Overdue'; changed = true; result.overdue += 1;
      }
      if (assignment.status !== 'Overdue') continue;
      const users = usersForAudience(db, organization.id, assignment.audience);
      const dayKey = now.toISOString().slice(0, 10);
      for (const user of users) queueEmail(db, {
        organizationId: organization.id, userId: user.id, email: user.email, template: 'overdue_reminder',
        subject: `Terlambat: ${assignment.courseTitle}`, text: `${assignment.courseTitle} melewati tenggat ${assignment.dueDate}. Silakan selesaikan di AVERIS.`,
        key: `overdue:${organization.id}:${assignment.id}:${user.id}:${dayKey}`,
      });
    }

    for (const assignment of state.assignments) {
      const due = cleanDate(assignment.dueDate);
      if (!due || ['Completed', 'Overdue'].includes(assignment.status)) continue;
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / 86400000);
      if (daysUntilDue < 0 || daysUntilDue > 3) continue;
      const users = usersForAudience(db, organization.id, assignment.audience);
      for (const user of users) queueEmail(db, {
        organizationId: organization.id, userId: user.id, email: user.email, template: 'due_reminder',
        subject: `Reminder: ${assignment.courseTitle}`, text: `${assignment.courseTitle} jatuh tempo dalam ${daysUntilDue} hari (${assignment.dueDate}).`,
        key: `reminder:${organization.id}:${assignment.id}:${user.id}:${now.toISOString().slice(0, 10)}`,
      });
    }
    if (changed) saveProductState(organization.id, state);
    writeAudit({ organizationId: organization.id, action: 'scheduler.lifecycle', entityType: 'organization', entityId: organization.id, metadata: result });
  }
  result.queued = organizationId
    ? db.prepare("SELECT COUNT(*) AS count FROM email_outbox WHERE organization_id = ? AND status = 'queued'").get(organizationId).count
    : db.prepare("SELECT COUNT(*) AS count FROM email_outbox WHERE status = 'queued'").get().count;
  return result;
}

function reportData(db, getProductState, organizationId, query) {
  const state = getProductState(organizationId);
  const since = query.period === 'all' ? null : new Date(Date.now() - Number(query.period || 30) * 86400000).toISOString();
  let users = db.prepare("SELECT id, email, name, role, department, active, created_at FROM users WHERE organization_id = ? AND role = 'employee' AND active = 1").all(organizationId);
  if (query.department) users = users.filter((user) => user.department === query.department);
  const userIds = new Set(users.map((user) => user.id));
  let attempts = db.prepare('SELECT user_id, campaign_id, course_id, score, passed, completed_at FROM quiz_attempts WHERE organization_id = ? AND completed_at IS NOT NULL').all(organizationId)
    .filter((attempt) => userIds.has(attempt.user_id) && (!since || attempt.completed_at >= since));
  if (query.campaignId) attempts = attempts.filter((attempt) => attempt.campaign_id === query.campaignId);
  const latestScores = new Map();
  for (const attempt of attempts) latestScores.set(attempt.user_id, attempt.score);
  if (query.risk) users = users.filter((user) => {
    const score = latestScores.get(user.id);
    if (query.risk === 'high') return score == null || score < 60;
    if (query.risk === 'medium') return score >= 60 && score < 80;
    return score >= 80;
  });
  const filteredUserIds = new Set(users.map((user) => user.id));
  attempts = attempts.filter((attempt) => filteredUserIds.has(attempt.user_id));
  const scores = attempts.map((item) => item.score).filter(Number.isFinite);
  const activeCampaigns = state.campaigns.filter((item) => item.status === 'Active').length;
  const completion = attempts.length ? Math.round(attempts.filter((item) => item.passed).length / attempts.length * 100) : 0;
  const score = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : 0;
  const byDepartment = [...new Set(users.map((user) => user.department || 'Tanpa departemen'))].map((department) => {
    const departmentUsers = users.filter((user) => (user.department || 'Tanpa departemen') === department);
    const ids = new Set(departmentUsers.map((user) => user.id));
    const departmentScores = attempts.filter((item) => ids.has(item.user_id)).map((item) => item.score);
    return { department, employees: departmentUsers.length, score: departmentScores.length ? Math.round(departmentScores.reduce((sum, item) => sum + item, 0) / departmentScores.length) : 0 };
  });
  return { summary: { employees: users.length, activeCampaigns, attempts: attempts.length, completion, score }, users, attempts, byDepartment, campaigns: state.campaigns };
}

export function registerPlatformRoutes(app, deps) {
  const { db, authRequired, allowRoles, validate, requestMeta, writeAudit, getProductState, saveProductState, applyProductAction, stateForUser, sessionSecret } = deps;

  app.patch('/api/admin/users/:id', authRequired, allowRoles(...adminRoles), (req, res, next) => {
    try {
      const input = validate(z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), department: z.string().trim().min(2).max(100), role: z.enum(['super_admin', 'admin', 'manager', 'employee']), active: z.boolean() }).strict(), req.body);
      const target = db.prepare('SELECT * FROM users WHERE id = ? AND organization_id = ?').get(req.params.id, req.auth.organization.id);
      if (!target) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'Pengguna tidak ditemukan.' } });
      if (target.id === req.auth.id && !input.active) return res.status(409).json({ error: { code: 'SELF_DEACTIVATION', message: 'Anda tidak dapat menonaktifkan akun sendiri.' } });
      if (req.auth.role !== 'super_admin' && (['super_admin', 'admin'].includes(target.role) || ['super_admin', 'admin'].includes(input.role))) return res.status(403).json({ error: { code: 'FORBIDDEN_ROLE_ASSIGNMENT', message: 'Hanya Super Admin yang dapat mengelola akun Admin.' } });
      db.transaction(() => {
        db.prepare('UPDATE users SET name = ?, email = ?, department = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ?').run(input.name, input.email, input.department, input.role, Number(input.active), target.id, req.auth.organization.id);
        if (!input.active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(target.id);
        writeAudit({ organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: input.active ? 'user.updated' : 'user.deactivated', entityType: 'user', entityId: target.id, metadata: { email: input.email, role: input.role }, ...requestMeta(req) });
      })();
      res.json({ user: { id: target.id, ...input } });
    } catch (error) { if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email sudah digunakan.' } }); next(error); }
  });

  app.post('/api/admin/users/import', authRequired, allowRoles(...adminRoles), (req, res, next) => {
    try {
      const { csv } = validate(z.object({ csv: z.string().min(1).max(2_000_000) }).strict(), req.body);
      const rows = parseCsv(csv, { columns: true, skip_empty_lines: true, trim: true, bom: true });
      if (rows.length > 5000) throw Object.assign(new Error('Maksimal 5.000 baris per import.'), { status: 400, code: 'IMPORT_LIMIT' });
      const schema = z.object({ email: z.string().email().transform((value) => value.toLowerCase()), name: z.string().min(2).max(100), department: z.string().min(2).max(100), role: z.enum(['manager', 'employee']).default('employee') });
      const created = [];
      const errors = [];
      db.transaction(() => rows.forEach((row, index) => {
        const result = schema.safeParse(row);
        if (!result.success) { errors.push({ row: index + 2, message: result.error.issues[0].message }); return; }
        const password = randomPassword();
        try {
          const id = randomUUID();
          db.prepare('INSERT INTO users (id, organization_id, email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.auth.organization.id, result.data.email, bcrypt.hashSync(password, 12), result.data.name, result.data.role, result.data.department);
          created.push({ id, ...result.data, temporaryPassword: password });
        } catch (error) { errors.push({ row: index + 2, message: error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email sudah terdaftar.' : 'Baris gagal disimpan.' }); }
      }))();
      writeAudit({ organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: 'user.imported', entityType: 'user', metadata: { created: created.length, failed: errors.length }, ...requestMeta(req) });
      res.status(201).json({ created, errors });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/content/courses', authRequired, allowRoles(...viewerRoles), (req, res) => {
    const rows = db.prepare('SELECT * FROM courses WHERE organization_id = ? ORDER BY updated_at DESC, title').all(req.auth.organization.id);
    res.json({ courses: rows.map((row) => {
      const counts = db.prepare('SELECT (SELECT COUNT(*) FROM lessons WHERE organization_id = ? AND course_id = ?) lessons, (SELECT COUNT(*) FROM questions WHERE organization_id = ? AND course_id = ?) questions').get(req.auth.organization.id, row.id, req.auth.organization.id, row.id);
      return { ...courseRecord(row), lessonCount: counts.lessons, questionCount: counts.questions };
    }) });
  });

  app.get('/api/admin/content/courses/:id', authRequired, allowRoles(...viewerRoles), (req, res) => {
    const course = getCourse(db, req.auth.organization.id, req.params.id, true);
    if (!course) return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Materi tidak ditemukan.' } });
    res.json({ course });
  });

  const contentSchema = z.object({
    id: z.string().trim().min(2).max(100).optional(), title: z.string().trim().min(3).max(150), category: z.string().trim().min(2).max(100), description: z.string().trim().max(2000).default(''),
    durationMinutes: z.number().int().min(1).max(600), passingScore: z.number().int().min(0).max(100), maxAttempts: z.number().int().min(1).max(20), retryDelayMinutes: z.number().int().min(0).max(43200), shuffleQuestions: z.boolean(), active: z.boolean(),
    lessons: z.array(z.object({ id: z.string().optional(), title: z.string().trim().min(2).max(150), content: z.string().trim().min(1).max(50000) })).max(100),
    questions: z.array(z.object({ id: z.string().optional(), prompt: z.string().trim().min(3).max(2000), options: z.array(z.string().trim().min(1).max(500)).min(2).max(10), correctIndex: z.number().int().min(0), explanation: z.string().trim().max(2000).default(''), active: z.boolean().default(true) }).refine((item) => item.correctIndex < item.options.length, { message: 'Jawaban benar harus merujuk salah satu opsi.', path: ['correctIndex'] })).min(1).max(200),
  }).strict();

  const saveCourse = (req, res, next, creating) => {
    try {
      const input = validate(contentSchema, req.body);
      const id = creating ? slugify(input.id || input.title) : req.params.id;
      const exists = db.prepare('SELECT id FROM courses WHERE organization_id = ? AND id = ?').get(req.auth.organization.id, id);
      if (creating && exists) return res.status(409).json({ error: { code: 'COURSE_EXISTS', message: 'ID materi sudah digunakan.' } });
      if (!creating && !exists) return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Materi tidak ditemukan.' } });
      db.transaction(() => {
        if (creating) db.prepare('INSERT INTO courses (id, organization_id, title, category, description, duration_minutes, passing_score, max_attempts, retry_delay_minutes, shuffle_questions, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, req.auth.organization.id, input.title, input.category, input.description, input.durationMinutes, input.passingScore, input.maxAttempts, input.retryDelayMinutes, Number(input.shuffleQuestions), Number(input.active));
        else db.prepare('UPDATE courses SET title=?, category=?, description=?, duration_minutes=?, passing_score=?, max_attempts=?, retry_delay_minutes=?, shuffle_questions=?, active=?, updated_at=CURRENT_TIMESTAMP WHERE organization_id=? AND id=?').run(input.title, input.category, input.description, input.durationMinutes, input.passingScore, input.maxAttempts, input.retryDelayMinutes, Number(input.shuffleQuestions), Number(input.active), req.auth.organization.id, id);
        db.prepare('DELETE FROM lessons WHERE organization_id = ? AND course_id = ?').run(req.auth.organization.id, id);
        db.prepare('DELETE FROM questions WHERE organization_id = ? AND course_id = ?').run(req.auth.organization.id, id);
        input.lessons.forEach((lesson, index) => db.prepare('INSERT INTO lessons (id, organization_id, course_id, position, title, content) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), req.auth.organization.id, id, index + 1, lesson.title, lesson.content));
        input.questions.forEach((question) => db.prepare('INSERT INTO questions (id, organization_id, course_id, prompt, options_json, correct_index, explanation, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), req.auth.organization.id, id, question.prompt, JSON.stringify(question.options), question.correctIndex, question.explanation, Number(question.active)));
        writeAudit({ organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: creating ? 'content.created' : 'content.updated', entityType: 'course', entityId: id, metadata: { questions: input.questions.length, lessons: input.lessons.length }, ...requestMeta(req) });
      })();
      res.status(creating ? 201 : 200).json({ course: getCourse(db, req.auth.organization.id, id, true) });
    } catch (error) { next(error); }
  };
  app.post('/api/admin/content/courses', authRequired, allowRoles(...adminRoles), (req, res, next) => saveCourse(req, res, next, true));
  app.put('/api/admin/content/courses/:id', authRequired, allowRoles(...adminRoles), (req, res, next) => saveCourse(req, res, next, false));

  app.get('/api/quiz/:courseId', authRequired, allowRoles('employee'), (req, res, next) => {
    try {
      const campaignId = validate(z.object({ campaignId: z.string().trim().min(1).max(160).optional() }), req.query).campaignId || '';
      const state = getProductState(req.auth.organization.id);
      const assignment = state.assignments.find((item) => item.courseId === req.params.courseId && (!campaignId || item.campaignId === campaignId) && audienceMatches(item.audience, req.auth));
      if (!assignment || !['Quiz Available', 'Content Completed', 'Completed'].includes(assignment.status)) return res.status(403).json({ error: { code: 'QUIZ_UNAVAILABLE', message: 'Selesaikan materi learning sebelum memulai kuis.' } });
      const course = getCourse(db, req.auth.organization.id, req.params.courseId, false);
      if (!course || !course.active) return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Kuis tidak tersedia.' } });
      const scopedCampaignId = assignment.campaignId || campaignId || '';
      const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE organization_id = ? AND user_id = ? AND campaign_id = ? AND course_id = ? ORDER BY attempt_number DESC').all(req.auth.organization.id, req.auth.id, scopedCampaignId, course.id);
      const passed = attempts.find((item) => item.passed === 1);
      if (passed) return res.json({ status: 'passed', history: attempts.map(attemptSummary), course: { id: course.id, title: course.title, passingScore: course.passingScore, maxAttempts: course.maxAttempts } });
      const inProgress = attempts.find((item) => !item.completed_at);
      if (inProgress) return res.json(buildQuizPayload(db, course, inProgress));
      if (attempts.length >= course.maxAttempts) return res.status(409).json({ error: { code: 'ATTEMPTS_EXHAUSTED', message: 'Batas percobaan kuis telah tercapai.' } });
      const latest = attempts[0];
      if (latest?.next_retry_at && new Date(latest.next_retry_at) > new Date()) return res.status(409).json({ error: { code: 'RETRY_NOT_READY', message: `Kuis dapat diulang setelah ${latest.next_retry_at}.` } });
      const questionRows = db.prepare('SELECT id FROM questions WHERE organization_id = ? AND course_id = ? AND active = 1').all(req.auth.organization.id, course.id);
      if (!questionRows.length) return res.status(409).json({ error: { code: 'NO_QUESTIONS', message: 'Bank soal untuk materi ini masih kosong.' } });
      const order = questionRows.map((item) => item.id);
      if (course.shuffleQuestions) for (let index = order.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [order[index], order[swap]] = [order[swap], order[index]]; }
      const attempt = { id: randomUUID(), attempt_number: attempts.length + 1, question_order_json: JSON.stringify(order), started_at: dateIso() };
      db.prepare('INSERT INTO quiz_attempts (id, organization_id, user_id, campaign_id, course_id, attempt_number, question_order_json) VALUES (?, ?, ?, ?, ?, ?, ?)').run(attempt.id, req.auth.organization.id, req.auth.id, scopedCampaignId, course.id, attempt.attempt_number, attempt.question_order_json);
      writeAudit({ organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: 'quiz.started', entityType: 'quiz_attempt', entityId: attempt.id, metadata: { campaignId: scopedCampaignId, courseId: course.id, attempt: attempt.attempt_number }, ...requestMeta(req) });
      res.status(201).json(buildQuizPayload(db, course, attempt));
    } catch (error) { next(error); }
  });

  app.post('/api/quiz/:courseId/submit', authRequired, allowRoles('employee'), (req, res, next) => {
    try {
      const campaignId = validate(z.object({ campaignId: z.string().trim().min(1).max(160).optional() }), req.query).campaignId || '';
      const input = validate(z.object({ attemptId: z.string().uuid(), answers: z.array(z.number().int().min(-1).max(20)).min(1).max(200) }).strict(), req.body);
      const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND organization_id = ? AND user_id = ? AND course_id = ? AND (? = ? OR campaign_id = ?)').get(input.attemptId, req.auth.organization.id, req.auth.id, req.params.courseId, campaignId, '', campaignId);
      if (!attempt) return res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: 'Percobaan kuis tidak ditemukan.' } });
      if (attempt.completed_at) return res.status(409).json({ error: { code: 'ATTEMPT_COMPLETED', message: 'Percobaan ini sudah dikirim.' } });
      const course = getCourse(db, req.auth.organization.id, req.params.courseId, false);
      const order = parseJson(attempt.question_order_json);
      if (input.answers.length !== order.length) return res.status(400).json({ error: { code: 'INCOMPLETE_ANSWERS', message: 'Semua pertanyaan harus dijawab.' } });
      const rows = new Map(db.prepare(`SELECT id, correct_index FROM questions WHERE organization_id = ? AND course_id = ?`).all(req.auth.organization.id, req.params.courseId).map((row) => [row.id, row]));
      const correct = order.reduce((total, id, index) => total + (rows.get(id)?.correct_index === input.answers[index] ? 1 : 0), 0);
      const score = Math.round(correct / order.length * 100);
      const passed = score >= course.passingScore;
      const nextRetryAt = passed || !course.retryDelayMinutes ? null : new Date(Date.now() + course.retryDelayMinutes * 60000).toISOString();
      let productResponse;
      db.transaction(() => {
        db.prepare('UPDATE quiz_attempts SET answers_json = ?, score = ?, passed = ?, completed_at = CURRENT_TIMESTAMP, next_retry_at = ? WHERE id = ?').run(JSON.stringify(input.answers), score, Number(passed), nextRetryAt, attempt.id);
        const current = getProductState(req.auth.organization.id);
        productResponse = applyProductAction(current, 'completeModuleQuiz', { courseId: course.id, campaignId: attempt.campaign_id || undefined, score, answers: input.answers }, req.auth);
        saveProductState(req.auth.organization.id, productResponse.state);
        if (passed) db.prepare('INSERT OR IGNORE INTO certificates (id, organization_id, user_id, course_id, course_title, score) VALUES (?, ?, ?, ?, ?, ?)').run(`AVERIS-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`, req.auth.organization.id, req.auth.id, course.id, course.title, score);
        writeAudit({ organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: passed ? 'quiz.passed' : 'quiz.failed', entityType: 'quiz_attempt', entityId: attempt.id, metadata: { campaignId: attempt.campaign_id, courseId: course.id, score, attempt: attempt.attempt_number }, ...requestMeta(req) });
      })();
      res.json({ result: { score, passed, attempt: attempt.attempt_number, remainingAttempts: Math.max(0, course.maxAttempts - attempt.attempt_number), nextRetryAt }, state: stateForUser(productResponse.state, req.auth) });
    } catch (error) { next(error); }
  });

  app.get('/api/quiz/:courseId/history', authRequired, allowRoles('employee'), (req, res) => {
    const campaignId = typeof req.query.campaignId === 'string' ? req.query.campaignId : '';
    const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE organization_id = ? AND user_id = ? AND course_id = ? AND (? = ? OR campaign_id = ?) AND completed_at IS NOT NULL ORDER BY attempt_number DESC').all(req.auth.organization.id, req.auth.id, req.params.courseId, campaignId, '', campaignId);
    res.json({ attempts: attempts.map(attemptSummary) });
  });

  app.get('/api/admin/automation', authRequired, allowRoles(...viewerRoles), (req, res) => {
    const outbox = db.prepare('SELECT id, recipient_email, template, subject, status, attempts, scheduled_for, sent_at, last_error, created_at FROM email_outbox WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100').all(req.auth.organization.id);
    const summary = db.prepare('SELECT status, COUNT(*) count FROM email_outbox WHERE organization_id = ? GROUP BY status').all(req.auth.organization.id);
    res.json({ smtpConfigured: Boolean(process.env.SMTP_HOST), outbox, summary });
  });

  app.post('/api/admin/scheduler/run', authRequired, allowRoles(...adminRoles), (req, res) => res.json({ result: runScheduler({ db, getProductState, saveProductState, writeAudit, simulationSecret: sessionSecret, organizationId: req.auth.organization.id }) }));
  app.post('/api/admin/email/process', authRequired, allowRoles(...adminRoles), async (req, res, next) => { try { res.json({ result: await processEmailOutbox(db, 25, req.auth.organization.id) }); } catch (error) { next(error); } });

  app.post('/api/public/simulations/:token/event', (req, res, next) => {
    try {
      const { event } = validate(z.object({ event: z.enum(['opened', 'clicked', 'reported', 'no_action']) }).strict(), req.body);
      const tokenHash = createHash('sha256').update(`${sessionSecret}:${req.params.token}`).digest('hex');
      const recipient = db.prepare('SELECT * FROM simulation_recipients WHERE token_hash = ?').get(tokenHash);
      if (!recipient) return res.status(202).json({ accepted: true });
      const duplicate = db.prepare('SELECT id FROM simulation_events WHERE recipient_id = ? AND event = ?').get(recipient.id, event);
      if (duplicate) return res.status(202).json({ accepted: true });
      const ipHash = createHash('sha256').update(`${sessionSecret}:${req.ip}`).digest('hex');
      db.prepare('INSERT INTO simulation_events (id, organization_id, campaign_id, recipient_id, event, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)').run(randomUUID(), recipient.organization_id, recipient.campaign_id, recipient.id, event, ipHash, req.get('user-agent')?.slice(0, 500) || null);
      const state = getProductState(recipient.organization_id);
      const simulation = state.simulations.find((item) => item.campaignId === recipient.campaign_id);
      if (simulation) { simulation[event === 'no_action' ? 'noAction' : event] = Number(simulation[event === 'no_action' ? 'noAction' : event] || 0) + 1; saveProductState(recipient.organization_id, state); }
      writeAudit({ organizationId: recipient.organization_id, actorUserId: recipient.user_id, action: `simulation.${event}`, entityType: 'campaign', entityId: recipient.campaign_id, metadata: { safeTracking: true } });
      res.status(202).json({ accepted: true });
    } catch (error) { next(error); }
  });

  app.get('/api/admin/simulations/:campaignId/events', authRequired, allowRoles(...viewerRoles), (req, res) => {
    const events = db.prepare(`SELECT e.id, e.event, e.created_at, u.name, u.department FROM simulation_events e JOIN simulation_recipients r ON r.id=e.recipient_id JOIN users u ON u.id=r.user_id WHERE e.organization_id=? AND e.campaign_id=? ORDER BY e.created_at DESC`).all(req.auth.organization.id, req.params.campaignId);
    res.json({ events });
  });

  const reportQuery = z.object({ period: z.enum(['7', '30', '90', '365', 'all']).default('30'), department: z.string().trim().max(100).optional(), campaignId: z.string().trim().max(160).optional(), risk: z.enum(['high', 'medium', 'low']).optional() });
  app.get('/api/admin/dashboard', authRequired, allowRoles(...viewerRoles), (req, res, next) => { try { const query = validate(reportQuery, req.query); res.json(reportData(db, getProductState, req.auth.organization.id, query)); } catch (error) { next(error); } });
  app.get('/api/admin/export/employees.csv', authRequired, allowRoles(...viewerRoles), (req, res, next) => {
    try {
      const query = validate(reportQuery, req.query); const report = reportData(db, getProductState, req.auth.organization.id, query);
      const attempts = new Map(report.attempts.map((item) => [item.user_id, item]));
      const rows = [['Name', 'Email', 'Department', 'Active', 'Latest score', 'Passed'], ...report.users.map((user) => { const attempt = attempts.get(user.id); return [user.name, user.email, user.department, user.active ? 'Yes' : 'No', attempt?.score ?? '', attempt ? (attempt.passed ? 'Yes' : 'No') : '']; })];
      const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
      res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="averis-employees-${new Date().toISOString().slice(0, 10)}.csv"` }).send(`\uFEFF${csv}`);
    } catch (error) { next(error); }
  });

  app.get('/api/admin/export/report.pdf', authRequired, allowRoles(...viewerRoles), (req, res, next) => {
    try {
      const query = validate(reportQuery, req.query); const report = reportData(db, getProductState, req.auth.organization.id, query);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="averis-report-${new Date().toISOString().slice(0, 10)}.pdf"` });
      const pdf = new PDFDocument({ margin: 48, size: 'A4' }); pdf.on('error', next); pdf.pipe(res);
      pdf.fontSize(22).fillColor('#111827').text('AVERIS Security Awareness Report');
      pdf.moveDown(0.3).fontSize(10).fillColor('#64748b').text(`${req.auth.organization.name} · Generated ${new Date().toLocaleString('id-ID')}`);
      pdf.moveDown(1.5).fontSize(14).fillColor('#111827').text('Ringkasan');
      pdf.fontSize(11).text(`Employees: ${report.summary.employees}`).text(`Active campaigns: ${report.summary.activeCampaigns}`).text(`Quiz attempts: ${report.summary.attempts}`).text(`Pass rate: ${report.summary.completion}%`).text(`Average score: ${report.summary.score}/100`);
      pdf.moveDown(1.5).fontSize(14).text('Departemen');
      report.byDepartment.forEach((item) => pdf.fontSize(10).text(`${item.department}: ${item.employees} employees · score ${item.score}/100`));
      pdf.end();
    } catch (error) { next(error); }
  });

  app.get('/api/public/certificates/:id', (req, res) => {
    const certificate = db.prepare(`SELECT c.id, c.course_id, c.course_title, c.score, c.status, c.issued_at, u.name employee_name, o.name organization_name FROM certificates c JOIN users u ON u.id=c.user_id JOIN organizations o ON o.id=c.organization_id WHERE c.id=?`).get(req.params.id);
    if (!certificate || certificate.status !== 'Issued') return res.status(404).json({ error: { code: 'CERTIFICATE_NOT_FOUND', message: 'Sertifikat tidak ditemukan atau tidak berlaku.' } });
    res.json({ certificate: { id: certificate.id, courseId: certificate.course_id, courseTitle: certificate.course_title, score: certificate.score, issuedAt: certificate.issued_at, employeeName: certificate.employee_name, organizationName: certificate.organization_name, valid: true } });
  });
}

function attemptSummary(row) { return { id: row.id, attempt: row.attempt_number, score: row.score, passed: Boolean(row.passed), startedAt: row.started_at, completedAt: row.completed_at, nextRetryAt: row.next_retry_at }; }

function buildQuizPayload(db, course, attempt) {
  const order = parseJson(attempt.question_order_json);
  const questionMap = new Map(db.prepare(`SELECT * FROM questions WHERE organization_id = ? AND course_id = ?`).all(course.organizationId || db.prepare('SELECT organization_id FROM quiz_attempts WHERE id=?').get(attempt.id).organization_id, course.id).map((row) => [row.id, row]));
  return { status: 'active', attempt: { id: attempt.id, number: attempt.attempt_number, startedAt: attempt.started_at }, course: { id: course.id, title: course.title, passingScore: course.passingScore, maxAttempts: course.maxAttempts }, questions: order.map((id) => sanitizeQuestion(questionMap.get(id), false)) };
}
