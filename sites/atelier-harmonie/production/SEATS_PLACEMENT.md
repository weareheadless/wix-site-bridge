# Les sièges — placement

Selected target: `--site atelier-harmonie`, `/sieges`. Source repository `weareheadless/atelier-harmonie`, source commit `a015abe`. Startup release `atelier-production-20261018-v14`.

1. Remove replaced body sections on **Sieges** only; keep the shared header and footer.
2. Add one full-width section with a Custom Element, no inner padding or restrictive max-width.
3. Velo file: `public/custom-elements/atelier-seats-v1.js`.
4. Tag: `atelier-seats-v1`. Requested element ID: `customElement6`. Tell the agent if Wix assigns another ID.
5. Start with approximately **2,700 px desktop / 3,800 px mobile** for element AND section, then fit to actual content in Preview. Estimates are not measured saved Wix geometry. Component height reporting does not resize the containing Wix section.
6. Preview desktop/mobile, fresh load and internal navigation, product links, option selection and add-to-cart. Publish the current saved Editor layout when ready. Never publish the checkout’s stale local UI snapshot.

## Design and preservation

- Original live introduction and restoration paragraphs preserved. Editorial hero uses the original restoration photo; the craft section reuses the original fauteuil photo.
- Warm cream/white, espresso typography, muted rose details, subtle bordered product boxes, natural photo proportions. No forced fixed-height product frames or repeated numbered labels.
- Runtime products/prices/availability come from existing public Wix catalog backend. Seat names are filtered using fauteuil/tabouret/siège/chaise/banc/pouf/cabriolet from the loaded catalog page (currently up to 100 products), not static product records or official Wix collection membership. Future category management should use explicit Wix collection membership if product naming becomes ambiguous.
- Native product pages retain option selection. Simple products use the existing validated Wix currentCart backend. Contact/restoration links use existing routes.
- Hero text renders immediately. `/sieges` has explicit route registration, matching first-image preload, shared header/footer and normal source fallback. All initial/per-navigation controllers and packets synchronized.
- Human placement, saved geometry, publication and live behavior confirmation remain pending. No performance measurements or scores claimed.
- Private receipts/snapshots under customer `.wix-bridge-state/receipts`; restore prior packet/controller HTML or disable relevant Custom Code entries for recovery, keeping Wix source and packets synchronized.
