import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { z } from 'zod';
import { applyProductAction } from './product-actions.mjs';
import { db, databasePath, getProductState, pruneExpiredSessions, saveProductState, writeAudit } from './db.mjs';
import { processEmailOutbox, registerPlatformRoutes, runScheduler } from './platform.mjs';
import { registerWorkspace } from './workspace.mjs';
import { verifyMfa } from './identity.mjs';
import { registerSSO } from './sso.mjs';
import { registerMarketing } from './marketing.mjs';

const app = express();
const port = Number(process.env.PORT || 3001);
const production = process.env.NODE_ENV === 'production';
const host = process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1');
const sessionSecret = process.env.SESSION_SECRET || 'averis-development-session-secret-change-me';
const sessionCookie = 'averis_session';
const dummyPasswordHash = bcrypt.hashSync(randomBytes(32).toString('hex'), 12);

if (production && (!process.env.SESSION_SECRET || sessionSecret.length < 32 || sessionSecret.startsWith('replace-with-'))) {
  throw new Error('SESSION_SECRET minimal 32 karakter wajib di production.');
}
if (!production && !process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET belum diatur; menggunakan development secret.');
}

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.use(helmet({
  contentSecurityPolicy: production ? {
    directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"],
    },
  } : false,
}));
app.use(express.json({ limit: '3mb', verify: (req, _res, body) => { req.rawBody = body; } }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  const configured = (process.env.ALLOWED_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
  const sameOrigin = `${req.protocol}://${req.get('host')}`;
  const allowedOrigins = new Set([sameOrigin, ...configured, ...(!production ? ['http://localhost:4173', 'http://127.0.0.1:4173'] : [])]);
  if (allowedOrigins.has(origin)) return next();
  return res.status(403).json({ error: { code: 'INVALID_ORIGIN', message: 'Origin permintaan tidak diizinkan.' } });
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' } },
});

const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid.').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password minimal 8 karakter.').max(128),
  rememberMe: z.boolean().optional().default(false),
  otp: z.string().max(6).optional(),
}).strict();

const campaignSchema = z.object({
  name: z.string().trim().min(3).max(120),
  objective: z.string().trim().max(500).optional(),
  owner: z.string().trim().max(100).optional(),
  audience: z.string().trim().min(2).max(100),
  employees: z.number().int().min(1).max(100000),
  status: z.enum(['Draft', 'Scheduled', 'Active', 'Completed', 'Closed', 'Cancelled']),
  completion: z.number().min(0).max(100),
  score: z.number().min(0).max(100).nullable(),
  baseline: z.number().min(0).max(100).nullable(),
  schedule: z.string().trim().min(3).max(120),
  learning: z.array(z.string().trim().min(1).max(120)).min(1).max(20),
  assessment: z.string().trim().min(1).max(120),
  simulation: z.string().trim().max(120).optional(),
  startDate: z.string().trim().max(50).optional(),
  learningDueDate: z.string().trim().max(50).optional(),
  endDate: z.string().trim().max(50).optional(),
  baselineEnabled: z.boolean().optional(),
  followUpEnabled: z.boolean().optional(),
}).strict();

const actionSchemas = {
  createCampaign: z.object({ id: z.string().trim().min(3).max(160).optional(), campaign: campaignSchema }).strict(),
  updateCampaignStatus: z.object({ id: z.string().min(1), status: z.enum(['Draft', 'Scheduled', 'Active', 'Completed', 'Closed', 'Cancelled']) }).strict(),
  launchCampaign: z.object({ id: z.string().min(1) }).strict(),
  assignLearning: z.object({ assignment: z.object({
    campaignId: z.string().optional(), courseId: z.string().min(1), courseTitle: z.string().min(1),
    audience: z.string().min(1), employees: z.number().int().min(1).max(100000),
    dueDate: z.string().min(1), required: z.boolean().optional(), quizScore: z.number().optional(),
  }).strict() }).strict(),
  startLearning: z.object({ courseId: z.string().min(1), campaignId: z.string().min(1).optional() }).strict(),
  updateLearningProgress: z.object({ courseId: z.string().min(1), campaignId: z.string().min(1).optional(), progress: z.number().int().min(0).max(100) }).strict(),
  completeLearningContent: z.object({ courseId: z.string().min(1), campaignId: z.string().min(1).optional() }).strict(),
  completeModuleQuiz: z.object({ courseId: z.string().min(1), campaignId: z.string().min(1).optional(), score: z.number().int().min(0).max(100), answers: z.array(z.number().int().min(0).max(20)).max(100).optional() }).strict(),
  completePhishingQuiz: z.object({}).strict(),
  startAssessment: z.object({ id: z.string().min(1) }).strict(),
  completeAssessment: z.object({ score: z.number().int().min(0).max(100), id: z.string().min(1).optional() }).strict(),
  recordSimulationEvent: z.object({ campaignId: z.string().min(1), event: z.enum(['opened', 'clicked', 'credentialAttempted', 'reported', 'noAction']) }).strict(),
  reportPhishing: z.object({}).strict(),
  resetDemo: z.object({}).strict(),
};

const actionRoles = {
  createCampaign: ['super_admin', 'admin', 'manager'],
  updateCampaignStatus: ['super_admin', 'admin'],
  launchCampaign: ['super_admin', 'admin'],
  assignLearning: ['super_admin', 'admin', 'manager'],
  startLearning: ['employee'], updateLearningProgress: ['employee'],
  completeLearningContent: ['employee'], completeModuleQuiz: ['employee'],
  completePhishingQuiz: ['employee'], startAssessment: ['employee'],
  completeAssessment: ['employee'], reportPhishing: ['employee'],
  recordSimulationEvent: ['super_admin', 'admin', 'manager'],
  resetDemo: ['super_admin', 'admin'],
};

const hashToken = (token) => createHmac('sha256', sessionSecret).update(token).digest('hex');
const requestMeta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent')?.slice(0, 500) || null });

function publicUser(row) {
  const preferences = db.prepare('SELECT locale,timezone FROM tenant_settings WHERE organization_id=?').get(row.organization_id);
  return {
    id: row.id, email: row.email, name: row.name, role: row.role,
    department: row.department,
    mustChangePassword: Boolean(db.prepare('SELECT must_change FROM identity_policy WHERE user_id=?').get(row.id)?.must_change),
    organization: { id: row.organization_id, name: row.organization_name, slug: row.organization_slug, locale:preferences?.locale || 'id', timezone:preferences?.timezone || 'Asia/Makassar' },
  };
}

function stateForUser(state, user) {
  if (user.role !== 'employee') return state;
  const department = String(user.department || '').toLowerCase();
  const visibleToEmployee = (audience) => {
    const normalized = String(audience).toLowerCase();
    return normalized === 'all employees' || normalized === department || normalized === `${department} department`;
  };
  const assignments = state.assignments.filter((item) => visibleToEmployee(item.audience));
  const campaignIds = new Set(assignments.map((item) => item.campaignId).filter(Boolean));
  return {
    ...state,
    campaigns: state.campaigns.filter((item) => visibleToEmployee(item.audience)),
    assignments,
    assessments: state.assessments.filter((item) => campaignIds.has(item.campaignId)),
    certificates: state.certificates.filter((item) => item.employeeName === user.name),
    quizAttempts: state.quizAttempts.filter((item) => item.employeeName === user.name),
    simulations: [],
    notifications: [],
    events: state.events.filter((item) => item.actor === user.name),
  };
}

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'form', issue.message]));
    throw Object.assign(new Error('Periksa kembali data yang dikirim.'), { status: 400, code: 'VALIDATION_ERROR', fields });
  }
  return result.data;
}

function authRequired(req, res, next) {
  const rawToken = req.cookies[sessionCookie];
  if (!rawToken) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk untuk melanjutkan.' } });
  const session = db.prepare(`
    SELECT s.id AS session_id, s.expires_at, u.*, o.name AS organization_name, o.slug AS organization_slug
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN organizations o ON o.id = u.organization_id
    WHERE s.token_hash = ? AND u.active = 1
  `).get(hashToken(rawToken));
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    if (session) db.prepare('DELETE FROM sessions WHERE id = ?').run(session.session_id);
    res.clearCookie(sessionCookie, { path: '/' });
    return res.status(401).json({ error: { code: 'SESSION_EXPIRED', message: 'Sesi Anda telah berakhir. Silakan masuk kembali.' } });
  }
  req.auth = publicUser(session);
  req.sessionId = session.session_id;
  if (req.auth.mustChangePassword && !['/api/auth/me','/api/auth/change-password','/api/auth/logout'].includes(req.path)) {
    return res.status(403).json({error:{code:'PASSWORD_CHANGE_REQUIRED',message:'Change your temporary password before continuing.'}});
  }
  db.prepare('UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(session.session_id);
  next();
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.auth.role)) return next();
    writeAudit({
      organizationId: req.auth.organization.id, actorUserId: req.auth.id,
      action: 'authorization.denied', entityType: 'route', entityId: req.path,
      outcome: 'denied', metadata: { requiredRoles: roles, actualRole: req.auth.role }, ...requestMeta(req),
    });
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Anda tidak memiliki izin untuk tindakan ini.' } });
  };
}

const workspace = registerWorkspace(app, {db,authRequired,allowRoles,validate,writeAudit,sessionSecret});
registerSSO(app, {db,sessionSecret,writeAudit,loginLimiter});
app.use('/api', (req,res,next) => {
  if(process.env.LEGACY_API_ENABLED==='true')return next();
  if(/^\/(product-state|product-actions|admin|quiz|audit-logs)(\/|$)/.test(req.path)||/^\/public\/(certificates|simulations)\//.test(req.path))return res.status(410).json({error:{code:'API_RETIRED',message:'Use the current workspace API.'}});
  next();
});
registerMarketing(app, db);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/auth/login', loginLimiter, (req, res, next) => {
  try {
    const input = validate(loginSchema, req.body);
    const user = db.prepare(`
      SELECT u.*, o.name AS organization_name, o.slug AS organization_slug
      FROM users u JOIN organizations o ON o.id = u.organization_id
      WHERE u.email = ? ORDER BY u.created_at LIMIT 1
    `).get(input.email);
    const passwordValid = bcrypt.compareSync(input.password, user?.password_hash || dummyPasswordHash);
    if (!user || !user.active || !passwordValid) {
      if (user) writeAudit({
        organizationId: user.organization_id, actorUserId: user.id, action: 'auth.login',
        entityType: 'session', outcome: 'failure', metadata: { reason: 'invalid_credentials' }, ...requestMeta(req),
      });
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email atau password tidak sesuai.' } });
    }

    if(!verifyMfa(db,user.id,input.otp,sessionSecret)) {
      writeAudit({organizationId:user.organization_id,actorUserId:user.id,action:'auth.mfa_denied',entityType:'session',outcome:'failure',...requestMeta(req)});
      return res.status(401).json({error:{code:'MFA_REQUIRED',message:'Enter a valid authenticator code.'}});
    }
    const token = randomBytes(32).toString('base64url');
    const durationMs = input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    const sessionId = randomUUID();
    db.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, user.id, hashToken(token), expiresAt, req.ip, req.get('user-agent')?.slice(0, 500));
    res.cookie(sessionCookie, token, {
      httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: durationMs,
    });
    writeAudit({
      organizationId: user.organization_id, actorUserId: user.id, action: 'auth.login',
      entityType: 'session', entityId: sessionId, metadata: { rememberMe: input.rememberMe }, ...requestMeta(req),
    });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});
app.post('/api/auth/dev-login', (req, res, next) => {
  try {
    if (production) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
    const roleMap = { admin: 'admin', superadmin: 'super_admin', manager: 'manager', user: 'employee' };
    const role = roleMap[req.body?.role];
    if (!role) return res.status(400).json({ error: { code: 'INVALID_ROLE', message: 'Unknown development role.' } });
    const user = db.prepare(`
      SELECT u.*, o.name AS organization_name, o.slug AS organization_slug
      FROM users u JOIN organizations o ON o.id = u.organization_id
      WHERE u.role = ? AND u.active = 1 ORDER BY u.created_at LIMIT 1
    `).get(role);
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'No active account exists for this role.' } });
    const token = randomBytes(32).toString('base64url');
    const durationMs = 2 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    const sessionId = randomUUID();
    db.prepare(`
      INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, user.id, hashToken(token), expiresAt, req.ip, req.get('user-agent')?.slice(0, 500));
    res.cookie(sessionCookie, token, {
      httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge: durationMs,
    });
    writeAudit({
      organizationId: user.organization_id, actorUserId: user.id, action: 'auth.dev_login',
      entityType: 'session', entityId: sessionId, metadata: { role }, ...requestMeta(req),
    });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', authRequired, (req, res) => res.json({ user: req.auth }));

app.post('/api/auth/logout', authRequired, (req, res) => {
  writeAudit({
    organizationId: req.auth.organization.id, actorUserId: req.auth.id, action: 'auth.logout',
    entityType: 'session', entityId: req.sessionId, ...requestMeta(req),
  });
  db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
  res.clearCookie(sessionCookie, { httpOnly: true, secure: production, sameSite: 'strict', path: '/' });
  res.status(204).end();
});

app.post('/api/auth/change-password', authRequired, (req, res, next) => {
  try {
    const input = validate(z.object({
      currentPassword: z.string().min(8).max(128),
      newPassword: z.string().min(12, 'Password baru minimal 12 karakter.').max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/)
        .regex(/[a-z]/, 'Gunakan huruf kecil.').regex(/[A-Z]/, 'Gunakan huruf besar.')
        .regex(/[0-9]/, 'Gunakan angka.').regex(/[^A-Za-z0-9]/, 'Gunakan simbol.'),
    }).strict(), req.body);
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ? AND organization_id = ?')
      .get(req.auth.id, req.auth.organization.id);
    if (!bcrypt.compareSync(input.currentPassword, user.password_hash)) {
      return res.status(400).json({ error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Password saat ini tidak sesuai.' } });
    }
    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, password_changed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ?')
        .run(bcrypt.hashSync(input.newPassword, 12), req.auth.id, req.auth.organization.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(req.auth.id, req.sessionId);
      db.prepare('UPDATE identity_policy SET must_change=0 WHERE user_id=?').run(req.auth.id);
      writeAudit({
        organizationId: req.auth.organization.id, actorUserId: req.auth.id,
        action: 'auth.password_changed', entityType: 'user', entityId: req.auth.id, ...requestMeta(req),
      });
    })();
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get('/api/product-state', authRequired, (req, res) => {
  res.json({ state: stateForUser(getProductState(req.auth.organization.id), req.auth) });
});

app.post('/api/product-actions/:action', authRequired, (req, res, next) => {
  const action = req.params.action;
  try {
    const schema = actionSchemas[action];
    if (!schema) throw Object.assign(new Error('Action tidak didukung.'), { status: 404, code: 'UNKNOWN_ACTION' });
    const allowed = actionRoles[action];
    if (!allowed.includes(req.auth.role)) {
      writeAudit({
        organizationId: req.auth.organization.id, actorUserId: req.auth.id,
        action: `product.${action}`, entityType: 'product_state', outcome: 'denied',
        metadata: { role: req.auth.role }, ...requestMeta(req),
      });
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Peran Anda tidak memiliki izin untuk tindakan ini.' } });
    }
    const payload = validate(schema, req.body);
    const response = db.transaction(() => {
      const current = getProductState(req.auth.organization.id);
      const applied = applyProductAction(current, action, payload, req.auth);
      saveProductState(req.auth.organization.id, applied.state);
      writeAudit({
        organizationId: req.auth.organization.id, actorUserId: req.auth.id,
        action: `product.${action}`, entityType: 'product_state',
        entityId: payload.id || payload.courseId || payload.campaignId || null,
        metadata: { result: applied.result }, ...requestMeta(req),
      });
      return applied;
    })();
    res.json({ ...response, state: stateForUser(response.state, req.auth) });
  } catch (error) {
    writeAudit({
      organizationId: req.auth.organization.id, actorUserId: req.auth.id,
      action: `product.${action}`, entityType: 'product_state', outcome: 'failure',
      metadata: { code: error.code || 'ACTION_FAILED', message: error.message }, ...requestMeta(req),
    });
    next(error);
  }
});

app.get('/api/admin/users', authRequired, allowRoles('super_admin', 'admin', 'manager'), (req, res) => {
  const roleClause = req.auth.role === 'manager' ? "AND u.role = 'employee'" : '';
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, u.role, u.department, u.active, u.created_at
    FROM users u WHERE u.organization_id = ? ${roleClause} ORDER BY u.name
  `).all(req.auth.organization.id).map((user) => ({ ...user, active: Boolean(user.active) }));
  res.json({ users });
});

app.post('/api/admin/users', authRequired, allowRoles('super_admin', 'admin'), (req, res, next) => {
  try {
    const input = validate(z.object({
      email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
      name: z.string().trim().min(2).max(100), department: z.string().trim().min(2).max(100),
      role: z.enum(['super_admin', 'admin', 'manager', 'employee']),
      temporaryPassword: z.string().min(12).max(128),
    }).strict(), req.body);
    if (req.auth.role !== 'super_admin' && ['super_admin', 'admin'].includes(input.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN_ROLE_ASSIGNMENT', message: 'Hanya Super Admin yang dapat membuat Admin.' } });
    }
    const id = randomUUID();
    db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, organization_id, email, password_hash, name, role, department)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.auth.organization.id, input.email, bcrypt.hashSync(input.temporaryPassword, 12), input.name, input.role, input.department);
      writeAudit({
        organizationId: req.auth.organization.id, actorUserId: req.auth.id,
        action: 'user.created', entityType: 'user', entityId: id,
        metadata: { email: input.email, role: input.role }, ...requestMeta(req),
      });
    })();
    res.status(201).json({ user: { id, email: input.email, name: input.name, role: input.role, department: input.department, active: true } });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email sudah terdaftar dalam organisasi ini.' } });
    }
    next(error);
  }
});

app.get('/api/audit-logs', authRequired, allowRoles('super_admin', 'admin', 'manager'), (req, res, next) => {
  try {
    const query = validate(z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(30),
      action: z.string().trim().max(100).optional(),
    }), req.query);
    const offset = (query.page - 1) * query.limit;
    const filter = query.action ? 'AND a.action LIKE ?' : '';
    const params = query.action
      ? [req.auth.organization.id, `%${query.action}%`, query.limit, offset]
      : [req.auth.organization.id, query.limit, offset];
    const logs = db.prepare(`
      SELECT a.id, a.action, a.entity_type, a.entity_id, a.outcome, a.metadata_json,
             a.ip_address, a.created_at, u.name AS actor_name, u.email AS actor_email
      FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.organization_id = ? ${filter}
      ORDER BY a.created_at DESC LIMIT ? OFFSET ?
    `).all(...params).map((log) => ({
      ...log, metadata: JSON.parse(log.metadata_json), metadata_json: undefined,
    }));
    const countParams = query.action ? [req.auth.organization.id, `%${query.action}%`] : [req.auth.organization.id];
    const total = db.prepare(`SELECT COUNT(*) AS total FROM audit_logs a WHERE a.organization_id = ? ${filter}`).get(...countParams).total;
    res.json({ logs, pagination: { page: query.page, limit: query.limit, total } });
  } catch (error) { next(error); }
});

registerPlatformRoutes(app, {
  db, authRequired, allowRoles, validate, requestMeta, writeAudit,
  getProductState, saveProductState, applyProductAction, stateForUser, sessionSecret,
});

app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.' } }));

if (production || process.env.SERVE_STATIC === 'true') {
  const distPath = resolve('dist');
  if (!existsSync(distPath)) throw new Error('Folder dist tidak ditemukan. Jalankan npm run build terlebih dahulu.');
  app.use(express.static(distPath, { maxAge: '1h', etag: true }));
  app.get(/.*/, (_req, res) => res.sendFile(resolve(distPath, 'index.html')));
}

app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.' } }));

app.use((error, _req, res, _next) => {
  if (!production) console.error(error);
  res.status(error.status || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.status ? error.message : 'Terjadi kesalahan pada server.',
      ...(error.fields ? { fields: error.fields } : {}),
    },
  });
});

pruneExpiredSessions();
const cleanupTimer = setInterval(pruneExpiredSessions, 60 * 60 * 1000);
cleanupTimer.unref();
const automationRun = async () => {
  try {
    if(process.env.LEGACY_API_ENABLED==='true') {
      runScheduler({ db, getProductState, saveProductState, writeAudit, simulationSecret: sessionSecret });
      await processEmailOutbox(db);
    }
    await workspace.tick();
  } catch (error) {
    console.error('Automation cycle failed:', error);
  }
};
void automationRun();
const automationTimer = setInterval(automationRun, 60 * 1000);
automationTimer.unref();

app.listen(port, host, () => {
  console.log(`AVERIS API listening on http://${host}:${port}`);
  console.log(`Database: ${databasePath}`);
});
