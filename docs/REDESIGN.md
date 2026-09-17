# AVERIS product and public ecosystem

This change is based on executable routes and contracts, not historical product documentation.

## Source of truth

- `src/App.tsx`: protected workspace routes and role boundaries.
- `server/workspace.mjs`: tenant-scoped people, campaigns, immutable learning revisions, assessments, grading, awareness, certificates, phishing, delivery, settings and generated reports.
- `server/intelligence/`: implemented evidence, review, practice and signed incoming signal workflows. These remain contextual; named directory and outbound SIEM connectors must not be inferred from incoming signal support.
- `server/identity.mjs`, `server/sso.mjs`: session/MFA and configured OIDC controls.
- `server/marketing.mjs`: validated, rate-limited demo inquiries with explicit consent and 90-day inquiry retention.

## Design and navigation

`src/design-system.css` owns brand, neutral and semantic color tokens, typography, spacing, shape and motion. Workspace and public content use the same tokens with different density. Motion enhancements in `src/motion.tsx` respect reduced motion.

Admin primary navigation is Overview, People, Campaigns, Learning, Awareness and Reports. Integrations and Settings are secondary. Risk evidence, simulation, the security inbox, Studio and incoming connectors retain their existing domain functionality through contextual links.

Employee navigation is Home, Learning, My Awareness and Certificates. Assigned coaching and practice remain connected to the current intelligence API. The learning player remains outside the admin shell.

Phishing reports use an inert message list and a review panel. Only security administrators receive internal notes. Studio publication requires version-specific review and approval on the server; editing invalidates prior approval.

## Public content and deployment

`src/marketing/content/` holds typed bilingual editorial content; publishing resources does not require rewriting page JSX. Public tour and demo state is fictional, local and isolated from workspace writes. Public academy progress belongs to the browser and does not issue workplace certificates. Unavailable video assets are labelled, without a fake player or duration.

`src/marketing/routeManifest.ts` lists public routes. The build prerenders English and Indonesian pages, route-specific metadata, canonical/alternate links, sitemap and robots rules. The Express server serves the correct public HTML, including `?lang=id`, and a separate noindex workspace document. Unknown public content routes return HTTP 404.

Set `PUBLIC_SITE_URL` to the actual deployment origin when building for production. Without it the build deliberately uses `http://localhost:4173`; no production domain is invented. Actual video media, final commercial prices, customer claims and external certifications are not invented.

## Validation

Run `npm run format:check`, `npm run check:server`, `npm test`, `npm run build` and `npm run test:e2e`. Browser coverage includes public crawlability, localization, 1440/1024/768/390 layouts, reduced motion, keyboard/dialog behavior, accessibility, inquiry recovery, workspace error recovery, role restrictions and the campaign-to-certificate lifecycle.

Validation completed: formatting, server syntax and production build passed. The build generated 76 public routes in both languages. All 32 server tests passed. All 10 browser scenarios passed across the full run and focused reruns after fixing stale test selectors, missing documentation links, explicit control labels and Academy text contrast. Responsive checks covered 1440, 1024, 768 and 390 pixels, with reduced motion and axe checks on the primary public surfaces. The final rerun covered only the remaining failed browser scenario.
