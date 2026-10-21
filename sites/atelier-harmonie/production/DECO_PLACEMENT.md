# Objets déco — placement

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target: `--site atelier-harmonie`, `/objets-deco`. Source repository `weareheadless/atelier-harmonie`, source commit `49b23bb`. Startup release `atelier-production-20261018-v15`.

1. Remove replaced body sections on **Objets Déco** only; retain shared header/footer.
2. Add one full-width section with a Custom Element, zero inner padding and no restrictive maximum width.
3. Velo file: `public/custom-elements/atelier-deco-v1.js`.
4. Tag: `atelier-deco-v1`. Requested element ID: `customElement7`; tell the agent if Wix assigns another ID.
5. Verify automatic sizing in desktop/mobile Preview.
6. Preview desktop/mobile, fresh load and internal navigation, original copy, image and links. Publish the current saved Wix layout when ready. Never CLI-publish the checkout's stale UI snapshot.

## Content and data

- Original introductory and cushion paragraphs and original cushion photo retained. Cream/white editorial layout, warm typography, subtle borders and natural photo proportions. No fake products: original live page currently says there are no articles.
- Existing public Wix backend supplies stock/prices and validated native currentCart. Presentation filters names for coussin/accessoire/vide-poche/pochette/trousse/panier/corbeille/déco/guirlande in the loaded catalog page (up to 100 products). This is not official Wix category membership. Review collection bindings if future naming becomes ambiguous; never add a parallel catalog.
- Empty state is explicit and links to the real shop. Native product pages preserve option selection.
- Original hero copy renders immediately; only this route's actual first image is preloaded with matching displayed URL. Shared header/footer, route registry, initial/per-navigation controllers and ordinary source fallback synchronized.
- Placement, saved geometry, publication and live content verification remain pending human setup. No performance scores claimed.
- Private receipts/snapshots remain in customer `.wix-bridge-state/receipts`; restore prior startup HTML or disable matching entries for recovery, synchronizing source and packets.
