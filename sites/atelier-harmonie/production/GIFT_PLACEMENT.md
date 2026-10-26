# Carte cadeau — preserve Wix app, replace editorial sections

Target `--site atelier-harmonie`, `/gift-card`; connected repository `weareheadless/atelier-harmonie`, source commit `09f8946`. Startup `atelier-production-20261018-v16`.

## Human setup, in page order

1. Shared header remains.
2. Replace the old introductory text with a full-width section and Custom Element: file `public/custom-elements/atelier-gift-intro-v1.js`, tag `atelier-gift-intro-v1`, ID `customElement8`.
3. **Keep the real Wix Gift Cards app element and its purchase section. Do not delete or replace it with an HTML iframe/custom form.** It handles preset/custom amount, quantity, checkout and gift-card delivery. Retain its current settings, recipient options, payment flow and availability.
4. Replace the old “Comment ça marche” content with a second full-width section and Custom Element: file `public/custom-elements/atelier-gift-guide-v1.js`, tag `atelier-gift-guide-v1`, ID `customElement9`.
5. Shared footer remains. Tell the agent if Wix assigns different element IDs.
6. No section padding/restrictive max-width around custom elements. Initial sizing estimate intro **650 px desktop / 850 px mobile**, guide **600 px desktop / 1,000 px mobile**, for both element AND section. Fit actual contents in Preview; these are not measured saved Wix geometry.
7. In native app **Settings → Design**, use white background, espresso `#42170a` text, rose `#87475b` primary purchase button, ivory `#faf6ee` option background and beige `#e5dace` borders where those controls are exposed. Use DM Sans body and Libre Caslon Text headings if available. Preserve readable contrast and visible selection/focus states. No CSS targeting Wix internal/generated widget markup.
8. Preview desktop/mobile and fresh/internal navigation; confirm both custom sections and native form remain visible. Native amount/custom amount/quantity/recipient options should remain as configured. User handles any final checkout/purchase validation; agent has made no purchase or gift-card issuance.
9. Publish current saved Editor layout only after ready; no stale local CLI UI publish.

## Implementation notes

- Original hero image, introduction and how-it-works copy reused. No replacement payment logic, issued codes, gift-card backend, duplicate amount selector, synthetic cart product or hidden app overlay.
- Wix app page supports appearance customization; official reference: https://support.wix.com/en/article/wix-gift-cards-customizing-your-sites-gift-card-page . Native visual design changes remain a human Editor task.
- Both custom definitions covered explicitly on `/gift-card`, shared navbar/footer retained, matching first image preload and ordinary source fallback. Initial/per-navigation Head controllers synchronized.
- Publication, saved geometry and live interaction confirmation pending human placement. No performance claims.
- Existing copy mentions bespoke/restoration projects. Reusing that copy does not verify how off-store service redemption is fulfilled; native online gift-card flow remains unchanged.
- Recovery: restore previous private startup snapshots or disable relevant entries in Wix Custom Code, keeping normal source/packets synchronized. Receipts remain private under the customer state directory.
