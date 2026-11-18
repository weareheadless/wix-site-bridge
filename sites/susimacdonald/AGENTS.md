# Susi Macdonald bridge

- Selected customer alias: `susimacdonald`; verified Wix dashboard site ID `878460ca-c98c-402b-8a10-862023f67cce`, name SusiMacDonald. Always use `--site susimacdonald`, this manifest and this site's isolated state/credentials.
- Our installed bridge app and documented APIs are the deployment path; the Wix plugin is not required. Never reuse Atelier's app installation, credentials, IDs, tags, source or release state.
- Existing source of record: the **connected** `weareheadless/susimacdonald-wix` repository. The older `weareheadless/susimacdonald-rentals` repository is archive and reference only; it must not hold a second copy of a component or any packet. Read `DEPLOYMENT.md` in this folder before any page, packet or publish work — it is the runbook and it wins over older notes.
- Read the rentals archive only for history: its AGENTS.md, README.md, ARCHITECTURE.md, PROJECT_PLAN.md and `docs/` ledger. Preserve existing Wix navbar/footer, custom elements, CMS datasets/filters/sort and approved design. Public page data stays read-only. No parallel CMS store or queries.
- Human creates a missing blank Wix page. Everything after that — component, packets, mount, page title/description and the API publish — is the agent's job.
- This request authorizes bridge connection only, not page redesign, publishing, data changes or replacing existing startup code. Inventory live embeds and map exact IDs/scopes before any later mutation. Both existing initial and navigation controllers must remain synchronized with their packets and normal source when a future source release is authorized.
- Human handles Wix Editor placement, sizing and section cleanup when a layout change is genuinely needed, and creates a missing page. Agents do not operate Editor UI and never publish a stale local layout snapshot; API publish of the saved revision is the agent's step (see Publishing below).
- New app needs only `SCOPE.EDITOR.MANAGE_CUSTOM_EMBEDS` (plus Wix's forced basic app-instance access). The human explicitly approved creation, this scope, installation and the final Wix terms agreement; installation and own-app API access are now verified. Do not inherit Atelier translation scopes.

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


## Puerto Morelos condos page (page lane, no editor placement)

`/puerto-morelos-condos-sale` and `/es/puerto-morelos-condos-sale` are delivered
as one custom element, not from the controller's city list. Rebuilt 18 November
2026 to replace the 2024 article and carry the O3 recommendation.

- Tag `city-condos-puerto`. Source, build script, deploy script and built
  packets are all in the connected repo:
  `src/public/custom-elements/city-condos-puerto-v1.js`,
  `scripts/build-early-packets-pages.mjs`,
  `scripts/deploy-city-condos-puerto.mjs`, `packets/`.
- The HEAD packet hides the old page and paints the real hero as a placeholder
  from the first frame. The BODY_END embed mounts the element as a **sibling**
  of `#PAGES_CONTAINER`, not a child: Wix hydration replaces that container's
  children after first paint, which is what made the element appear twice and
  the old page flash back. A sibling survives hydration.
- Four HEAD chunks and one BODY_END mount, all `loadOnce=false`, all guarding
  their own route. The unsuffixed `… — <locale>` entry is chunk 1 of 2.
- The element sets `document.title` and the meta description for its locale.
  The English settings are also written through `seo-tags`; the Spanish ones are
  the editor's, so the rendered-document statement is the current fallback.
- The target delivery is the same as every other city page: the element placed
  once in the editor (tag `city-condos-puerto`, ID `customElement1`) so it is in
  the page's server HTML, the HEAD packets registering it, and the page code in
  `src/pages/Condos For Sale In Puerto Morelos.qu5lr.js` relaying its height.
  The BODY_END mount is only the fallback until that placement exists.
  Exact editor steps: `production/CITY_CONDOS_PUERTO_PLACEMENT.md`.
- Follow `DEPLOYMENT.md` for rebuild, retry, publish, verification and rollback.
