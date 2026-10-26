# Distinct homepage product carousels

Target `--site atelier-harmonie`, `/`, existing `customElement2` / `atelier-home-v1`. Source `9fa081f`, startup v42. No new placement IDs.

- First product rail (Collections): Abat-jour / Suspensions / Baladeuses; Abat-jour selected initially.
- Second product rail (Boutique): Lampes à poser / Les sièges / Objets déco / Kits DIY; table lamps selected initially.
- Categories are disjoint presentation groups, not Wix CMS collection membership. Matching uses normalized live product names with explicit DIY/baladeuse/suspension/abat-jour/lamp/seat precedence. Unclassified items appear as décor. Do not label this logic as authoritative Wix product-category assignment.
- Each rail displays up to 12 actual catalog products in existing catalog order, retains current Wix prices and explicit Disponible/Épuisé labels, and keeps product URLs linked to the native product route. No static product-card selection is retained in the rendered rails after initialization.
- Filters use native keyboard-accessible buttons with aria-pressed; they wrap on mobile and reset that rail's scroll position. Existing rail arrows/scroll cues are retained and receive a scroll update after repaint. Empty categories are honest empty states, not filled with products from the other rail.
- Homepage page code pages the established getAtelierProducts feed to completion; hero/copy render independently. Handshake covers either component/Velo initialization order; one direct load also avoids relying on the request event. It does not create a parallel catalog or inventory store.

Source and startup packets are synchronized; human publishes current saved Wix layout/page code and confirms filters, category counts/empty states, card availability and both rail controls on desktop/mobile. No automated tests or live browser inspection performed. No stale UI CLI publish. Private receipts/before snapshots retain recovery instructions and normal source fallback.
