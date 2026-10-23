# Luminaires — human placement

Target: `--site atelier-harmonie`, `/lampes` only. Source repository `weareheadless/atelier-harmonie`, commit `b7b29b3`. No Editor layout or publication performed by the agent.

1. On **Créations Lumineuses** (`/lampes`), remove the replaced body sections, including the native nouveautés gallery. Preserve shared header `customElement1` and footer `customElement3`.
2. Add one full-width section and one Custom Element, with zero section padding/margins and no restrictive max-width.
3. Choose **Velo file** → `public/custom-elements/atelier-lamps-v1.js`.
4. Tag: `atelier-lamps-v1`. Element ID: `customElement5`. If Wix assigns a different default ID, tell the agent; do not change shared header/footer IDs.
5. Start with element AND containing section height around **3,000 px** desktop and **3,300 px** mobile; use Preview to fit the complete content through the final project link, then remove excess bottom space. This is a starting estimate, not verified saved geometry. The component reports its own height but does not alter the Wix containing section.
6. Preview desktop/mobile, category destinations, product carousel arrows/swipe, add-to-cart and product choices. Check fresh loads and navigation from homepage/shop. Publish the current saved Editor layout when ready; never CLI-publish the stale local UI snapshot.

## Content and behavior

- Uses the current live page's five categories and concise wording, not the older cached eight-category version. Existing category photographs are reused at original resolution, without forced cropping.
- Upcycling image and button both link to `/lampes/lampes-upcycling`; the former image incorrectly linked to abat-jours.
- Native dynamic category pages remain in Wix; this change replaces only `/lampes`.
- Nouveautés use the existing public Wix backend catalog, sorted by last update, with a lighting-name filter and up to 12 results from the loaded catalog page. This is not a new CMS store or an official Wix collection filter. Product options use native product pages; simple products use the existing validated currentCart endpoint.
- Static heading/text render immediately. Only the actual first hero image is preloaded on `/lampes`, matching its displayed URL. Below-fold images load lazily. Source fallback and synchronized initial/per-navigation controllers cover this route.
- Startup release `atelier-production-20261018-v10`. Startup receipt/snapshots are private under the customer state directory. Restore the prior packet/controller snapshots or disable the relevant Custom Code entries to recover; keep source and packet versions synchronized.
- Placement, publication and live content verification remain pending the human's setup. No performance score claimed.

## Mosaic update

Five category photographs now use natural proportions in three desktop columns / two mobile columns, with descriptions immediately underneath. The project invitation is the sixth mosaic tile. Existing element ID and tag are unchanged. Reduce the formerly tall containing Wix section to fit the shorter content; the component cannot change saved Wix section geometry. Live browser inspection still showed v9 after source push, so publication of the current saved Editor layout is required before claiming the mosaic is live.

## Masonry revision

Source `e4f83ed`, startup `atelier-production-20261018-v11`: measured shortest-column packing with unequal desktop column widths, two mobile columns, and natural image proportions. Removed all numbered labels. Existing element/tag unchanged; saved Wix section size remains human-controlled. Preview/publish current layout before confirming live appearance.
