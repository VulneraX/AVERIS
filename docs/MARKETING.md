# AVERIS marketing website

The public experience is a multi-route product website. The homepage lives at
`/`; product, tour, demo, resource, documentation, trust, and sales routes are
listed in [PUBLIC_WEBSITE.md](PUBLIC_WEBSITE.md). Existing application sign-in
lives at `/login`; protected workspace routes continue to enforce the existing
authentication and role checks.

## Run and build

- `npm run dev` runs both the site and the API.
- `npm run build` type-checks, bundles, and pre-renders the landing page into `dist/index.html`.
- `npm start` serves the production build and API using the existing deployment environment.
- `npm run preview` serves a static preview only. Inquiry submissions need the Express API.

Set `PUBLIC_SITE_URL=https://your-actual-domain.example` during the build to generate a canonical URL and absolute OpenGraph image URL. No production domain is assumed. The favicon and social sharing image are local assets; no remote fonts or tracking scripts are needed.

## Content and product accuracy

Product previews are DOM-based, responsive illustrations of the existing application. All preview figures are labeled as illustrative data, not customer results. Interactive controls only change the local preview; campaign and phishing-report previews never send employee messages or alter workspace data.

The score uses the existing 35% knowledge, 30% behavior, 20% reporting, and 15% improvement weighting. The public methodology remains at `/methodology`. Missing evidence is not represented as a zero score.

OIDC and SMTP are implemented and require deployment configuration. The signed incoming signal API is now available. Microsoft Entra ID, Microsoft 365, Google Workspace, Teams, SCIM, and named SIEM connectors are labeled Planned because named connectors are not implemented. No customer logos, testimonials, compliance certifications, or published pricing are invented.

The public privacy and terms dialogs describe website behavior. Subscription and platform data-processing terms are agreed separately.

## Public route boundary

`src/main.tsx` sends public website paths to `PublicSite` and keeps `/login`,
`/admin/*`, and `/employee/*` in `WorkspaceApplication`. Public product frames,
the guided tour, self-service demo, and maturity tool use local fictional data.
They do not fetch or mutate tenant data.

The following public capabilities are implemented as local content presentation,
not as a CMS or external service:

- Video, tutorial, guide, blog, and documentation content cards.
- Academy and masterclass track cards.
- Route-level resource detail presentations.
- Static integration availability and Coming Soon labels.
- Request-demo inquiry submission through the existing marketing API.

Real video hosting, chapters, captions, transcripts, CMS publishing, global
search, CRM/calendar scheduling, webinar registration, customer stories, and
route-specific localized metadata are not implemented. Keep these items out of
capability claims until their underlying services exist.

## Demo, pricing, and contact inquiries

The form sends to `POST /api/public/inquiries`. It validates fields and consent on the server, enforces the existing origin control, checks a honeypot, and permits five attempts per IP per hour. It stores submissions in the `marketing_inquiries` SQLite table with a UUID reference, consent timestamp, and submission time. Records older than 90 days are pruned at startup, on submission, and hourly.

The UI confirms storage and displays the reference only after a successful server response. It does not claim that a meeting was booked or an email was sent. Failed requests preserve form values and allow retry.

An operator with access to the deployment database can export current requests:

```bash
npm run inquiries:export -- --output /secure/path/averis-inquiries.json
```

The command uses `DATABASE_PATH`, opens the database read-only, excludes expired records, and creates a new file with owner-only permissions. It refuses to overwrite an existing file. Exports contain personal data and need their own retention handling. Operator follow-up is manual; no CRM, email notification recipient, or meeting-booking service has been configured.

## Implementation

- `src/marketing/LandingPage.tsx`: page composition, navigation, value loop, roles, integrations, and footer.
- `src/marketing/shared.tsx`: shared brand, headings, buttons, and preview frames.
- `src/marketing/ProductPreview.tsx`: dashboard, score, and human-risk previews.
- `src/marketing/ProgramPreviews.tsx`: campaigns, learning, simulations, employee home, and reporting previews.
- `src/marketing/ContactDialog.tsx`: accessible native dialog, inquiry form, and resource information.
- `src/marketing/marketing.css`: scoped responsive design tokens and styles.
- `src/marketing/PublicSite.tsx`: public route shell, navigation, product pages, tour, demo, resources, documentation, academy, trust, and tools.
- `src/marketing/ProductScene.tsx`: shared interactive fictional workspace scene used by product pages, Tour, and self-service Demo.
- `src/marketing/content/schema.ts` and `src/marketing/content/tutorials.ts`: structured bilingual tutorial content and taxonomy.
- `src/marketing/public-site.css`: public ecosystem layout, product frames, content cards, forms, responsive behavior, and accessibility states.
- `src/workspace-experience.css`: shared workspace motion and interaction polish layered over the design system.
- `server/marketing.mjs`: inquiry storage, validation, retention, and rate limiting.
- `scripts/prerender.mjs`: static marketing HTML generation.

The workspace is loaded separately to keep authenticated screens and data fetching out of the public-page startup path.

## Verification

`npm test` includes inquiry validation, persistence, consent, honeypot, retention, and rate-limit coverage alongside existing workspace/security tests. `npx playwright test tests/marketing.spec.ts` verifies public content, hydrated behavior, desktop/mobile accessibility, keyboard and modal interactions, form failure/retry/success, all five specified widths, public route smoke coverage, Tour progression, demo mode switching, and maturity-tool interaction. Browser tests use a temporary database and disabled outbound email.

AVERIS 2.0 adds a separate Human Risk Index, adaptive practice, studio, coaching, and controlled automation previews. See [implementation and operations](AVERIS-2.md) for capabilities and deployment limitations.
