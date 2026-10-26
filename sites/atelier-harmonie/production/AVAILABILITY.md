# Product availability on cards

Target `--site atelier-harmonie`; source `weareheadless/atelier-harmonie` commit `2e27a1f`; startup v41. No new Wix placements or element IDs.

- Homepage: original curated product cards in Boutique and Collections are matched by exact product URL slug to read-only public Wix Stores/Products through the existing `getAtelierProducts` feed. Cards with `inStock:false` show an ivory/rose “Épuisé” badge over the photograph; in-stock homepage cards explicitly show “Disponible” in muted blue. Prices on curated shop cards are refreshed from that same live result. The established catalog feed validates pagination; it is paged only until all requested products are found or the catalog ends, without suppressed permissions or hidden-product flags. No parallel stock snapshot.
- While awaiting data, the homepage displays “Disponibilité…”; unknown/missing products or lookup failures show “Statut indisponible”, never an invented in-stock/sold-out claim. Exact URL slugs must match the live catalog; outdated links need separate content correction rather than guessing availability.
- Shop: existing sold-out badge wording unified as “Épuisé”. Native live catalog/cart service retained.
- Lamps, seats and deco carousels: sold-out product photograph gets “Épuisé”; CTA becomes “Épuisé — voir la pièce”. Sold-out products stay viewable, but are not offered an add-to-cart action.
- Product recommendations: “Épuisé” badge comes from the same live getAtelierProducts result.

Homepage uses a readiness/request handshake so registration before or after page-code binding works. Stock loads independently of hero copy/paint. Existing backend/cart validates final stock; badges are a page-load presentation, not a stock reservation or guarantee against concurrent purchases. No polling or database mutation added.

Normal source fallback, generated packets and both global controllers are synchronized. Human publishes the current saved Wix layout to deploy the new homepage binding/backend and component sources. Do not CLI-publish stale UI revision 740. Inspect both homepage carousels, shop/category cards and recommendations on desktop/mobile and internal navigation, including known sold-out and available examples. Live visual behavior remains unverified; no tests or cart writes run.

Recovery: private startup receipts/before snapshots retain restoration instructions; normal source fallback can be reverted to the preceding site-specific commit.

## Lookup correction

The separate hasSome slug lookup was removed after the human reported unresolved status. Homepage now reuses the existing shop catalog feed and matches normalized authoritative slugs and canonical product-page URLs. A known in-stock product gets the actual “Disponible” label, not a hidden badge containing fallback wording. Missing catalog matches remain explicitly unknown; never invent stock for an outdated product URL. Actual rendered status remains pending human publication/confirmation.

## Current homepage rails

Homepage now renders live product cards directly, with disjoint category filters, rather than matching the old curated cards. Availability and prices come from each live record; see HOME_FILTERS.md. Previous curated-slug matching notes describe the retired implementation.
