# À propos — Mathilde

Target `--site atelier-harmonie`, `/a-propos`; source `weareheadless/atelier-harmonie` commit `5a96b02`, startup `atelier-production-20261018-v28`.

Replace old editorial story sections with one full-width Custom Element; preserve shared header/footer and native contact section/form below.
- Velo file `public/custom-elements/atelier-about-v1.js`
- Tag `atelier-about-v1`
- Requested ID `customElement15`; tell agent if assigned differently.

Zero section padding/restrictive max-width. Start around 2,000px desktop / 3,000px mobile for element AND containing section, then fit actual image/text content in Preview. Estimates, not verified saved geometry; custom element height does not resize Wix section.

Design: original Mathilde portrait leads the page, original story grouped into introduction/craft/responsibility, original restored-chair photo retained, cream/white/rose editorial theme. Original full paragraphs and social/Ecomaison destinations preserved. Kit CTA corrected to known native product `/product-page/kit-diy-ma-lampe-%C3%A0-poser` instead of the original general lamps category. No new form, CRM or catalog.

Hero text immediate, matching route-specific first-image preload, remaining photo lazy, source fallback and shared header/footer kept. Explicit /a-propos route startup synchronized; no component snippets injected into native DOM.

Preview desktop/mobile, fresh/internal navigation, full copy, photographs, native contact visibility and destinations before publishing saved current Editor layout. No tests/performance audit or live placement confirmation performed. Never CLI-publish stale UI snapshot. Private receipts and before-snapshots support restore/disable recovery with matching source fallback.
