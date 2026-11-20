# À propos — Mathilde

Target `--site atelier-harmonie`, `/a-propos`; source `weareheadless/atelier-harmonie`
commit `81055c8`, startup `atelier-performance-20261120-v59-about-qui-suis-je`.

Replace old editorial story sections with one full-width Custom Element; preserve shared header/footer and native contact section/form below.
- Velo file `src/public/custom-elements/atelier-about-v1.js`
- Tag `atelier-about-v1`
- Requested ID `customElement15`; tell agent if assigned differently.

Zero section padding/restrictive max-width. Start around 2,000px desktop / 3,000px mobile for element AND containing section, then fit actual image/text content in Preview. Estimates, not verified saved geometry; custom element height does not resize Wix section.

Design: original Mathilde portrait leads the page, original story grouped into introduction/craft/responsibility, original restored-chair photo retained, cream/white/rose editorial theme. Original full paragraphs and social/Ecomaison destinations preserved. Kit CTA corrected to known native product `/product-page/kit-diy-ma-lampe-%C3%A0-poser` instead of the original general lamps category. No new form, CRM or catalog.

Hero text immediate, matching route-specific first-image preload, remaining photo lazy, source fallback and shared header/footer kept. Explicit /a-propos route startup synchronized; no component snippets injected into native DOM.

Preview desktop/mobile, fresh/internal navigation, full copy, photographs, native contact visibility and destinations before publishing saved current Editor layout. No tests/performance audit or live placement confirmation performed. Never CLI-publish stale UI snapshot. Private receipts and before-snapshots support restore/disable recovery with matching source fallback.

## Story section v59 — “Qui suis-je”

The retired story block (“Des pièces qui racontent une histoire”) is replaced by
Mathilde's own introduction: three paragraphs, then a two-column savoir-faire
block (Côté tapisserie / Côté luminaire), the atelier and Côte d'Albâtre
paragraphs, and the closing “Choisir l'Atelier de l'harmonie…” line. The
restored-chair photograph, portrait hero, values block, kit CTA, native contact
form and social/Ecomaison destinations are unchanged.

- French is the authored copy; every new string has an English dictionary entry
  in the same component. No Wix machine translation is used.
- Typographic fixes applied to the supplied text: “abat-jours” (not
  “abats-jour”), “sièges” plural in “la restauration de sièges”, and French
  spacing before `?` and `:`.
- Release was narrow: `scripts/release-startup.mjs --site atelier-harmonie
  --key about` rewrites `Atelier production early-packet-about-1.html` plus both
  Head controllers and leaves the other 40 live entries untouched.
- `src/public/atelier-about-seo.js` carries the crawlable static markup for
  `#customElement15` (page code `src/pages/A PROPOS.yn9k9.js` assigns
  `seoMarkup`), so both languages were updated there too.

### Story photograph

The mid-page figure uses the restored chaise longue
(`bae3ac_73bd8ccdef024c81822f7376d980b682~mv2.jpeg`), landscape 4:3, replacing
the two armchairs photo, in both the component and its crawlable markup. The
photograph beside the native contact form is a Wix image element in the native
section; it is not part of this element and can only be swapped in the Editor.

### Known gap: stale SSR/SEO markup

The rendered element and the early packet are current on `/a-propos` and
`/en/a-propos`. The `seoMarkup` payload that Wix serves in the initial HTML is
still the pre-v59 story: it is captured from the published Velo code, and a
Site Publisher publish has not refreshed it after the source push. The same
staleness exists on other pages (for example `/sieges`, whose captured markup
opens with the shared footer), so this is site-wide drift, not a v59 regression.
Refreshing it needs a code publish of the site's own revision; `wix publish` is
not used because it publishes the local UI snapshot.
