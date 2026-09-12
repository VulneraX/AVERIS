# AVERIS marketing website

The public landing page lives at `/`. Existing application sign-in lives at `/login`; protected workspace routes continue to enforce the existing authentication and role checks.

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
- `server/marketing.mjs`: inquiry storage, validation, retention, and rate limiting.
- `scripts/prerender.mjs`: static marketing HTML generation.

The workspace is loaded separately to keep authenticated screens and data fetching out of the public-page startup path.

## Verification

`npm test` includes inquiry validation, persistence, consent, honeypot, retention, and rate-limit coverage alongside existing workspace/security tests. `npm run test:e2e` verifies public content, hydrated behavior, desktop/mobile accessibility, keyboard and modal interactions, form failure/retry/success, all five specified widths, and the existing authenticated product flows. Browser tests use a temporary database and disabled outbound email.

AVERIS 2.0 adds a separate Human Risk Index, adaptive practice, studio, coaching, and controlled automation previews. See [implementation and operations](AVERIS-2.md) for capabilities and deployment limitations.
