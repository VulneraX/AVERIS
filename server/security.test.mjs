import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { createInitialProductState } from './seed-data.mjs';

const testDirectory = mkdtempSync(join(tmpdir(), 'averis-security-'));
const databasePath = join(testDirectory, 'test.sqlite');
const port = 3217;
const baseUrl = `http://127.0.0.1:${port}`;
const passwords = {
  owner: 'Owner-Secure-Password!27', admin: 'Admin-Secure-Password!27',
  manager: 'Manager-Secure-Password!27', employee: 'Employee-Secure-Password!27',
};
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start.');
}

async function login(email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return { cookie: response.headers.get('set-cookie').split(';', 1)[0], user: body.user };
}

async function request(path, { cookie, method = 'GET', body, origin } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (origin) headers.origin = origin;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const parsed = response.status === 204 ? null : await response.json();
  return { response, body: parsed };
}

before(async () => {
  server = spawn(process.execPath, ['server/index.mjs'], {
    cwd: process.cwd(), stdio: ['ignore', 'ignore', 'pipe'],
    env: {
      ...process.env, NODE_ENV: 'development', PORT: String(port), DATABASE_PATH: databasePath, LEGACY_API_ENABLED:'true',
      SESSION_SECRET: 'test-session-secret-with-more-than-32-characters',
      BOOTSTRAP_SUPER_ADMIN_PASSWORD: passwords.owner,
      BOOTSTRAP_ADMIN_PASSWORD: passwords.admin,
      BOOTSTRAP_MANAGER_PASSWORD: passwords.manager,
      BOOTSTRAP_EMPLOYEE_PASSWORD: passwords.employee,
    },
  });
  await waitForServer();
});

after(() => {
  server?.kill('SIGTERM');
  rmSync(testDirectory, { recursive: true, force: true });
});

test('real session authentication and role identity', async () => {
  const employee = await login('andini@acme.co.id', passwords.employee);
  assert.equal(employee.user.role, 'employee');
  const me = await request('/api/auth/me', { cookie: employee.cookie });
  assert.equal(me.response.status, 200);
  assert.equal(me.body.user.organization.slug, 'acme-indonesia');
});

test('RBAC denies employee audit access and manager launch access', async () => {
  const employee = await login('andini@acme.co.id', passwords.employee);
  const employeeAudit = await request('/api/audit-logs', { cookie: employee.cookie });
  assert.equal(employeeAudit.response.status, 403);
  assert.equal(employeeAudit.body.error.code, 'FORBIDDEN');

  const manager = await login('manager@acme.co.id', passwords.manager);
  const managerLaunch = await request('/api/product-actions/launchCampaign', {
    cookie: manager.cookie, method: 'POST', body: { id: 'finance-phishing' },
  });
  assert.equal(managerLaunch.response.status, 403);
});

test('validation and origin controls reject unsafe requests', async () => {
  const admin = await login('admin@acme.co.id', passwords.admin);
  const invalid = await request('/api/product-actions/createCampaign', {
    cookie: admin.cookie, method: 'POST', body: { campaign: { name: 'x' } },
  });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.ok(invalid.body.error.fields['campaign.name']);

  const crossOrigin = await request('/api/auth/login', {
    method: 'POST', origin: 'https://attacker.example',
    body: { email: 'admin@acme.co.id', password: passwords.admin },
  });
  assert.equal(crossOrigin.response.status, 403);
  assert.equal(crossOrigin.body.error.code, 'INVALID_ORIGIN');
});

test('product mutations persist in SQLite and are audited', async () => {
  const employee = await login('andini@acme.co.id', passwords.employee);
  const mutation = await request('/api/product-actions/reportPhishing', {
    cookie: employee.cookie, method: 'POST', body: {},
  });
  assert.equal(mutation.response.status, 200);
  assert.equal(mutation.body.state.phishingReports, 62);

  const database = new Database(databasePath, { readonly: true });
  const state = JSON.parse(database.prepare('SELECT state_json FROM product_states LIMIT 1').get().state_json);
  const audit = database.prepare("SELECT action FROM audit_logs WHERE action = 'product.reportPhishing' AND outcome = 'success'").get();
  database.close();
  assert.equal(state.phishingReports, 62);
  assert.equal(audit.action, 'product.reportPhishing');
});

test('tenant identity from the session isolates product state and audit records', async () => {
  const database = new Database(databasePath);
  const otherState = createInitialProductState();
  otherState.organizationScore = 11;
  otherState.employeeScore = 11;
  database.prepare('INSERT INTO organizations (id, name, slug) VALUES (?, ?, ?)').run('tenant-b', 'Tenant B', 'tenant-b');
  database.prepare('INSERT INTO product_states (organization_id, state_json) VALUES (?, ?)').run('tenant-b', JSON.stringify(otherState));
  database.prepare(`INSERT INTO users (id, organization_id, email, password_hash, name, role, department) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run('tenant-b-user', 'tenant-b', 'employee@tenant-b.test', bcrypt.hashSync(passwords.employee, 12), 'Tenant B Employee', 'employee', 'Operations');
  database.close();

  const tenantB = await login('employee@tenant-b.test', passwords.employee);
  const tenantBState = await request('/api/product-state', { cookie: tenantB.cookie });
  assert.equal(tenantBState.body.state.organizationScore, 11);

  const admin = await login('admin@acme.co.id', passwords.admin);
  const tenantAState = await request('/api/product-state', { cookie: admin.cookie });
  assert.notEqual(tenantAState.body.state.organizationScore, 11);
  const tenantAAudit = await request('/api/audit-logs?limit=100', { cookie: admin.cookie });
  assert.equal(tenantAAudit.body.logs.some((entry) => entry.actor_email === 'employee@tenant-b.test'), false);
});

test('employee management supports CSV import, edit, and deactivation', async () => {
  const owner = await login('owner@acme.co.id', passwords.owner);
  const imported = await request('/api/admin/users/import', {
    cookie: owner.cookie, method: 'POST', body: { csv: 'email,name,department,role\nnew.employee@acme.co.id,New Employee,Engineering,employee' },
  });
  assert.equal(imported.response.status, 201);
  assert.equal(imported.body.created.length, 1);
  assert.ok(imported.body.created[0].temporaryPassword.length >= 12);
  const id = imported.body.created[0].id;
  const updated = await request(`/api/admin/users/${id}`, {
    cookie: owner.cookie, method: 'PATCH', body: { email: 'new.employee@acme.co.id', name: 'Updated Employee', department: 'Operations', role: 'employee', active: false },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.user.active, false);
  const failedLogin = await request('/api/auth/login', { method: 'POST', body: { email: 'new.employee@acme.co.id', password: imported.body.created[0].temporaryPassword } });
  assert.equal(failedLogin.response.status, 401);
});

test('CMS keeps answer keys private and quiz attempts issue verifiable certificates', async () => {
  const admin = await login('admin@acme.co.id', passwords.admin);
  const content = await request('/api/admin/content/courses/phishing-awareness', { cookie: admin.cookie });
  assert.equal(content.response.status, 200);
  assert.ok(content.body.course.questions[0].correctIndex >= 0);
  const duplicateCourse = await request('/api/product-actions/assignLearning', {
    cookie: admin.cookie, method: 'POST', body: { assignment: {
      campaignId: 'scope-regression', courseId: 'phishing-awareness', courseTitle: 'Phishing Awareness',
      audience: 'Finance', employees: 1, dueDate: '2026-12-31', required: true,
    } },
  });
  assert.equal(duplicateCourse.response.status, 200);

  const employee = await login('andini@acme.co.id', passwords.employee);
  const unlock = await request('/api/product-actions/completeLearningContent', { cookie: employee.cookie, method: 'POST', body: { courseId: 'phishing-awareness', campaignId: 'q3-2026' } });
  assert.equal(unlock.response.status, 200);
  const scopedAssignments = unlock.body.state.assignments.filter((item) => item.courseId === 'phishing-awareness');
  assert.equal(scopedAssignments.find((item) => item.campaignId === 'q3-2026').status, 'Quiz Available');
  assert.equal(scopedAssignments.find((item) => item.campaignId === 'scope-regression').status, 'Not Started');
  const quiz = await request('/api/quiz/phishing-awareness?campaignId=q3-2026', { cookie: employee.cookie });
  assert.equal(quiz.response.status, 201);
  assert.equal('correctIndex' in quiz.body.questions[0], false);
  const answerKeys = new Map(content.body.course.questions.map((item) => [item.id, item.correctIndex]));
  const answers = quiz.body.questions.map((item) => answerKeys.get(item.id));
  const submitted = await request('/api/quiz/phishing-awareness/submit?campaignId=q3-2026', { cookie: employee.cookie, method: 'POST', body: { attemptId: quiz.body.attempt.id, answers } });
  assert.equal(submitted.response.status, 200);
  assert.equal(submitted.body.result.passed, true);
  assert.equal(submitted.body.result.score, 100);
  assert.deepEqual(submitted.body.state.simulations, []);
  const history = await request('/api/quiz/phishing-awareness/history?campaignId=q3-2026', { cookie: employee.cookie });
  assert.equal(history.body.attempts[0].score, 100);

  const database = new Database(databasePath, { readonly: true });
  const certificateId = database.prepare("SELECT id FROM certificates WHERE course_id = 'phishing-awareness'").get().id;
  database.close();
  const verified = await request(`/api/public/certificates/${certificateId}`);
  assert.equal(verified.response.status, 200);
  assert.equal(verified.body.certificate.valid, true);
});

test('dashboard filters and CSV/PDF exports return generated backend data', async () => {
  const admin = await login('admin@acme.co.id', passwords.admin);
  const dashboard = await request('/api/admin/dashboard?period=30&department=Finance&risk=low', { cookie: admin.cookie });
  assert.equal(dashboard.response.status, 200);
  assert.equal(dashboard.body.summary.employees, 1);
  assert.equal(dashboard.body.summary.score, 100);

  const csv = await fetch(`${baseUrl}/api/admin/export/employees.csv?period=30`, { headers: { cookie: admin.cookie } });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.match(await csv.text(), /Andini Putri/);
  const pdf = await fetch(`${baseUrl}/api/admin/export/report.pdf?period=30`, { headers: { cookie: admin.cookie } });
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers.get('content-type'), /application\/pdf/);
  assert.ok((await pdf.arrayBuffer()).byteLength > 500);
});

test('phishing tracking accepts only safe events and stores hashed network data', async () => {
  const database = new Database(databasePath, { readonly: true });
  const message = database.prepare("SELECT text_body FROM email_outbox WHERE template = 'phishing_simulation' LIMIT 1").get();
  database.close();
  assert.ok(message);
  const token = message.text_body.match(/\/simulation\/([^\s]+)/)[1];
  const safe = await request(`/api/public/simulations/${token}/event`, { method: 'POST', body: { event: 'reported' } });
  assert.equal(safe.response.status, 202);
  const unsafe = await request(`/api/public/simulations/${token}/event`, { method: 'POST', body: { event: 'credentialAttempted' } });
  assert.equal(unsafe.response.status, 400);
  const check = new Database(databasePath, { readonly: true });
  const event = check.prepare("SELECT ip_hash FROM simulation_events WHERE event = 'reported' ORDER BY created_at DESC LIMIT 1").get();
  check.close();
  assert.equal(event.ip_hash.length, 64);
});
