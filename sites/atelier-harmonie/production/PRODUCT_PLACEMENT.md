# Product Page — one reusable custom element

Target `--site atelier-harmonie`, exact dynamic route family `/product-page/:slug`, Wix page `Product Page.lj022.js`. Connected source `weareheadless/atelier-harmonie`, commit `14580f7`.

## Status

Source pushed and startup release `atelier-production-20261018-v38` installed after explicit human approval. Product startup ID `d1343538-27ba-4069-8c5b-4d20db25e22a`; receipt hash, HEAD/load-once placement and manifest mapping inspected. Human placement, visual/live review and publication remain pending.

## Human placement

- Open the existing shared Store Pages → Product Page template. Do not create a separate ordinary page for each product or change product URLs.
- Add a real full-width Custom Element between the existing shared header and footer.
- Source: Velo file `public/custom-elements/atelier-product-v1.js`.
- Tag: `atelier-product-v1`.
- Element ID: `customElement20`.
- Zero outer section padding, no restrictive max-width. Initial element AND containing-section height estimate: 1,500px desktop / 2,000px mobile. Actual height varies with product description, options and expanded details. Fit actual content on desktop/mobile; component height events do not resize Wix parent sections.
- Preserve Wix Stores installation, Product Page route, existing canonical/SEO configuration, cart/checkout and system pages. Retain `productPage1` as the native host and fallback; the approved supported collapse handles its visible product content. Remove only separately duplicated related-product sections after preview. No app DOM selectors or overlay positioning are used.
- Human approved retaining the required native `productPage1` host. Keep it in the Editor with its existing ID. Supported Velo code collapses it after the current custom product acknowledges rendering; no manual hiding, DOM selectors or CSS masking. Errors/readiness timeout restore native display and collapse the failed custom element. Do not delete the Store Page/app.
- Publish only the human's current saved Editor layout after Preview. Do not CLI-publish stale UI revision 740.

## Design and data

Cream/white gallery and editorial purchase panel. Photos retain natural proportions: the bordered frame follows the selected image with no fixed square, inner padding or crop. Thumbnails and native dialog enlargement remain. Description/details start collapsed; additional info sections share an accordion group so opening one closes the other. Product copy and additional-info sections come from Wix, sanitized to retain text, paragraphs, lists and links. No copied product snapshot in production. Four current creations reuse the existing live catalog service below.

Product is resolved from the actual URL slug through read-only public `Stores/Products`, without hidden-product flags or suppressed permissions. Managed variant prices come from documented `wix-stores-backend.getProductVariants`; stock comes from `Stores/Variants`. Non-managed choices and custom text are validated against fresh Wix product settings. Cart requests use the fixed Wix Stores catalog app ID; server checks product/choices, text lengths, inventory and integer quantity (1–99), never accepts a client price, arbitrary app or catalog payload. Wix performs the final cart validation and owns checkout, delivery, taxes and payment.

“Commander et payer” adds the selected item to the visitor's current cart, creates a WEB checkout from that cart and navigates to the real Wix checkout. Existing cart items are included; a checkout-creation failure leaves the successful addition available through “Voir mon panier” rather than retrying the addition. No cart, checkout or order writes were exercised during implementation.

Images are supported; product video presentation is not implemented. Preserve any video-bearing native product experience until a corresponding supported media treatment is added. Do not claim native app features not explicitly rebuilt (such as reviews, wishlist or back-in-stock subscriptions) have been migrated.

## Startup and readiness gate

Installed v38 registry matches `/product-page/<one slug>` explicitly and includes shared navbar/footer. Product packet is under the 15,000-character limit, source fingerprint recorded in build-manifest. Normal Wix custom-element file remains fallback. Static gallery geometry and editorial shell render immediately; product-specific content arrives through Velo. Only the actual first selected product image receives a matching preload/high priority; no global catalog snapshot or bulk preload.

Visual inspection is pending: in-app browser control returned “Local browser use is disabled in Work settings.” No other browser was used. Human should preview multiple image orientations, long descriptions, options/variant prices, custom text, sold-out items, quantity limits, cart/checkout and product-to-product navigation. Live fresh/internal navigation, SEO and saved section geometry are release gates, not inferred from registration or a successful build. No tests or performance audit run.

## Recovery

Product receipt and returned embed ID are recorded in the private state and site manifest. Restore before-snapshot HTML or disable relevant startup entries on rollback; keep source fallback aligned. Source can be reverted in the dedicated repository; preserve current human layout rather than publishing stale local UI state.

API references read: Wix Stores Collections (Products / Variants), getProductVariants, Catalog V1 eCommerce Integration, addToCurrentCart, createCheckoutFromCurrentCart, navigateToCartPage, navigateToCheckoutPage and wix-location-frontend.onChange.

## Product refinement / FAQ

Requested image-fit and expandable-details corrections are in source `fde0abb`; v32 startup covers product and separate FAQ. See `PRODUCT_FAQ_PLACEMENT.md` for `customElement21`. Existing `customElement20` keeps its file/tag/ID. Visual confirmation remains pending; the in-app browser is disabled.

## Approved native host fallback

Source `4f402b7`, installed startup v33. No human visibility setting is necessary. The real custom element reports product ID/load token after two animation frames; page code collapses `productPage1` only for the matching load. Native view remains available during initial loading and is expanded on data/render failure or a 12-second readiness timeout; the failed custom element is collapsed. Native widget may appear briefly before custom readiness. This preserves a recoverable native fallback and is not evidence of faster paint. Human current-layout publication and fresh/internal navigation review remain pending.

## Product questions and excerpt

Source `113fc43`: question CTA uses mailto `mathildevalle.atelier@gmail.com` with product name in subject. Original description provides a visible plain-text excerpt up to 220 characters above the purchase controls; “Lire la description” expands the complete original rich copy below. Descriptions that fit entirely in the excerpt do not duplicate an accordion. Human reported native collapse works; these latest text/link refinements await live visual confirmation.

## Missing-excerpt follow-up

Source `3616c67` supports a narrative saved in a named description/product-info section when the main Wix description is empty, without duplicating that same section. Plain-text extraction preserves nested paragraph word boundaries. Component version attribute `data-atelier-product-version="20261018-v35"` identifies the definition actually loaded. Public HTML contained the v34 packet with excerpt code, but visual rendering and root cause were not confirmed. Human should publish the current saved layout/source, then fully reload the affected product. Exact affected URL/publication status requested; pending human response.

## Current behavior — supersedes prior native fallback notes

Human screenshot showed excerpt already present above the buttons, and native widget intermittently reappearing. Source `b1a439a` moves the excerpt immediately above “Lire la suite”. User explicitly requested disabling the native visual widget: current page code hides AND collapses `productPage1` immediately and on every product navigation. No native expand/show calls or automatic fallback remain. A 12-second readiness timeout or data failure displays the custom error state instead. The native host/app stays installed, not uninstalled.

For zero flash before Velo initializes, human should select `productPage1` → Properties & Events and enable **Hidden on load** and **Collapsed on load**, then publish the current saved layout/source. Code alone starts at onReady and cannot guarantee absence of a pre-onReady flash. Keep `customElement20` visible and expanded on load. Do not collapse its containing section. Screenshot inspection is evidence for the previous excerpt placement only; latest behavior remains pending human publication and live review.

## Current behavior — supersedes readiness timeout notes

Source `116ec33` removes the 12-second destructive timeout entirely. It could clear valid content if the readiness acknowledgement was lost. Same-product URL changes are idempotent; only a changed slug resets product data. SEO markup updates are isolated so SEO failure cannot route a successful product load into the error path. Duplicate attribute notifications and stale error/loading tokens cannot reset a painted current product. Native UI stays suppressed, without a fallback. Source/startup changes do not prove live behavior; human must publish saved layout/page code, then confirm the view stays visible beyond 12 seconds and through internal product navigation. No automated tests or browser runtime verification performed.

## Compact gallery and one expanding description

Source `14580f7` caps the photo frame at min(520px,58svh) desktop and min(400px,46svh) mobile, with contain fit so the full photo stays uncropped. Its frame remains stable across different photo proportions. Smaller thumbnails and explicit previous/next controls provide access to the complete gallery without scrolling through an oversized portrait. Description uses a native button with aria-expanded/aria-controls: expansion replaces the excerpt with the complete rich description at the same location; collapse restores the excerpt, with no duplicate paragraph. Other product-info disclosures remain independent. No new placement IDs or page-code changes required for this revision. Human current-layout publish keeps normal Wix source fallback synchronized. Live visual confirmation remains pending.
