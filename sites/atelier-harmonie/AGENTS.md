# Atelier de l’harmonie

- Exact target: `--site atelier-harmonie`, site ID `376faa89-fe6c-4ae8-8feb-10520e813a89`, manifest `sites/atelier-harmonie/site.manifest.json`.
- Follow the root `AGENTS.md` and `docs/GLOBAL_EARLY_REGISTRATION.md`. The mandatory global startup gate applies before production promotion.
- Preserve the approved new design, Atelier's original logo and copy, handwritten wordmark and Saint-Pierre-en-Port / Normandie signature, white/cream backgrounds, muted rose/blue details, six category illustrations, fixed-height hero slider and compact collection/product carousels. Prefer “tissus”, not “étoffes”.
- The live hidden test route is `/copy-of-accueil`; prototype snippets remain exact-route guarded. Production promotion to `/` and shared navbar replacement are authorized, but must satisfy the startup/placement/behavior gate before publication and removal of legacy content.
- Read `production/PLACEMENT.md` and `production/build-manifest.json` for current staging status. Files being generated does not mean they were installed or published.
- One real custom navbar element belongs in Wix's shared header; one homepage content element goes below. Remove replaced legacy visual children after preserving original navigation destinations, cart, mobile behavior, forms, SEO, and dependencies. Never ship the prototype's hidden duplicate shell or broad document observers as production architecture.
- `weareheadless/atelier-harmonie-headless` is a separate Next.js/Payload project. Do not alter or deploy it for this Wix migration.
- Existing historical receipts/snapshots remain in the root private `.wix-bridge-state/`; preserve their recovery path. New prototype releases explicitly use `sites/atelier-harmonie/.wix-bridge-state/`; local assembly files go in ignored `.build/`. Keep all credentials and state out of Git.
- Run customer scripts from the repository root. Build commands require explicit `--site atelier-harmonie`; release helpers must reject any different alias/site ID. Review dry-runs and receipts.

## Confirmed shared placement workflow

- Do not interact with Wix Editor UI. The human owns placement and removal of native sections.
- Human confirmed these Wix Custom Element IDs: shared header `customElement1` → `atelier-navbar-v1`; homepage section `customElement2` → `atelier-home-v1`; shared footer `customElement3` → `atelier-footer-v1`.
- Build footer separately from homepage content. Never duplicate its markup inside the homepage component.
- Source selection is Velo file in `src/public/custom-elements/`, with matching file basename and tag. Existing placements receive future source changes without recreation.
- The checkout's old UI revision 740 predates the human's latest placement; never publish that snapshot over their work.

- Fragment scripts may declare their own `root`; production conversion must use the distinct `componentRoot` name for shadow-root lookup. A collision prevents all following interactions and review loading.
- Load prototype webfont stylesheets once in the document head from the component source. Font-face definitions inside shadow-root imports do not provide the same font availability as the prototype.

## Shop component

- `/shop`: `atelier-shop-v1.js`, tag `atelier-shop-v1`, requested Wix ID `customElement4` (human must confirm placement). Shared header/footer stay separate.
- Original shop introduction and philosophy copy must stay intact. Products, stock, prices and discounts come from public Wix `Stores/Products` through `backend/atelier-shop.web.js`; never embed a parallel catalog snapshot in production.
- Native Wix currentCart handles add-to-cart. Products requiring options/custom text open their existing product page. Never accept client-provided prices, arbitrary catalog apps or quantities in the cart endpoint.
- `production/SHOP_PLACEMENT.md` is the human setup checklist. Do not operate Wix Editor or publish the stale local layout.

## Luminaires page

- `/lampes`: `atelier-lamps-v1.js`, tag `atelier-lamps-v1`, requested ID `customElement5`. Human placement pending; see `production/LAMPS_PLACEMENT.md`.
- Reuse the current live page’s five category descriptions and native `/lampes/<category>` destinations. Preserve dynamic Wix category pages and shared header/footer.
- Latest creations reuse the existing live backend/cart service; name-based lighting filtering is presentation logic, not a parallel CMS or Wix collection membership.

- Luminaires gallery uses measured masonry with unequal column widths and natural photo proportions. Do not restore numbered category labels or repeated “L’art de la lumière” text.

## Seats page

- `/sieges`: source `atelier-seats-v1.js`, tag `atelier-seats-v1`, requested ID `customElement6`; human placement pending. See `production/SEATS_PLACEMENT.md`.
- Preserve original introduction/restoration copy, existing photos and Wix runtime catalog/cart. Use natural photo proportions and subtle ivory product boxes.

## Objets déco page

- `/objets-deco`: `atelier-deco-v1.js`, tag `atelier-deco-v1`, requested ID `customElement7`; human placement pending. See `production/DECO_PLACEMENT.md`.
- Preserve original cushion photo and original intro/cushion copy. Original page currently has no products: keep an honest empty state, never invent catalog entries.

## Gift card page

- `/gift-card` uses two editorial custom elements around the **retained real Wix Gift Cards app**. Intro: `atelier-gift-intro-v1.js`, tag `atelier-gift-intro-v1`, ID `customElement8`; guide: `atelier-gift-guide-v1.js`, tag `atelier-gift-guide-v1`, ID `customElement9`. Human placement pending; see `production/GIFT_PLACEMENT.md`.
- Never replace native gift-card purchase/issuance with a fake product, copied session call or custom money form. Keep amounts, checkout, delivery and redemption managed by Wix. Native app styling uses human Settings/Design only, without selectors targeting its internals.

## Restoration / bespoke services

- `/tapisserie-restauration`: source `atelier-restoration-v1.js`, tag `atelier-restoration-v1`, requested ID `customElement10`; human placement pending. See `production/RESTORATION_PLACEMENT.md`.
- Preserve original complete copy and distinct images, combined before/after intact, service shortcuts and native accessible cushion details. No fabricated comparison slider or numbered labels.
- User cancelled integrated contact mapping. Keep contact entirely in native Wix below the restoration embed; no embedded contact section, custom form or adapter. Do not restore the abandoned mapping configuration. See RESTORATION_PLACEMENT.md.

- Separate presentational contact intro is now available on `/tapisserie-restauration`: `atelier-contact-v1.js`, tag `atelier-contact-v1`, requested ID `customElement11`, placed above real native Wix form. No custom submission fields/adapter; see `production/CONTACT_PLACEMENT.md`.

- Restoration now uses shared-hero Sièges / Abat-jour / Coussins tabs, Sièges initially active; keyboard accessible, mobile no horizontal tab scrolling. Preserve original full copy/images, inactive-panel inert state and stable panel geometry. Contact remains separate below.

## Fabrics

- `/les-tissus`: `atelier-fabrics-v1.js`, tag `atelier-fabrics-v1`, requested ID `customElement12`; see `production/FABRICS_PLACEMENT.md`.
- Six original fabric houses use shortest-column photo masonry and accessible native detail dialogs instead of long stacked paragraphs. Preserve original full descriptions/photos/external links, natural image proportions and keyboard focus return. No invented brand classifications or duplicate contact form. Keep native contact section below.

## Professional projects

- `/b2b`: `atelier-b2b-v1.js`, tag `atelier-b2b-v1`, requested ID `customElement13`; see `production/B2B_PLACEMENT.md`.
- Original audience text uses accessible tabs; Villa du Clos Normand project precedes compact expandable guarantees. Preserve original photos, logos, project deliverables/external link and RSE/technical copy without adding new claims. Keep native contact section/form below; no custom submission adapter.

- B2B photo attribution correction: all professional project photographs show Villa du Clos Normand. Never label the lampshade series as a separate restaurant project. Current project layout is one contained card: stable portrait gallery on the left, enlarged Villa illustration and readable story/deliverables on the right, heading above. Desktop preview visually reviewed. Do not restore the scattered centred gallery or crowded mosaic.

## Workshops

- `/les-ateliers`, published page ID `ntpl0`: `atelier-workshops-v1.js`, tag `atelier-workshops-v1`, requested ID `customElement14`; see `production/WORKSHOPS_PLACEMENT.md`.
- Three workshop tabs reuse original article photographs/descriptions. Reservations use the exact three external Wecandoo URLs recovered from original article embed; never replace booking buttons with email or invent dates/prices/availability.
- Shared desktop/mobile navbar and homepage workshop destinations point to `/les-ateliers`. Keep original article intact; promotional bar is a separate implementation.
