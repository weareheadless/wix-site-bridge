# Devis — separate top / bottom

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target `--site atelier-harmonie`, `/devis`; connected source `weareheadless/atelier-harmonie`, commit `7af6eb7`; startup `atelier-production-20261018-v29`.

Page order:
1. Shared header retained.
2. New full-width top section: Velo `public/custom-elements/atelier-quote-top-v1.js`, tag `atelier-quote-top-v1`, ID `customElement16`.
3. **Existing native Wix quote form AND existing photograph unchanged.** Preserve fields, photo upload, 15Mb limit, submission/notification settings, labels, validation, confirmation and image geometry. No adapter or custom form fields added.
4. New full-width bottom section: Velo `public/custom-elements/atelier-quote-bottom-v1.js`, tag `atelier-quote-bottom-v1`, ID `customElement17`.
5. Shared footer retained.

Remove only replaced old intro/process/pricing text sections. No outer section padding or restrictive max-width. Fit actual contents including all expanded pricing rows in Preview. Tell agent if element IDs differ.

Original full introduction, process and price explanations retained. Three process cards have natural headings (no numbered filler labels); pricing details are native accessible accordions. Copy is static and SEO-exposed; no CMS/CRM/form or picture mutation. No hero-image preload added because custom top has no image; existing native picture remains Wix-owned.

Explicit /devis registration covers both components, synchronized initial/per-navigation Head controllers and guarded packets, normal source fallback. Human must preview desktop/mobile, fresh/internal navigation, full copy, native form/photo/upload visibility and accordion behavior before publishing saved current Editor layout. No tests or form submissions sent; live placement/behavior not verified. Never CLI-publish stale UI state.

Recovery: private receipt/before-snapshot HTML under customer state directory supports restore or disabling relevant startup entries while keeping normal source fallback synchronized.
