# AVERIS 2.0 — implementation and operations

AVERIS connects measured awareness, verified behavior, and reviewed business context. The product remains React/Vite, Express, and SQLite. Existing learning, assessments, campaigns, reporting, authentication, and tenant boundaries are retained.

## Run

Run `npm run dev` for the application and API. Use `npm run build` followed by `npm start` for a configured production environment. `/` is the public, pre-rendered website; `/login` opens the authenticated application. Database schema additions run idempotently at startup. Existing records are preserved. Back up the deployment database before an upgrade.

The public site does not require an AI provider. No AI credentials were configured during this implementation, and no external AI calls or email deliveries were made for verification.

## Implemented capabilities

| Area | Current behavior |
| --- | --- |
| Human Risk Index | Deterministic factor replay, evidence coverage, qualitative confidence, source ledger, profile/context editing, department/role/location/topic views |
| Awareness Score | Existing knowledge/behavior/reporting/improvement calculation; separate from Human Risk Index |
| Recommendations | Evidence rules propose learning, coaching, simulation, monitoring, or dismissal; explicit review and persisted decisions |
| Adaptive practice | Topic, scenario complexity, and cadence use observed decisions. Approved studio templates retain their reviewed content and design difficulty |
| Content Studio | Manual drafts; PDF/text/Markdown/pasted text/public HTML URL/existing course/bulletin sources; lesson and question editing; preview/review/approve/publish |
| Curriculum | 24 original English editorial competencies with scenarios, knowledge checks, explanations, and varied correct-answer positions |
| Simulation Studio | Reviewed scenarios; audience assignment; authenticated in-app practice; separate explicit SMTP delivery action for Email |
| Coach | Assigned 45-second guidance and immediate feedback after a practice response; acknowledgments do not reduce risk |
| Respond | Employee reports and existing manual investigation; optional provider-backed triage endpoint, with human classification retained |
| Cohorts | Dynamic department, business-role, privilege, join-date, topic, signal-count, and risk conditions |
| Autopilot | Observe by default; Recommend, Assist, and Automate; approved policies, bounded cadence, wait periods, follow-up practice, and recorded outcomes |
| Employee | Next activity, positive security skills, awareness, earned XP/badges/streaks; no Human Risk Index or individual risk label |
| Reporting | Same-cohort before/after behavior, reporting/detection rates, time to report, protected aggregate results, real PDF/CSV exports, original campaign/compliance evidence |
| Signal ingestion | Scoped token plus HMAC, exact request bytes, timestamp checking, source/delivery deduplication, tenant validation, revoke action |
| Audit | Decisions, approval versions, source references, policy execution, exports, triage, and draft provenance |

The named connectors in Integrations are **Planned**, including Entra ID, Okta, Google Workspace, Microsoft 365, Gmail, Defender, CrowdStrike, Zscaler, Workday, BambooHR, SCIM, Teams, Slack, Sentinel, and Splunk. Generic OIDC and SMTP already exist and require configuration. The signed incoming signal API is implemented. A generic API does not imply a working vendor connector.

SMS, QR, collaboration, voice, callback, and deepfake are **textual in-app scenarios**, not connected delivery channels, voice synthesis, impersonation calls, or generated videos. The UI states this explicitly. Email sends through the existing delivery queue only when SMTP is configured and an administrator explicitly authorizes sending.

## Risk methodology: `averis-risk/2.0.0`

`HRI = round(threat × vulnerability × impact / 10,000)`, with each factor bounded to 0–100. Lower means less observed risk. This is an explainable program-prioritization model, not an actuarial probability, independently calibrated prediction, or employee-performance measure.

An absent factor remains `null`; no index is returned until all three factors have evidence. Coverage is the fraction of the three measured factors. Organization and group risk require the configured minimum number of measured profiles (default five). Individual profiles are limited to security administrators.

Risk is replayed chronologically from verified, non-invalidated events in the preceding 90 days. The latest effective business-impact context persists beyond the signal window. Replay includes timestamps and source IDs. A 30-day change is returned only when both comparison scores are measurable. An expired event can change the replayed result; the ledger describes the current window rather than claiming a permanent risk estimate.

| Event | Factor contribution |
| --- | --- |
| Reviewed role context | Impact set to 25 / 50 / 75 / 100, with recorded rationale |
| Measured exposure | Threat set to the source measurement |
| Verified targeting | Threat +20, starting at zero for the first observed targeting event |
| Graded knowledge | Vulnerability set to `100 − assessment score` |
| Simulation interaction | Vulnerability +12 |
| Unsafe sharing | Vulnerability +10 |
| Identity risk | Vulnerability +8 |
| Verified identity protection | Vulnerability −5 |
| Reported simulation | Vulnerability −8 |
| Security-confirmed report | Vulnerability −6 |
| Independently verified request | Vulnerability −5 |
| Learning/coaching completed | Participation evidence only; no direct factor change |

Behavior-only vulnerability changes begin from an explicit neutral baseline of 50 when no earlier vulnerability measurement exists. Factor values are bounded after each event. These are product-policy coefficients and need organizational review; they are not universal empirical constants. A new graded assessment resets the vulnerability anchor; later behavior changes apply to that anchor. Thus event order matters. Ledger entries expose the before/after value and contribution.

Confidence is qualitative coverage/evidence depth, not a probability. Missing factors produce Low; complete coverage produces Medium; five factor-contributing observations produce High. Exact implementation is in `server/intelligence/risk-engine.mjs`.

Awareness retains its existing weights: knowledge 35%, behavior 30%, reporting 20%, improvement 15%. Missing components are excluded and remaining weights normalized. The public explanation is at `/methodology`.

## Governance and adaptive cadence

Observe and Recommend never execute background interventions. Manual administrator actions remain available. Assist prepares proposed actions for human approval. Automate executes only enabled, approved policies whose approver remains an active security administrator. A one-off policy executes once per matched employee; continuous policies require fresh evidence and respect cadence.

The baseline cadence defaults to 30 days. Two recent unsafe decisions shorten the adaptive recommendation to 15 days (minimum seven); three positive decisions with no unsafe observations allow a longer cadence (maximum 90). Policy cadence acts as an additional lower bound. Foundation through Resilient skill levels use the number and safe proportion of measured decisions. Scenario complexity adds realistic ambiguity and context; it never collects credentials or provides executable payloads.

Policies require at least two relevant verified unsafe or low-knowledge observations. After an approved intervention, the worker waits the configured number of days before follow-up practice, then waits seven days to evaluate the response. A report without interaction records positive behavior; an interaction assigns reinforcement; no response remains monitoring. Pausing a policy or leaving Automate prevents background follow-up execution. Assist follow-ups require switching to Automate under reviewed governance.

## Optional AI adapter — disabled by default

No provider is selected or enabled for this deployment. Manual content, deterministic risk, recommendations, and policy execution work independently of AI.

A future operator may configure `AVERIS_AI_API_KEY`, `AVERIS_AI_MODEL`, and optionally `AVERIS_AI_BASE_URL` on the server, then explicitly enable AI in governance. These are never Vite/client environment variables. The adapter uses an HTTPS OpenAI-compatible Responses endpoint, strict JSON schemas, `store: false`, a timeout, and server-side validation. Provider-specific compatibility, cost, data-processing terms, accuracy, refusal behavior, and live connectivity still require deployment verification. Setting credentials alone does not enable an organization.

AI may draft course/scenario/questions, summarize evidence, or suggest report triage. It cannot set Human Risk Index, approve/publish content, launch activity, or silently close a report. Unconfigured AI returns `503 AI_UNCONFIGURED`, not a generated-looking template. Draft provenance distinguishes editorial/manual content from provider output. Imported material is treated as source data, not instructions.

Manual editorial templates are English. Indonesian can be selected for source-based or AI-assisted drafts, but manually derived English templates must be translated and reviewed before publication. Full translation of every new administrative screen is not implemented; the existing EN/ID application remains available.

Implementation references: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [PDF.js](https://mozilla.github.io/pdf.js/examples/).

## Source handling

PDF text extraction happens locally in the browser using a lazily loaded PDF.js worker. Maximum file size is 5 MB, with 30 PDF pages and 40,000 extracted characters. Scanned PDFs without selectable text require a transcript. Sources are stored with drafts; no unsupported OCR claim is made.

The public URL importer permits HTTPS port 443 and public IPv4 resolutions only. It rejects credentials in URLs, private/reserved destinations, redirects, non-text responses, oversized bodies, and timeouts. DNS resolution is pinned for the request. Paste internal policy text instead of exposing internal URLs. Manual source drafts preserve all submitted source text, split across lessons where necessary; administrators must reconcile the editorial questions with their policy before approval.

## Signal API

Create a connector in Integrations. Save its bearer token and signing secret immediately; the UI only displays them once. The database stores a token hash and an encrypted signing secret. Tokens are scoped to the issuing organization and can be revoked.

`POST /api/signals/:connectorId`

Body example (replace IDs and timestamps with actual evidence):

```json
{
  "events": [{
    "userId": "organization-user-id",
    "kind": "exposure_observed",
    "topic": "BEC",
    "value": 80,
    "sourceId": "verified-source-event-id",
    "description": "Source-specific explanation of measured exposure.",
    "occurredAt": "2026-09-12T00:00:00.000Z"
  }]
}
```

Headers:

- `Authorization: Bearer <token>`
- `X-AVERIS-Timestamp`: current Unix milliseconds
- `X-AVERIS-Delivery-Id`: unique 6–200 character alphanumeric/underscore/hyphen ID
- `X-AVERIS-Signature`: hexadecimal HMAC-SHA256 of `timestamp.deliveryId.` followed by the **exact request-body bytes**, using the signing secret

Signatures allow five minutes of clock difference. Events must be within 90 days and cannot be materially future-dated. Maximum 100 events/request; all employee IDs must belong to the connector organization. Delivery replay and repeated source events are idempotent. An invalid event rolls back the batch. Accepted external kinds: `threat_targeted`, `exposure_observed`, `identity_risk`, `identity_verified`, `unsafe_sharing`, `verified_request`. Assessment results, participation, simulations, and confirmed reports come from native product workflows and cannot be claimed through this API.

## Privacy, measurements, and retention

The employee intelligence endpoint returns only personal learning, skills, awareness, practice, and positive achievements. Administrators see individual risk evidence. Managers see aggregate intelligence views; new individual-profile, export, and mutation routes reject manager access. Existing application permissions continue to govern the original reports and People screens.

Before/after comparisons use the same intervention audience and topic with 14-day windows. Rates require the minimum number of distinct observed employees in each window. Incomplete windows do not receive an improvement label. Participation, completion, quiz pass rate, detection rate, reporting rate, and click rate have separate denominators. Comparisons are observational and do not establish causation.

The risk-signal retention setting defaults to 365 days (90–730 allowed). Expired risk signals are pruned by the worker in all modes. Role context is retained until superseded. This setting governs the projected risk-signal ledger, not every source table, audit record, draft, exported report, backup, or underlying learning record. Configure organization-wide retention and deletion policies separately. Existing marketing inquiries expire after 90 days.

## Verification and deployment limits

`npm test` covers the deterministic engine, existing security/workspace workflows, studio approval/version gates, source preservation, private practice, idempotency, signed ingestion, tenant boundaries, AI-disabled behavior, aggregate privacy, and automatic follow-up. `npm run test:e2e` exercises public content and inquiries, accessibility/responsive behavior, the original campaign-to-certificate flow, and new context/studio/practice/profile screens.

Tests use disposable SQLite databases and disabled SMTP/AI. Build and browser checks are local validation, not a load test, penetration test, certification, or evidence of configured external integrations. SQLite sizing, production email delivery, provider integration, legal terms, backup/restore, and organization-specific risk coefficient approval remain deployment responsibilities.
