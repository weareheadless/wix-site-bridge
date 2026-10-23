# Journal — editorial sections around native Wix Blog

Target `--site atelier-harmonie`, exact route `/blog`; connected source `weareheadless/atelier-harmonie`, commit `dfd2803`; startup `atelier-production-20261018-v30`.

Page order:
1. Shared header retained.
2. Full-width intro: Velo file `public/custom-elements/atelier-journal-top-v1.js`, tag `atelier-journal-top-v1`, ID `customElement18`.
3. **Retain native Wix Blog feed**, its posts, categories, pagination, member/comment settings and existing article destinations.
4. Full-width closing: Velo file `public/custom-elements/atelier-journal-bottom-v1.js`, tag `atelier-journal-bottom-v1`, ID `customElement19`.
5. Shared footer retained.

Remove only replaced old introduction. Use zero outer section padding; no restrictive max-width. Initial element AND containing section height estimates: top 500px desktop / 700px mobile; bottom 450px desktop / 650px mobile. Fit actual text in Preview; these are not saved measured Wix geometry. Component height events do not resize the parent section. Tell agent if IDs differ.

Original two introduction paragraphs retained. Cream/white editorial composition, restrained rose details and readable typography follow the homepage. Closing links to Les Ateliers, Devis and À propos. No parallel post store or private Blog selectors; native feed design changes remain human Editor settings.

Explicit /blog registration covers both components with synchronized initial/per-navigation Head controllers, guarded packets and normal source fallback. No hero image or preload added. Source and startup installed; placement and publication pending. Preview desktop/mobile, fresh/internal navigation, article links and native pagination before publishing the current saved Editor layout. Never CLI-publish stale UI revision 740.

Recovery: private startup receipt and before-snapshot HTML allow restoration or disabling affected startup entries; normal Wix source fallback remains synchronized.
