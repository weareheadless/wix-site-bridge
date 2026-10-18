# Tapisserie & restauration — placement

Target `--site atelier-harmonie`, `/tapisserie-restauration`. Source repo `weareheadless/atelier-harmonie`, source commit `dbaba03`. Startup release `atelier-production-20261018-v17`.

## Human Editor setup

1. Keep shared header/footer and the **real existing Wix contact form** with its fields, submissions, confirmation message, notifications and consent/spam configuration. Do not delete the native form when removing old body sections.
2. Replace old editorial body sections with one full-width section and real Custom Element. Velo file: `public/custom-elements/atelier-restoration-v1.js`; tag: `atelier-restoration-v1`; requested ID: `customElement10`. Tell the agent if Wix assigns a different ID.
3. Put the retained contact form directly below the new element's contact ending. Remove duplicate old contact text/images already reproduced by the component, preserving actual form behavior.
4. Zero section padding/no restrictive max-width. Start around **4,000 px desktop / 6,000 px mobile** for element AND section, then fit actual content in Preview, including expanded cushion details. Estimates are not verified saved geometry. Component observes its own content height; it cannot resize saved parent Wix section geometry.
5. Native form design: white background, espresso `#42170a` text, thin beige `#e5dace` field outlines, muted rose `#87475b` submit button with white text. Apply through human Editor design controls, preserving labels and focus/error states. No DOM selectors or code overriding Wix internals.
6. Preview desktop/mobile, fresh loads and internal navigation: hero, all original photos/copy, intact before/after, all three service shortcuts, accordion opening/closing, `/devis` links, email/phone and retained form visibility. No form submission performed by the agent.
7. Publish the current saved Editor layout once ready; never publish the checkout’s stale local UI snapshot.

## Redesign

- Mathilde at work is the hero, with original “Votre projet, mon savoir-faire”, subtitle and full introduction.
- Three service choices scroll within the component to seats, lampshades and cushions, with keyboard focus and reduced-motion support.
- Restoration centres the original combined before/after asset (no fake comparison slider); original process text becomes three steps.
- Lampshade section keeps original copy and three project scenarios; original pagode photo retained.
- Cushions section keeps all original text, including materials and meditation content. Déco details open initially; meditation details expand on demand. Native details works without custom script; SEO markup includes full content.
- Contact ending reuses the original stitching photograph and original contact details. No replacement form, parallel submission backend or third-party CRM.
- Original distinct photographs reused once (the original page duplicated the zafu image); widths/heights reserve representative aspect ratios, no fixed frame cropping. Human still owns actual container geometry.
- Static text renders immediately; route-specific hero preload matches visible URL. Shared header/footer and source fallback preserved. Startup controllers/packets synchronized, within size limits.
- Placement, final saved geometry, publication and live content/interaction verification remain pending human setup. No speed scores claimed.
- Private receipts/snapshots under customer state directory. Recovery restores prior startup HTML or disables the affected entries, synchronizing normal Wix sources and packets.
