# Les tissus — masonry browser

Target `--site atelier-harmonie`, `/les-tissus`; connected source `weareheadless/atelier-harmonie`, commit `4d71377`; startup `atelier-production-20261018-v22`.

## Human placement

1. Replace the original editorial introduction and six long fabric-house sections with one full-width Wix section + Custom Element. Keep the existing native contact section/form (including Mathilde photo, contact details, submission bindings and confirmation), shared header and footer.
2. Velo source `public/custom-elements/atelier-fabrics-v1.js`; tag `atelier-fabrics-v1`; requested ID `customElement12`. Tell the agent if Wix assigns another ID.
3. Zero section padding/no restrictive maximum width. Start approximately **2,300 px desktop / 2,700 px mobile** for element AND section, then fit actual loaded image geometry in Preview. Estimates, not verified saved Wix sizes. Component height reporting does not resize the containing Wix section.
4. Preview desktop/mobile, fresh loads and navigation: all six houses, masonry image layout, photo/Discover buttons, full descriptions, Close/Escape/focus return, external website links and `/devis` links. Native contact form remains separate and functional. No form submission sent.
5. Publish the current saved Editor layout once ready; never CLI-publish stale local UI state.

## Design and preservation

- Existing original title, introduction, all six house descriptions including “Idéal pour” paragraphs, all six original external destinations and original fabric photographs retained.
- Compact cream hero and genuine shortest-column masonry (three desktop/two mobile columns, one narrow screen column). Natural image proportions; thin beige boxes and ivory captions, no forced fixed-size photo frames or numbered filler labels.
- House details use native modal dialogs: keyboard focus remains in the dialog; Close/Escape returns focus to the opener. Full copy is in component/SEO source, not fetched from third parties. Original external links open a labelled new tab with noopener/noreferrer.
- No commerce/CMS/form backend changes. No invented editor collections, product availability or brand suitability filters.
- Below-fold photos load lazily; hero is preloaded only on `/les-tissus` with the identical displayed URL. Matching route registration, shared header/footer and ordinary source fallback installed with synchronized initial/per-navigation controllers.
- Publication, saved desktop/mobile geometry and live content/interaction inspection remain pending human placement. Build completed; no tests/performance audits run or scores claimed.
- Private startup receipt/snapshot recovery: restore prior HTML or disable affected custom-code entries, keeping component source fallback synchronized. Customer state files remain out of Git.
