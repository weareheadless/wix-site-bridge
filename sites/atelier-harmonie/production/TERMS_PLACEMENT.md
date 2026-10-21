# Sales terms — faithful editorial redesign

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Exact target `--site atelier-harmonie`, `/conditions-generales-de-vente`, page `Conditions générales de vente.i8cyj.js`; source commit `c27eba3`; startup v43.

## Placement

- Shared header and footer remain separate.
- Replace the old native legal-page body/hero with one full-width Custom Element.
- Velo file: `public/custom-elements/atelier-terms-v1.js`.
- Tag: `atelier-terms-v1`.
- Element ID: `customElement22`.
- No outer section padding or restrictive max-width. The component supplies its own spacing.
- This is a full legal document: allow the element AND containing Wix section to fit all 18 articles and the entire annex.
- Human removes replaced text/image sections only after confirming the complete replacement. Do not delete the Store app or unrelated legal pages, footer links, metadata or checkout terms settings.
- Human publishes current saved layout/source. Never CLI-publish stale UI revision 740.

## Content and navigation

`terms/content.json` preserves the 18 original articles and withdrawal annex extracted from the current public page's legal text block. Typography, paragraph spacing, heading hierarchy, and email link presentation change; legal wording, article order, amounts, time limits, address, registration number and form placeholders remain as supplied. No legal audit, rewritten clauses, new terms, summaries of obligations or invented update dates.

Cream text-only hero and white/ivory reading area follow Atelier's design. Desktop contents sidebar is sticky and independently scrollable; mobile contents collapses. Navigation scrolls to the selected original article and focuses it without manipulating Wix route history. All article text is visible and searchable, not hidden in accordions. The withdrawal annex remains plain original text, not a new submission form. A top link and shop link close the document. Print styling keeps the document readable.

Static full legal copy is SEO-exposed through the real custom element. No new CMS queries, product/form adapters or transaction changes. Exact route registration includes the two global controllers and both terms packets; no hero image preload because the hero has no image. Normal Wix custom-element file remains fallback.

## Release evidence

Source build and startup dry-run completed. Live placement, full text visibility, desktop/mobile geometry, contents links, native header/footer and fresh/internal navigation remain human confirmation gates. No automated tests or live browser inspection performed. Registration and receipt hashes do not prove visual completeness. Startup receipts and private before snapshots retain recovery instructions; restoring old HTML or disabling startup entries leaves the synchronized source fallback available.

Installed terms startup IDs: `2df3654a-bafe-4fdc-bb9f-a6e9dbec1147`, `72053d34-0095-46a1-a93f-1e16c0407434`. Receipt hashes, HEAD/load-once placement and manifest mapping inspected.
