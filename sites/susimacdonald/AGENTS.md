# Susi Macdonald bridge

- Selected customer alias: `susimacdonald`; verified Wix dashboard site ID `878460ca-c98c-402b-8a10-862023f67cce`, name SusiMacDonald. Always use `--site susimacdonald`, this manifest and this site's isolated state/credentials.
- Our installed bridge app and documented APIs are the deployment path; the Wix plugin is not required. Never reuse Atelier's app installation, credentials, IDs, tags, source or release state.
- Existing source of record: the **connected** `weareheadless/susimacdonald-wix` repository. The older `weareheadless/susimacdonald-rentals` repository is archive and reference only; it must not hold a second copy of a component or any packet. Read `DEPLOYMENT.md` in this folder before any page, packet or publish work — it is the runbook and it wins over older notes.
- Read the rentals archive only for history: its AGENTS.md, README.md, ARCHITECTURE.md, PROJECT_PLAN.md and `docs/` ledger. Preserve existing Wix navbar/footer, custom elements, CMS datasets/filters/sort and approved design. Public page data stays read-only. No parallel CMS store or queries.
- Human creates the Wix page and places/sizes the custom element on it. Everything after that — component, page code, packets, page title/description and the API publish — is the agent's job. There is no mount in a delivery.
- This request authorizes bridge connection only, not page redesign, publishing, data changes or replacing existing startup code. Inventory live embeds and map exact IDs/scopes before any later mutation. Both existing initial and navigation controllers must remain synchronized with their packets and normal source when a future source release is authorized.
- Human handles Wix Editor placement, sizing and section cleanup when a layout change is genuinely needed, and creates a missing page. Agents do not operate Editor UI and never publish a stale local layout snapshot; API publish of the saved revision is the agent's step (see Publishing below).
- New app needs only `SCOPE.EDITOR.MANAGE_CUSTOM_EMBEDS` (plus Wix's forced basic app-instance access). The human explicitly approved creation, this scope, installation and the final Wix terms agreement; installation and own-app API access are now verified. Do not inherit Atelier translation scopes.

## Building a page: the sequence

Read this before writing code for a new page. Step 1 is a human step and is not
optional: the page is measured against its siblings, and an element that is not
placed and sized cannot pass no matter what the code does.

1. **Placement (human).** A published Wix page at the route, with the custom
   element on it and the element **and its section** sized for desktop and
   mobile. Ask for the Wix element id (`comp-…`) and section id; record them.
   A page with no saved height shifts when the element renders.
2. **Component (agent).** Light DOM, one source, bilingual in the same file,
   `/* global __CC_LOCALE__ */` at the top, images from Wix Media requested as
   `.jpg` with `srcset`/`sizes` for the real slot.
3. **Page code (agent).** Bind the recorded Wix element id and relay
   `section-resize` to its height, as the other city pages do.
4. **Packets (agent).** One entry per locale per chunk, route-guarded,
   load-once off, under 13,500 characters. They register the element and emit
   the hero `<link rel=preload>`, nothing else: no hiding `#SITE_PAGES`, no
   placeholder, no min-height, no mount.
5. **Deploy (agent).** `susimacdonald-wix/scripts/deploy-city-condos-puerto.mjs`
   is the model: write, disable any retired mount, publish, read hashes back,
   decode the served bundle. Publish after the writes, never during.
6. **Verify (agent).** Served HTML: one `<tag>`, the preload, no mount script,
   no `cc-pm-` style. Rendered: one element, parent inside `#SITE_PAGES`, the
   section at least as tall as the element, footer below, both locales, no
   overflow at 1440 and 390.
7. **Performance gates (agent).** PageSpeed Insights mobile, three runs on the
   same URL: CLS 0, LCP the element's own hero image, no "Improve image
   delivery" opportunity, transfer no larger than a sibling page. Do not use
   Lighthouse on this box for TBT or a score: the machine is shared and reports
   ~30x the real TBT (4,000 ms against PSI's 70 ms on the same page).

Symptoms of the wrong delivery, so they are recognised early:

| Symptom | Cause |
| --- | --- |
| the page visibly reloads | a mount created the element twice, or moved the placed element |
| CLS around 0.7 | the page is built after first paint: mount, hidden `#SITE_PAGES`, unsized section |
| element placed but no metric moved | the retired mount is still live and relocating it |
| 2 MB of images | 560 px files in 134 px slots, or a PNG served as PNG |
| LCP 6 s with a 3 s FCP | the hero is a CSS background, or the element is not in the parsed HTML |

## Mexican Spanish

- User authorized translating the Susi website into Mexican Spanish and explicitly approved adding Read Translation Content and Write Translation Content to this site's own bridge app. These scopes are not yet saved/installed; last actual translation-content probe returned HTTP 403.
- Translate directly without using Wix machine-translation credits or buying credits. Use Mexican vocabulary (renta, recámaras, colonia, financiamiento), preserve Susi MacDonald, place names, prices, measurements, links and legal meaning. Do not change language visibility without explicit launch authorization.
- Prepared `production/i18n/es-MX.json` contains 120 directly translated interface/FAQ strings. It is a draft dictionary, not a deployed component or proof of whole-site translation. Native CMS listing copy, native Wix text/SEO and remaining dynamic component content still need inventory and translation.
- Keep source modifications on the selected Susi repository and synchronize ordinary custom-element source with existing early packets and both controllers before any authorized production release. No document-wide translation observer or parallel listing database.

- Follow-up: app v2.0 now confirms both translation scopes; native translation query succeeds without wix-site-id. Verify own installation siteId before app-only requests. Do not repeat the obsolete permissions blocker. Inventory has 921 English-only records; confirm Mexican Spanish target locale before writes.

- User now explicitly authorizes completing and publishing Spanish publicly (18 October 2026). Do not launch an incomplete language. Latest approved scope overrides the historical connection-only/hidden-until-approval notes; preserve English, current saved layout, CMS and ordinary-source/startup synchronization.

- First Wix Git setup is now complete: connected repo `weareheadless/susimacdonald-wix`, canonical VPS checkout `/home/admin/susimacdonald-wix`, initial generated UI version 3267. Exact siteId verified. Historical rentals repo is reference source only; production component/page-code edits now belong in the connected Wix repo. CLI dependencies and authentication work; no release has been published. Latest translation launch authorization remains in force once the whole translation is ready.

## Translation release guardrails (do not repeat these failures)

- Never rebuild or push an early packet from a plain English component source over a packet that already contains Spanish. Check the source for the Spanish dictionary/localizer first. If it is missing, translate the source and commit it before building.
- One source of truth per component: `wix/custom-elements/*.js` in `susimacdonald-rentals` must contain both English and Spanish rendering logic. The packet and the connected Wix repo must be built from that same source. Do not hand-edit a live packet to restore Spanish and then leave the source English.
- Before any publish, verify the live page in both `/` and `/es/` (or the language selector URLs), desktop and mobile, on a fresh load and after internal navigation. Check that the target components are `defined` and that both languages render their own copy.
- Do not run `wix publish --source local` while the Editor is in a different language state than the release you intend to publish, and do not publish stale local UI over the human's saved layout. Ask the human to publish from the Editor when layout or language state is involved.
- Do not report a translation as complete until the live verification proves it. A green packet push or a marker without the visible Spanish copy is not proof.
- If a regression appears, restore the last known-good packet from its receipt first, then fix the canonical source. Never pile a new speculative fix on a broken live state.
- Native Wix header/footer, menus, CMS card fields and listing-detail source are separate translation domains. Do not claim they are translated because embeds are translated, and do not use runtime overlays to fake them.

## Publishing

- Publish a delivery with the bridge API, **after** the five Custom Code writes:
  `publish-site ... --apply`, which calls
  `POST /site-publisher/v1/site/publish` and publishes the site's **saved**
  revision. This is a required, agent-run step, not a human handover.
- Never write packets while a publish is running. A publish takes minutes and
  publishes the revision it started from, so a write that lands during it can be
  replaced by the older snapshot. That is what flipped this page back to an
  unstyled packet. Use `susimacdonald-wix/scripts/deploy-city-condos-puerto.mjs`:
  it writes, publishes, reads the hashes back, decodes the live document and
  repairs if needed.
- **Never run `wix publish`.** That is the CLI publish of the local UI snapshot
  from the connected repository and it has repeatedly replaced the saved Spanish
  state with English. `publish-site` does not send a local snapshot, so the two
  are not interchangeable.
- A publish restores page settings from the saved revision. `publish-site` reads
  every page's own title and description first, publishes, then writes those
  tags back. Do not skip that and do not "fix" it with a manual editor publish.

## CMS and listing-data safety

- Never update a Wix Data collection item with a partial `PUT`. `PUT` replaces the item and silently drops fields that are not in the request. Use `PATCH` with `fieldModifications`, or fetch the complete item, save it privately, and send the complete data back.
- Before any raw collection write, snapshot the full item JSON to `.wix-bridge-state/backups/` and record the item ID, collection, before hash and fields being changed. Reading the item after the write is mandatory; compare that the routing, media and system fields still exist.
- Preserve listing routing and integrity fields on every write: `link-recipes-title`, `title`, `title12`, `title2`, `url`, `_publishStatus`, `_publishDate`, `_draftDate`, `address`, `housingType`, `image`, `mediagallery`, `mediaGalleryBottom`. Dropping `link-recipes-title` or `title` breaks the dynamic `/real-estate-listings/...` route and produces a 404.
- Prefer the translation-content API for Spanish listing copy. The raw collection is the English source. Do not overwrite English source fields just to change a translation.
- A price is not one field. Check `price`, `priceRange`, `shortDescription1`, `metaDescription`, `shortDescription` HTML, `introduction2` and the Spanish translation-content fields. Update every place the old price appears.
- After any listing write, verify the list card, the detail page, and both languages. A card being present is not proof the detail route still works.
- If a dynamic listing route returns 404 after an item write, the routing fields were probably dropped. Restore the full item from the private snapshot first; then re-save/publish the item or site from the Editor so Wix rebuilds the route.
- Blog translation posts created with `translationId` may be stored as separate Spanish posts with a `-1` slug rather than linked language variants. Check `translations` on the English post and the Spanish slug before claiming they are linked.

## Required verification after translation/data changes

- Verify the exact live URL in English and Spanish.
- Verify the page-specific embed marker, component definitions, and visible copy.
- Verify listing cards and their detail pages, not just the collection or the list page.
- Verify mobile width and check for horizontal overflow.
- Record the live URL, language, desktop/mobile result, component status, and any unresolved inconsistency in the receipt or status note.

## MCP rental listing pipeline (repopulate from Google Drive)

- Code lives in `/MCP`, not the bridge checkout. The one-input rental script is `/MCP/scripts/create_rental_listing_from_drive.py`.
- Find the Drive folder for a rental slug in `/MCP/data/mcp_catalog.db`:
  - `developments.drive_url` / `developments.drive_folder_id`
  - `development_drive_mappings` where `is_current = 1`
- Run from `/MCP`, with its `.env` loaded:
  ```bash
  cd /MCP
  set -a; source .env; set +a
  export MCP_TEXT_PROVIDER=openrouter
  export MCP_LLM_TEXT_MODEL=google/gemini-3.1-flash-lite
  python3 scripts/create_rental_listing_from_drive.py '<drive-folder-url>'     --google-maps-url '<optional-maps-url>'
  ```
  The OpenRouter overrides are required because the default Entrim model can return `Invalid model name` and abort Wix content generation.
- The script ingests/extracts the Drive folder, requires one unambiguous monthly rent, then calls `wix_service.sync_development`. It can create/update the live Wix collection item and import galleries, address, map pin, units and text. Record its JSON result (`status`, `monthly_rent`, `fields_written`, `images_imported_or_reused`, `item_id`).
- The Drive source is authoritative for rent. If a human-corrected price differs from the source PDF, fix the Drive document or add a verified DB override BEFORE rerunning; otherwise the pipeline will overwrite the manual price. Example: Olaya 209's source PDF says 25,000 while the approved public price is 22,000.
- After a run, verify the raw item still has `link-recipes-title`, `title`, `url`, `_publishStatus`, galleries and address, then verify both English and Spanish detail URLs return 200 and show images/text.
- Never use a partial `PUT` to adjust the result. Use the pipeline to repopulate, then only targeted translation-content or safe field updates for corrections.
- This pipeline writes Wix listing content; it is not the site publisher. Do not run `wix publish` from the CLI.


## Puerto Morelos condos page (editor-placed element)

`/puerto-morelos-condos-sale` and `/es/puerto-morelos-condos-sale` are delivered
as one custom element placed in the page, not from a page mount.

- Tag `city-condos-puerto`. Source, build script, deploy script and built
  packets are all in the connected repo:
  `src/public/custom-elements/city-condos-puerto-v1.js`,
  `scripts/build-early-packets-pages.mjs`,
  `scripts/deploy-city-condos-puerto.mjs`, `packets/`.
- The element is in the page's server HTML inside section `comp-mwmb8lz3`
  (wrapper `comp-mwmg963v`), so its hero is the LCP element and its height is
  reserved by the section. Do not add a BODY_END mount: a mount has to move the
  element out of that section to survive hydration, which defeats the editor
  geometry, recreates the page after first paint, and put the page back to
  CLS 0.709.
- Four HEAD chunks, all `loadOnce=false`, each guarding its own route. They only
  register the element and emit a `<link rel=preload>` for the hero at parse
  time; they must not hide `#SITE_PAGES` or paint a placeholder. The unsuffixed
  `… — <locale>` entry is chunk 1 of 2.
- `scripts/deploy-city-condos-puerto.mjs` writes the four chunks, disables the
  retired mount entry, publishes, and fails unless the served HTML contains the
  editor element, the preload, and no cover or mount.
- Page code `src/pages/Condos For Sale In Puerto Morelos.qu5lr.js` binds
  `#comp-mwmg963v` and relays `section-resize`.
- The element sets `document.title` and the meta description for its locale.
  The English settings are also written through `seo-tags`; the Spanish ones are
  the editor's, so the rendered-document statement is the current fallback.
- Follow `DEPLOYMENT.md` for rebuild, retry, publish, verification and rollback.
