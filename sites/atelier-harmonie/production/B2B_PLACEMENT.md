# B2B — professional portfolio

Target `--site atelier-harmonie`, `/b2b`; connected source `weareheadless/atelier-harmonie`, commit `148c7e1`; startup `atelier-production-20261018-v23`.

## Human placement

1. Replace the existing editorial body sections (intro, audiences, guarantees, project) with one full-width Wix section + Custom Element.
2. File `public/custom-elements/atelier-b2b-v1.js`; tag `atelier-b2b-v1`; requested ID `customElement13`. Tell the agent if Wix assigns another ID.
3. Keep shared header/footer and the complete native contact section/form below: fields, notification/submission settings, success/error messages and original contact details.
4. No section padding/restrictive maximum width. Start around **2,800 px desktop / 4,000 px mobile** for element AND containing Wix section; fit actual loaded content, largest tab and expanded guarantees in Preview. Estimates, not verified saved geometry. Component height reporting does not resize the saved Wix section.
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
