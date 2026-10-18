# Shop redesign — prepared for human placement

Site: `--site atelier-harmonie`, `376faa89-fe6c-4ae8-8feb-10520e813a89`; route `/shop`.

## Wix setup (human)

1. Save the current page in Wix history before replacing it. Remove the old shop introduction, native product gallery and philosophy sections only on BOUTIQUE. Keep the shared header/footer and existing product pages.
2. Add a fresh Wix section and a **Custom Element** (not an HTML iframe).
3. In Properties, set the element ID to `customElement4`.
4. Choose Source → Velo file → `atelier-shop-v1.js`; tag `atelier-shop-v1`.
5. Stretch full width with zero side margins. Start the element at the top of its section. Reserve the element AND containing section height in desktop/mobile views. The whole shop body is inside this component; do not add another copy of the header/footer.
6. Preview with live catalog data before publishing. Check the last philosophy section is visible and the footer follows without clipping/large blank gaps. Filters and catalog pagination can change the content height; adjust the saved parent geometry based on the actual catalog and breakpoint. No automatic Wix parent-section resizing is claimed.
7. Confirm desktop/mobile content, internal navigation, search/filter/sort, discounted/out-of-stock products and native cart/product options before publication. Publish the current saved Editor layout, never the stale local checkout layout.

## Code delivered

- Connected deployment repository: `weareheadless/atelier-harmonie`, source revision `bb5c888`.
- `src/public/custom-elements/atelier-shop-v1.js`: separate shop component, no catalog snapshot.
- `src/pages/BOUTIQUE.uafgz.js`: binds `#customElement4`, loads public live Wix catalog pages, assigns equivalent SEO markup and handles native cart actions.
- `src/backend/atelier-shop.web.js`: documented public Stores/Products query and currentCart integration. Hidden products are not requested and permissions are not suppressed. Cart accepts only a public, in-stock product ID with no required options, fixes quantity to one, and lets Wix calculate price/inventory.
- `src/public/atelier-shop-seo.js`: equivalent static introductory/philosophy content. Loaded product links/prices are appended through the documented seoMarkup property.
- Shared navbar/footer remain independent. The shop component never hides or replaces Wix shell elements.
- Startup release `atelier-production-20261018-v6`: `/shop` gets the shop definition; other routes do not execute its packet. No hero-image preload on shop because the introduction is text only. Navbar/footer still use the existing global registry.

## Design and original content

Retains “La petite boutique de l'atelier”, “Des créations artisanales uniques et colorées”, both original introductory paragraphs and the entire “Plus que des Objets, une Philosophie” copy. Uses the approved homepage fonts, espresso text, cream/white surfaces, muted rose/blue details, generous spacing and product photography. Adds searchable/type-filtered product grid, price/name sorting, alternate-image hover, live discounts/stock and load more.

Product types are presentation filters inferred from existing product names (not a replacement for Wix collections). Products with variants/options/custom text stay on their original Wix product page for selection. Runtime catalog records stay entirely in Wix.

## Release status

Source and startup definitions prepared/pushed. Human placement, current-layout publication and live behavior checks are pending. No tests, performance audits, shop publication or Editor mutation were performed for this redesign.
