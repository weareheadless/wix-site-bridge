# Luminaires — human placement

Target: `--site atelier-harmonie`, `/lampes` only. Source repository `weareheadless/atelier-harmonie`, commit `9d5f5f4`. No Editor layout or publication performed by the agent.

1. On **Créations Lumineuses** (`/lampes`), remove the replaced body sections, including the native nouveautés gallery. Preserve shared header `customElement1` and footer `customElement3`.
2. Add one full-width section and one Custom Element, with zero section padding/margins and no restrictive max-width.
3. Choose **Velo file** → `public/custom-elements/atelier-lamps-v1.js`.
4. Tag: `atelier-lamps-v1`. Element ID: `customElement5`. If Wix assigns a different default ID, tell the agent; do not change shared header/footer IDs.
5. Start with element AND containing section height around **5,000 px** desktop/mobile; use Preview to fit the complete content through the final project link, then remove excess bottom space. This is a starting estimate, not verified saved geometry. The component reports its own height but does not alter the Wix containing section.
6. Preview desktop/mobile, category destinations, product carousel arrows/swipe, add-to-cart and product choices. Check fresh loads and navigation from homepage/shop. Publish the current saved Editor layout when ready; never CLI-publish the stale local UI snapshot.

## Content and behavior

- Uses the current live page's five categories and concise wording, not the older cached eight-category version. Existing category photographs are reused at original resolution, without forced cropping.
- Upcycling image and button both link to `/lampes/lampes-upcycling`; the former image incorrectly linked to abat-jours.
- Native dynamic category pages remain in Wix; this change replaces only `/lampes`.
- Nouveautés use the existing public Wix backend catalog, sorted by last update, with a lighting-name filter and up to 12 results from the loaded catalog page. This is not a new CMS store or an official Wix collection filter. Product options use native product pages; simple products use the existing validated currentCart endpoint.
- Static heading/text render immediately. Only the actual first hero image is preloaded on `/lampes`, matching its displayed URL. Below-fold images load lazily. Source fallback and synchronized initial/per-navigation controllers cover this route.
- Startup release `atelier-production-20261018-v9`. Startup receipt/snapshots are private under the customer state directory. Restore the prior packet/controller snapshots or disable the relevant Custom Code entries to recover; keep source and packet versions synchronized.
- Placement, publication and live content verification remain pending the human's setup. No performance score claimed.
