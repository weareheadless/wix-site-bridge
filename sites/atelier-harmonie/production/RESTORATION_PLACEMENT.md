# Tapisserie & restauration — placement

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target `--site atelier-harmonie`, `/tapisserie-restauration`. Source repo `weareheadless/atelier-harmonie`, source commit `a731216`. Startup release `atelier-production-20261018-v21`.

## Human Editor setup

1. Keep shared header/footer and the **real existing Wix contact form** with its fields, submissions, confirmation message, notifications and consent/spam configuration. Do not delete the native form when removing old body sections.
2. Replace old editorial body sections with one full-width section and real Custom Element. Velo file: `public/custom-elements/atelier-restoration-v1.js`; tag: `atelier-restoration-v1`; requested ID: `customElement10`. Tell the agent if Wix assigns a different ID.
3. Keep the complete native Wix contact section directly below the embed, including its photo, heading, contact details and working form. The embed now ends after the cushion service.
4. Zero section padding/no restrictive max-width. Component observes its content height. Verify that the saved Wix section follows it; investigate any actual constraint separately.
5. Native form design: white background, espresso `#42170a` text, thin beige `#e5dace` field outlines, muted rose `#87475b` submit button with white text. Apply through human Editor design controls, preserving labels and focus/error states. No DOM selectors or code overriding Wix internals.
6. Preview desktop/mobile, fresh loads and internal navigation: hero, all original photos/copy, intact before/after, all three service shortcuts, accordion opening/closing, `/devis` links, email/phone and retained form visibility. No form submission performed by the agent.
7. Publish the current saved Editor layout once ready; never publish the checkout’s stale local UI snapshot.

## Redesign

- Mathilde at work is the hero, with original “Votre projet, mon savoir-faire”, subtitle and full introduction.
- Three service choices scroll within the component to seats, lampshades and cushions, with keyboard focus and reduced-motion support.
- Restoration centres the original combined before/after asset (no fake comparison slider); original process text becomes three steps.
- Lampshade section keeps original copy and three project scenarios; original pagode photo retained.
- Cushions section keeps all original text, including materials and meditation content. Déco details open initially; meditation details expand on demand. Native details works without custom script; SEO markup includes full content.
- Contact ending, stitching photograph and contact details stay entirely in the native Wix section. No form adapter, embedded contact fields or replacement backend remain.
- Original distinct photographs reused once (the original page duplicated the zafu image); widths/heights reserve representative aspect ratios, no fixed frame cropping. Human still owns actual container geometry.
- Static text renders immediately; route-specific hero preload matches visible URL. Shared header/footer and source fallback preserved. Startup controllers/packets synchronized, within size limits.
- Placement, final saved geometry, publication and live content/interaction verification remain pending human setup. No speed scores claimed.
- Private receipts/snapshots under customer state directory. Recovery restores prior startup HTML or disables the affected entries, synchronizing normal Wix sources and packets.

## Current contact decision

User cancelled integrated contact mapping. Removed the embedded contact section, its styles/scripts, contact attributes/events and `restoration-form-config.js`. Page binding now assigns SEO only. Keep the native Wix contact section; no element-ID mapping is needed. Same `customElement10`, file/tag unchanged. Source pushed; current saved layout still requires human publication.

## Current tabbed layout

User approved service tabs replacing shortcuts and stacked service sections. Source `a731216`, startup `atelier-production-20261018-v21`. Same file/tag/ID `atelier-restoration-v1.js` / `atelier-restoration-v1` / `customElement10`; no new element required.

Hero is shared; Sièges opens initially. One visible panel at a time; inactive panels are inert and aria-hidden. Arrow keys, Home/End and roving tab focus supported. Mobile tabs use three equal columns without horizontal scrolling. Full original texts and photographs remain in component/SEO source.

Panels share a grid area and contribute intrinsic height, reserving the tallest panel so ordinary tab switching does not move following contact content. Expanding cushion details may increase needed height. Fit the Wix element AND section to the largest content in desktop/mobile Preview; remove the old long-page excess blank space. Separate contact intro `customElement11` and real Wix form remain below. Placement/publication and live desktop/mobile behavior confirmation remain human-dependent; no tests run or performance score claimed.
