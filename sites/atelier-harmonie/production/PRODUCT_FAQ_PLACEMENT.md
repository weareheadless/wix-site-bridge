# Product FAQ — separate custom element

Exact target `--site atelier-harmonie`, `/product-page/:slug`, shared Wix Product Page template. Source commit `fde0abb`, installed startup v32.

Place one new full-width section after the product component (which already includes “Nos Nouvelles Créations”) and above the existing native contact section/shared footer:

- Velo file: `public/custom-elements/atelier-product-faq-v1.js`.
- Tag: `atelier-product-faq-v1`.
- Wix element ID: `customElement21`.
- No outer padding; use the component's own cream spacing. Initial element AND containing-section height estimates: 550px desktop / 750px mobile, with enough room for the longest expanded answer. Fit actual content in Preview; these are not measured saved Wix dimensions. Component resize events do not resize the outer Wix section.

Remove the old native FAQ after checking the replacement; preserve the separate native contact form and its behavior. Five original questions/answers are reused verbatim: bulbs, maintenance, delivery, uniqueness and contacting the atelier. All answers start closed, with native keyboard-accessible details/summary and a shared name allowing only one open at a time. No API or form adapter is added. FAQ SEO markup is bound separately; a missing FAQ placement does not block loading the product component.

Startup explicitly covers both product and FAQ components on the exact product route family, with the normal Wix source fallback. Source and startup are separate releases: inspect the private install receipt and manifest mapping before marking installed. Human owns placement, desktop/mobile geometry and current-layout publication. No CLI publish of stale UI revision 740.

Visual inspection remains pending because in-app browser control is disabled in Work settings. Preview the current product with short/long copy, portrait/landscape photos, closed and expanded details/FAQ, and internal product navigation. No automated tests or checkout submissions run.

Installed startup ID `48172cc5-b758-4a53-86bd-f9536dbb16c6`; private receipt hash and HEAD/load-once mapping inspected. Recovery instructions remain in the private receipt. Human placement/visual review/publication pending.
