# AVERIS

**Measure Awareness. Reduce Human Risk.**


AVERIS is a Security Awareness & Human Risk platform by **VulneraX** that helps organizations measure, understand, and improve employee security awareness.

Panduan lengkap berbahasa Indonesia: [DOKUMENTASI_LENGKAP.md](DOKUMENTASI_LENGKAP.md). Implementasi, hasil pengujian, dan batas kesiapan produksi: [PRODUCT_MATURITY.md](PRODUCT_MATURITY.md).

Public website, inquiry handling, and deployment notes: [Marketing website](docs/MARKETING.md). Route inventory and public product ecosystem boundaries: [Public website](docs/PUBLIC_WEBSITE.md).

## Overview

Traditional security awareness programs often stop at training completion.

AVERIS goes further by helping organizations understand:

- How aware employees are
- Which security topics need improvement
- Where human risk exists
- How awareness changes over time
- What actions should be taken next

## Core Flow

**Measure → Understand Risk → Take Action → Prove Improvement**

## Features

- Security Micro-learning
- Assessments & Quizzes
- Awareness Score
- Human Risk Profiles
- Awareness Campaigns
- Baseline Assessments
- Phishing Simulations
- Risk Segmentation
- Targeted Interventions
- Analytics & Reporting
- Certificates
- Compliance Evidence
- Employee lifecycle and CSV onboarding
- Content management and server-side question bank
- Randomized quizzes with attempt/retake policies
- Campaign scheduling and email outbox automation
- Safe phishing-event tracking (no credential collection)
- Backend reports with CSV/PDF export
- Public certificate verification

## Awareness Score

AVERIS uses an explainable **Awareness Score (0–100)** to provide visibility into employee and organizational security awareness.

The score can incorporate signals from:

- Knowledge assessments
- Learning progress
- Phishing behavior
- Reporting behavior
- Awareness improvement

## Product

**AVERIS**  
Security Awareness & Human Risk Platform

**Measure Awareness. Reduce Human Risk.**

by **VulneraX**

---

© 2026 VulneraX. All rights reserved.

## Full-stack development

AVERIS now runs with a local Express API and SQLite database. Authentication uses
opaque session tokens in `HttpOnly` cookies; only a keyed hash of each token is
stored in the database. Passwords are hashed with bcrypt.

```bash
cp .env.example .env
# Set SESSION_SECRET and the four BOOTSTRAP_* passwords.
npm ci
npm run dev
```

- Web application: `http://localhost:4173`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/api/health`
- SQLite file: `.data/averis.sqlite` (configurable with `DATABASE_PATH`)

On the first run, the database creates one organization and four bootstrap roles:
`super_admin`, `admin`, `manager`, and `employee`. If bootstrap passwords are not
provided, strong random passwords are printed once in the API console. They are
never embedded in or returned to the frontend.

For a production-style local run:

```bash
npm run build
NODE_ENV=production node server/index.mjs
```

Use Node.js 22.12+ (tested locally on 22.22.2). Production startup requires
`SESSION_SECRET` with at least 32 characters and HTTPS for Secure session cookies.

Email assignment, due reminder, and overdue notifications are always written to
the tenant-scoped outbox. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS`, and `SMTP_FROM` to deliver them. Without SMTP, they remain queued
and visible under **Settings → delivery health**. The lifecycle processor runs
inside the API every minute against a durable SQLite queue. Admin/Super Admin can
retry failed deliveries. Production SMTP deliverability must be tested separately.

CSV employee import expects this header (maximum 5,000 rows):

```csv
email,name,department,role
employee@example.com,Employee Name,Finance,employee
```

CSV imports queue single-use invitations; no generated passwords are displayed.
Individual creation also supports an administrator-provided temporary password,
which must be changed before workspace access.

## Authorization model

| Capability | Super Admin | Admin | Manager | Employee |
| --- | --- | --- | --- | --- |
| View organization dashboard and reports | Yes | Yes | Yes | No |
| Create campaign drafts | Yes | Yes | Yes | No |
| Launch/close campaigns | Yes | Yes | No | No |
| Manage organization users | Yes | Limited | No | No |
| View tenant audit log | Yes | Yes | Yes | No |
| Complete assigned learning and assessments | No | No | No | Yes |

Tenant identity is always taken from the authenticated server session. API input
cannot select or override `organization_id`. Product state, users, sessions, and
audit records are queried using that server-owned tenant identifier.

## Main API routes

- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET /api/auth/options`, `GET /api/auth/sso/start`, `GET /api/auth/sso/callback`
- `GET /api/workspace/summary`, `GET /api/workspace/me`
- `GET|POST /api/workspace/people`, `PATCH /api/workspace/people/:id`
- `POST /api/workspace/people/import`, `GET|POST /api/workspace/groups`
- `GET|POST /api/workspace/courses`, `GET /api/workspace/courses/:id`
- `GET|POST /api/workspace/campaigns`, `POST /api/workspace/campaigns/:id/action`
- `GET /api/workspace/learning/:id`, `POST /api/workspace/learning/:id/progress`
- `POST /api/workspace/learning/:id/quiz`, `POST /api/workspace/learning/:id/quiz/:attemptId`
- `GET|POST /api/workspace/assessments/:id`
- `GET|POST /api/workspace/phishing`, `PATCH /api/workspace/phishing/:id`
- `GET /api/workspace/exports/:format`, `GET /api/workspace/certificates/:id/pdf`
- `GET /api/workspace/settings`, `GET /api/workspace/audit`
- `POST /api/public/exercise/:token`, `GET /api/public/verify/:id`

Legacy product-state/admin APIs return 410 by default. Keep `LEGACY_API_ENABLED=false`
for the current workspace. Existing legacy data is retained for migration review,
not treated as verified individual learning evidence.

## Verification

```bash
npm run check:server
npm test
npx playwright install chromium
npm run test:e2e
npm run format:check
```

Tests use isolated databases and do not send external SMTP email. OIDC is an optional
configured adapter; real identity-provider acceptance, external delivery, load,
recovery and full accessibility audits remain deployment responsibilities. SQLite
single-node support does not imply a PostgreSQL or multi-instance deployment.

All error responses use `{ "error": { "code", "message", "fields"? } }`.
Mutation inputs are validated with Zod. Authentication is rate limited and all
successful, failed, or denied security-relevant activity is written to `audit_logs`.

## AVERIS 2.0

Human Risk Intelligence, Content Studio, adaptive practice, coaching, cohorts, controlled Autopilot, and signed signal ingestion are implemented. AI remains unconfigured by default. See [AVERIS 2.0 implementation and operations](docs/AVERIS-2.md) for the exact capabilities, risk formula, setup, and remaining external integration requirements.

## Public product website

The public presence is now a multi-route product website rather than a single
landing page. Core routes include `/platform`, `/how-it-works`, `/product/*`,
`/solutions`, `/tour`, `/demo`, `/request-demo`, `/videos`, `/tutorials`,
`/academy`, `/docs`, `/resources`, `/security`, `/integrations`, `/support`,
and `/tools/awareness-maturity`. These pages use fictional demo data and do not
access authenticated tenant data. See [Public website](docs/PUBLIC_WEBSITE.md)
for the complete route inventory, content boundaries, and current limitations.
