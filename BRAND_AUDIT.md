# AVERIS Brand Translation

## VulneraX visual audit

Source reviewed: `https://vulnerax.id/` and its current production stylesheets on 28 August 2026.

- Corporate accent: `#DE1A34` — used for calls to action, active states, emphasis, and brand energy.
- Security ink: `#0B1220` — used for authoritative dark surfaces and security callouts.
- Heading ink: `#1C2F41`; default body text: `#212529`.
- Light brand surface: `#F3F9FF`, supported by white working surfaces.
- Typography: Montserrat for headings, Inter for navigation, system sans-serif for body copy.
- Visual language: strong dark/light contrast, red focal accents, clean white content areas, rounded-but-controlled geometry, and restrained security imagery.
- Tone: direct, credible, protective, and outcome-oriented. Repeated brand concepts include Secure, Reliable, Responsible and transforming vulnerabilities into strengths.

## AVERIS product translation

AVERIS keeps the VulneraX red/ink relationship but makes it suitable for a data-heavy SaaS workspace:

- Dark `#0B1220` navigation anchors the parent-brand relationship.
- VulneraX red `#DE1A34` becomes the AVERIS primary action and signal color.
- White and cool-neutral working surfaces preserve table, chart, learning, and report readability.
- Montserrat is reserved for product wordmark and high-level headings; Inter remains the primary UI typeface.
- The AVERIS mark combines an abstract A with three measurement/signal lines: awareness made visible.
- The signal-grid motif appears only in branded moments such as login, report, and certificate.
- Semantic risk colors remain separate and always pair color with text.

## Product tokens

```css
--averis-primary: #DE1A34;
--averis-primary-hover: #B80F27;
--averis-ink: #0B1220;
--averis-heading: #1C2F41;
--averis-background: #F7F8FA;
--averis-surface: #FFFFFF;
--averis-border: #DFE3E8;
--averis-text-primary: #1C2F41;
--averis-text-secondary: #6C757D;
--risk-strong: #14845C;
--risk-good: #40566F;
--risk-improvement: #BF7912;
--risk-high: #C9364D;
```
