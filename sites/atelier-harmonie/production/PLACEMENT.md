# Atelier production migration — prepared, not deployed

Selected site: `atelier-harmonie` / `376faa89-fe6c-4ae8-8feb-10520e813a89`.
Approved design: current hidden homepage prototype. Native store/CMS remain in Wix.

## Blocking source connection

Wix's Local Dev Setup currently identifies `chocholesmarrons/atelier-harmonie`, which is unavailable through the desktop GitHub CLI, VPS, connector, and signed-in browser. The user confirmed the site should be connected under `weareheadless`. The existing `weareheadless/atelier-harmonie-headless` is an unrelated Next.js/Payload application, not a Wix-connected checkout, and was not modified. Wix's supported reconnect flow creates a new source repository; do not overwrite that headless application.

## Components

- `atelier-navbar-v1`: one supported Custom Element placed inside the shared Wix header. Ordinary Wix source fallback and central early registration must contain identical definitions. Cart controls emit `atelier-cart`; merge a handler using documented `wix-ecom-frontend.navigateToCartPage()` into the existing master page code after inspecting it. Do not overwrite existing site code. Mobile navigation is internal to the component.
- `atelier-home-v1`: one supported Custom Element below the header on the homepage. Retains the approved independent section HTML and interactions inside its own shadow root. No Wix shell selectors, root replacement, or persistent document observer. Its footer belongs to the homepage content; determine shared footer placement before deleting the existing footer site-wide.

Both components resize only their own element and emit `atelier-layout` with their measured height. This does not replace correct saved Wix element and containing-section reservations. Measure/record desktop and mobile content heights and reserve the native containing sections accordingly before publishing. The header's expanded mobile menu also needs a flow/overlap check.

## Deployment gate

1. Repair Wix source connection under the approved organization; clone its generated source and read its instructions/configuration. Confirm the site ID and preserve existing page/master code.
2. Inventory routes, shared header exceptions, all original menu destinations, cart behavior, footer newsletter, SEO markup, page metadata, and dependencies. The homepage currently has a native contact form and the shared footer has a newsletter form: preserve their functionality in the replacement using supported Wix integrations before deleting them. Mail links alone are not equivalent.
3. Copy the prepared canonical components to the connected site's Public/custom-elements source, preserving the required directory conventions of that repository. Add appropriate `$w` event handlers and matching `seoMarkup` for essential content.
4. Place the two elements through the supported Editor UI. Set exact tags and file sources, stretch appropriately, reserve section/element height on desktop/mobile. Keep the existing public release working while staging.
5. Add the canonical controller twice in Head / Essential: initial load once, and per navigation. Install its generated packet entries Head / Essential / load once. They contain definitions only. Explicitly record every production route; all shared-header routes use navbar, homepage uses home, other page UI stays native.
6. Review source/packet hashes and settings with explicit site targeting and dry-run receipts. Publish a synchronized site source/UI release, then verify initial load, internal navigation, cart, menu, forms, hero/slider geometry, desktop/mobile, content, metadata, and SEO.
7. Remove replaced native visual children/sections after dependencies and equivalent functionality are confirmed. Retire prototype root-injection snippets and CSS header/footer overrides. Preserve recoverable source and Wix history outside the live layout.

No homepage promotion, legacy removal, new global snippets, or shared-header publication has happened in this migration yet. Only the editor's Dev Mode was enabled while inspecting the existing connection.
