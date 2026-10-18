# Product Page — one reusable custom element

Target `--site atelier-harmonie`, exact dynamic route family `/product-page/:slug`, Wix page `Product Page.lj022.js`. Connected source `weareheadless/atelier-harmonie`, commit `fde0abb`.

## Status

Source pushed and startup release `atelier-production-20261018-v32` installed after explicit human approval. Product startup ID `d1343538-27ba-4069-8c5b-4d20db25e22a`; receipt hash, HEAD/load-once placement and manifest mapping inspected. Human placement, visual/live review and publication remain pending.

## Human placement

- Open the existing shared Store Pages → Product Page template. Do not create a separate ordinary page for each product or change product URLs.
- Add a real full-width Custom Element between the existing shared header and footer.
- Source: Velo file `public/custom-elements/atelier-product-v1.js`.
- Tag: `atelier-product-v1`.
- Element ID: `customElement20`.
- Zero outer section padding, no restrictive max-width. Initial element AND containing-section height estimate: 1,500px desktop / 2,000px mobile. Actual height varies with product description, options and expanded details. Fit actual content on desktop/mobile; component height events do not resize Wix parent sections.
- Preserve Wix Stores installation, Product Page route, existing canonical/SEO configuration, cart/checkout and system pages. Replace old visible product content and related-products gallery only after preview confirms the new element loads the selected product. No duplicate hidden product shell, app DOM selectors or overlay positioning are implemented by this release.
- If Wix does not allow removing the old Product Page widget, stop and report that constraint before deleting the Store Page or hiding a duplicate widget. Wix's documented default-content hiding feature is a separate architecture decision, not assumed permission to retain duplicate layers.
- Publish only the human's current saved Editor layout after Preview. Do not CLI-publish stale UI revision 740.

## Design and data

Cream/white gallery and editorial purchase panel. Photos retain natural proportions: the bordered frame follows the selected image with no fixed square, inner padding or crop. Thumbnails and native dialog enlargement remain. Description/details start collapsed; additional info sections share an accordion group so opening one closes the other. Product copy and additional-info sections come from Wix, sanitized to retain text, paragraphs, lists and links. No copied product snapshot in production. Four current creations reuse the existing live catalog service below.

Product is resolved from the actual URL slug through read-only public `Stores/Products`, without hidden-product flags or suppressed permissions. Managed variant prices come from documented `wix-stores-backend.getProductVariants`; stock comes from `Stores/Variants`. Non-managed choices and custom text are validated against fresh Wix product settings. Cart requests use the fixed Wix Stores catalog app ID; server checks product/choices, text lengths, inventory and integer quantity (1–99), never accepts a client price, arbitrary app or catalog payload. Wix performs the final cart validation and owns checkout, delivery, taxes and payment.

“Commander et payer” adds the selected item to the visitor's current cart, creates a WEB checkout from that cart and navigates to the real Wix checkout. Existing cart items are included; a checkout-creation failure leaves the successful addition available through “Voir mon panier” rather than retrying the addition. No cart, checkout or order writes were exercised during implementation.

Images are supported; product video presentation is not implemented. Preserve any video-bearing native product experience until a corresponding supported media treatment is added. Do not claim native app features not explicitly rebuilt (such as reviews, wishlist or back-in-stock subscriptions) have been migrated.

## Startup and readiness gate

Installed v32 registry matches `/product-page/<one slug>` explicitly and includes shared navbar/footer. Product packet is under the 15,000-character limit, source fingerprint recorded in build-manifest. Normal Wix custom-element file remains fallback. Static gallery geometry and editorial shell render immediately; product-specific content arrives through Velo. Only the actual first selected product image receives a matching preload/high priority; no global catalog snapshot or bulk preload.

Visual inspection is pending: in-app browser control returned “Local browser use is disabled in Work settings.” No other browser was used. Human should preview multiple image orientations, long descriptions, options/variant prices, custom text, sold-out items, quantity limits, cart/checkout and product-to-product navigation. Live fresh/internal navigation, SEO and saved section geometry are release gates, not inferred from registration or a successful build. No tests or performance audit run.

## Recovery

Product receipt and returned embed ID are recorded in the private state and site manifest. Restore before-snapshot HTML or disable relevant startup entries on rollback; keep source fallback aligned. Source can be reverted in the dedicated repository; preserve current human layout rather than publishing stale local UI state.

API references read: Wix Stores Collections (Products / Variants), getProductVariants, Catalog V1 eCommerce Integration, addToCurrentCart, createCheckoutFromCurrentCart, navigateToCartPage, navigateToCheckoutPage and wix-location-frontend.onChange.

## Product refinement / FAQ

Requested image-fit and expandable-details corrections are in source `fde0abb`; v32 startup covers product and separate FAQ. See `PRODUCT_FAQ_PLACEMENT.md` for `customElement21`. Existing `customElement20` keeps its file/tag/ID. Visual confirmation remains pending; the in-app browser is disabled.
