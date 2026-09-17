# AVERIS public website ecosystem

Status: implemented in the current React/Vite application. This document describes the public routes and the boundary between marketing content and the authenticated workspace.

## Runtime boundary

- `/` renders the pre-rendered AVERIS homepage.
- Public website routes are rendered by `src/marketing/PublicSite.tsx`.
- Authenticated routes such as `/login`, `/admin/*`, and `/employee/*` continue to render `WorkspaceApplication`.
- Public pages do not access tenant data, authenticated APIs, or employee records.
- Product frames use clearly labeled fictional demo data. They do not mutate workspace state.

Run locally with:

```bash
npm run dev
```

The development server may choose another Vite port when `4173` is already in use. `npm run build` bundles the public site and runs `scripts/prerender.mjs` for the homepage.

## Route inventory

### Core product and conversion

| Route | Purpose |
| --- | --- |
| `/` | Concise product story and interactive marketing previews |
| `/platform` | Platform overview and the Measure → Understand → Act loop |
| `/how-it-works` | Product workflow and evidence governance |
| `/product/human-risk` | Human Risk Intelligence explanation |
| `/product/security-awareness` | Awareness, assessment, and behavior story |
| `/product/learning` | Learning and campaign workflow |
| `/product/simulations` | Safe simulations and phishing reporting |
| `/solutions` | Role-oriented solution overview |
| `/solutions/security-teams` | Security-team intent route; currently uses the solution overview presentation |
| `/solutions/grc` | GRC intent route; currently uses the solution overview presentation |
| `/solutions/hr-learning` | HR and learning intent route; currently uses the solution overview presentation |
| `/tour` | Guided interactive product tour with five steps |
| `/demo` | Self-service demo modes without account creation |
| `/request-demo` | Sales inquiry page backed by `POST /api/public/inquiries` |
| `/pricing` | Sales-led pricing explanation; no invented tiers or prices |

### Learning and resource ecosystem

| Route | Purpose |
| --- | --- |
| `/videos` | Video Center content hub |
| `/videos/:slug` | Video/content detail presentation |
| `/tutorials` | Task-oriented tutorial hub |
| `/tutorials/:slug` | Tutorial/content detail presentation |
| `/academy` | Product education tracks for administrators and practitioners |
| `/masterclass` | Academy-style practitioner education entry point |
| `/docs` | Search-free first documentation hub with sticky contents navigation |
| `/docs/:slug` | Documentation/content detail presentation |
| `/resources` | Unified resource hub |
| `/blog` | Resource presentation filtered for article intent |
| `/blog/:slug` | Article/content detail presentation |
| `/guides` | Resource presentation filtered for guide intent |
| `/guides/:slug` | Guide/content detail presentation |
| `/tools/awareness-maturity` | Five-question maturity assessment with immediate indicative result |

### Trust and company

| Route | Purpose |
| --- | --- |
| `/security` | Product security, privacy boundaries, simulation safety, and responsible AI claims |
| `/integrations` | Available versus Coming Soon integration status |
| `/support` | Documentation, tutorials, and contact paths |
| `/about` | Product/company positioning without fabricated company claims |
| `/compare` | Completion versus behavior versus improvement comparison |

## Navigation model

Desktop navigation groups the site by visitor intent:

- **Platform**: overview, how it works, tour, demo, and actual product capabilities.
- **Solutions**: security teams, GRC/compliance, and HR/learning.
- **Resources**: videos, tutorials, documentation, academy, guides, and articles.
- **Security**: trust and product boundaries.
- **Pricing**: sales-led explanation.
- **Sign in**: authenticated workspace entry.
- **See AVERIS in action**: request-demo conversion path.

Mobile navigation uses a full-height panel and keeps the same top-level intent groups. The landing-page anchor navigation remains inside `/` for the concise homepage story.

## Interactive experiences

### Product frames

`ProductFrame` is a DOM-based product illustration using fictional ACME data. It displays an overview, risk, learning, campaign, or reporting state based on the page context. It is intentionally not a screenshot and does not claim live workspace data.

### Tour

`/tour` provides five selectable steps:

1. Overview
2. Risk map
3. Recommendation
4. Learning
5. Outcome

Visitors can select a step, use Back/Continue, or restart. The tour does not create campaigns, assignments, simulations, or user records.

### Self-service demo

`/demo` provides local mode switching for:

- 2-minute overview
- Admin experience
- Employee experience
- Learning experience
- Reporting experience

It is a guided product preview, not an isolated tenant or sandbox account.

### Awareness maturity tool

`/tools/awareness-maturity` asks five practical yes/no questions and shows an indicative score immediately. It is not a calibrated risk model, compliance assessment, or substitute for the workspace Awareness Score or Human Risk Index.

## Content model and current limitations

The public content model is split between shared typed schema files and the page
composition. Tutorial entries live in `src/marketing/content/tutorials.ts` and
use `src/marketing/content/schema.ts`; the public hub maps those entries into a
shared content-card shape:

- title
- description
- content type
- topic
- duration
- route

The first structured tutorial entries include creating a campaign, adding
employees, publishing learning, running a baseline, reviewing phishing,
exporting evidence, configuring MFA, and preparing OIDC SSO. English and
Indonesian strings exist in the content model, although the current public
shell still renders English by default.

The following are intentionally not claimed as complete backend capabilities yet:

- CMS editing and publishing
- real video hosting, chapters, captions, and transcripts
- global Cmd/Ctrl+K search across all content
- article author and publication metadata
- webinar registration and recording lifecycle
- customer case studies, logos, testimonials, and ROI claims
- CRM or calendar scheduling after inquiry submission
- public roadmap or uptime history
- per-route localized English and Indonesian content

Do not add placeholder links for these capabilities without implementing the underlying workflow. When a connector or commercial capability is not available, label it **Coming Soon** or keep it out of the public navigation.

## Trust and product accuracy rules

- Do not invent customers, logos, certifications, ratings, ROI, uptime, or compliance claims.
- Do not describe planned connectors as available. Generic OIDC, SMTP, and the signed signal API are the implemented integration boundaries documented in [AVERIS 2.0](AVERIS-2.md).
- Keep Human Risk Index separate from Awareness Score in copy and diagrams.
- Explain that demo data is fictional and illustrative.
- Do not present AI as enabled when the deployment has no configured provider.
- Do not expose tenant or employee information in public pages.

## SEO and prerender status

The root homepage is pre-rendered by `scripts/prerender.mjs`. The current Vite SPA serves public subroutes through the application fallback, but route-specific server-rendered metadata and canonical tags are not yet implemented. `PUBLIC_SITE_URL` still provides the root canonical and absolute OpenGraph image during build.

Product visuals use `src/marketing/ProductScene.tsx`, the same fictional ACME
organization across admin, employee, program, awareness, reporting, and
phishing modes. The scene is a controlled DOM interaction, not a screenshot or
live tenant view. Workspace interaction polish is layered through
`src/workspace-experience.css` and the shared tokens in `src/design-system.css`.

Before production launch, add route-aware metadata, sitemap generation, localized URLs, and structured data only when the content source and public domain are defined.

## Verification

```bash
npm run build
npx playwright test tests/marketing.spec.ts
```

The marketing suite covers the homepage, responsive widths, keyboard and dialog behavior, inquiry failure/retry/success, public route smoke coverage, Tour progression, demo mode switching, maturity tool interaction, and Axe checks.
