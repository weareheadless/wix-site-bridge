# Shared navbar — live basket count

Target `--site atelier-harmonie`, existing shared `customElement1` / `atelier-navbar-v1`. Source `e0e2b53`; startup v47. No new element IDs or Editor placement needed.

Desktop Panier button and mobile-menu Mon panier button include a small muted-blue numeric badge. It sums Wix cart line-item quantities, not distinct product rows. Known empty cart displays 0; a failed/unavailable cart read hides the number instead of inventing state. Only the numeric total is passed to the custom element; no cart/customer data is logged or persisted.

Shared masterPage uses documented universal `wix-ecom-backend.currentCart.getCurrentCart()` and `wix-ecom-frontend.onCartChange()`. Initial load and component-ready events cover either initialization order. Concurrent reads are coalesced with a queued refresh. Native cart UI changes and existing custom add-to-cart flows calling refreshCart trigger updates. Cart button still navigates through navigateToCartPage. No polling, parallel cart store, checkout override, stock mutation or additional permissions.

Canonical source helper: `navbar/cart.js`. Generated navbar source, SEO markup and startup packet remain synchronized. All-page early controllers retain shared header route coverage. Cart reads do not gate initial logo/menu paint. Other shared header/footer behavior remains intact.

Human publishes current saved Wix layout/source to deploy masterPage binding, then previews initial count, add/remove/quantity changes, internal navigation and mobile menu. Live cart behavior not exercised; no tests or cart mutations run. Never CLI-publish stale UI revision 740. Recovery uses private startup receipt/before snapshots plus ordinary source fallback/revert.
