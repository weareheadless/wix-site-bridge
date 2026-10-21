# B2B — professional portfolio

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target `--site atelier-harmonie`, `/b2b`; connected source `weareheadless/atelier-harmonie`, commit `148c7e1`; startup `atelier-production-20261018-v23`.

## Human placement

1. Replace the existing editorial body sections (intro, audiences, guarantees, project) with one full-width Wix section + Custom Element.
2. File `public/custom-elements/atelier-b2b-v1.js`; tag `atelier-b2b-v1`; requested ID `customElement13`. Tell the agent if Wix assigns another ID.
3. Keep shared header/footer and the complete native contact section/form below: fields, notification/submission settings, success/error messages and original contact details.
4. No section padding/restrictive maximum width.
5. Preview desktop/mobile, fresh load/internal navigation, audience tabs (keyboard arrows/Home/End), all original photos/logos, project external website, guarantees accordions, quote links and native form visibility. No submission made by agent.
6. Publish current saved Editor layout once ready; never CLI-publish the checkout’s stale UI snapshot.

## Design / preserved content

- Original hero title, subtitle and introduction retained. Hôteliers & Restaurateurs initially active; other audiences use one visible panel at a time. Inactive panels are inert and aria-hidden; shared grid reserves tallest panel height.
- Original audience descriptions and RSE quote retained. No invented client claims or extra commercial promises.
- Villa du Clos Normand featured project appears before guarantees. Original project paragraph, all three deliverables, logo and original website destination retained; project photographs are reused in a compact staggered photo layout with natural proportions.
- Four original guarantees are accessible expandable rows; Artisan d’Art and Ecomaison logos remain visible. Technical/conformity wording is reproduced from original page, not newly verified certification evidence.
- Final professional quote CTA links to existing `/devis`; no custom contact form or backend added.
- Immediate hero copy, first hero photo preload matching displayed URL on `/b2b` only, lazy below-fold media, explicit route coverage and normal Wix source fallback. Initial/per-navigation startup controllers and packets synchronized, below size guards.
- Human placement/publication and live interaction/content inspection still pending. No tests/performance audits run or speed scores claimed.
- Private receipts/before-snapshots stay in customer state directory. Recovery restores previous packet/controller HTML or disables relevant custom-code entries with normal source fallback synchronized.

## Villa photo correction

User confirmed all project photographs are for Villa du Clos Normand. Removed erroneous restaurant caption and corrected reused image alt text. Four project photographs now form one two-column staggered mosaic beside the project heading/logo; original description and deliverables sit below. Same `customElement13`; source `484e03c`, startup `atelier-production-20261018-v24`. Human previews current layout and adjusts section height if needed before publishing.

## Gallery replaces mosaic

User rejected the mosaic’s mixed proportions and cramped text. Current source `cfafce8`, startup `atelier-production-20261018-v25`: project heading/name with enlarged Villa illustration (280px desktop / 240px mobile), then a centred manual 3:4 portrait gallery (up to 480px wide) with stable frame, uncropped contained photos, arrows, count and thumbnails. No autoplay. Description/deliverables below, full-width on mobile. Old mosaic is superseded. Same ID/tag; preview current saved layout and publish when ready. No live verification or tests claimed.

## Inspected project card (current)

After live visual review, replaced the isolated centre gallery and detached text with one bordered ivory project card: gallery left, Villa illustration (up to 390px) and story/deliverables right. First slide now shows the lampshades so it does not immediately repeat the hero chair. Natural photographs preserved in stable 3:4 frame; manual controls and thumbnails retained. Mobile stacks within the same card. Source `29c5d5a`, startup `atelier-production-20261018-v26`.

User-requested visual inspection: IAB live desktop old layout reviewed; local desktop preview at 1280px reviewed; gallery next/previous checked, frame height stayed 586.66px and story width 504.61px. Screenshot saved as user-facing output `outputs/villa-project-preview.png`. This is local preview evidence, not live publication or mobile/performance verification. Same customElement13; preview/publish human’s current saved Wix layout.
