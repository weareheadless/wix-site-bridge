# Cookies policy — matching legal-page design

Exact target `--site atelier-harmonie`, `/politique-de-cookies`, Wix page `Politique de cookies.ignax.js`. Source `6793638`; startup v46.

Add one full-width Custom Element between the existing shared header/footer:

- Velo file: `public/custom-elements/atelier-cookies-v1.js`.
- Tag: `atelier-cookies-v1`.
- Element ID: `customElement25`.
- No outer section padding or restrictive max-width. The component owns its spacing.
- Fit the element AND parent section to all three original sections in desktop/mobile Preview. Initial rough estimates: 2,000px desktop / 3,000px mobile; not measured saved Wix geometry. Component resize events do not resize the outer section.

Replace only the old cookies-policy body/hero after confirming the complete replacement. Keep shared header/footer and native cookie-consent banner/settings. Human publishes saved current Editor layout/source; never CLI-publish stale UI revision 740.

Same cream editorial design as CGV/CGU/privacy, with sticky desktop contents, collapsed mobile contents and complete visible/searchable text. Preserve the original three sections (definition, reasons for use, choices), every paragraph and the existing external links to aboutcookies.org, allaboutcookies.org/fr and Google Analytics opt-out guidance. Canonical extracted text is `cookies/content.json`. No policy rewriting, invented update date, new consent UI, tracking code, consent preference change or compliance claim. Existing Wix consent behavior remains authoritative.

Static full policy is SEO-exposed. Exact route startup packet and both global controllers are synchronized with normal Wix source fallback. No hero image or image preload; no CMS query, form or transaction change.

Source build/dry-run completed; human placement, full copy/links, desktop/mobile geometry and fresh/internal navigation review remain pending. No tests or live browser inspection run. Private startup receipt and before snapshots retain recovery instructions.

Installed startup ID `8f960fea-1796-4738-bde8-62b6dbabaf8a`; receipt hash, HEAD/load-once placement and manifest mapping inspected.
