# Susi Macdonald — content, CMS and translation rules

These rules are not part of a page delivery. The delivery process is
`DEPLOYMENT.md`; this file only covers content, listing data and the Spanish
site. Nothing here changes how a page is built, deployed or published.

## Copy

- Preserve approved design, the Wix header/footer, existing CMS datasets and
  filters. Public page data is read-only unless a task is explicitly about it.
- Mexican Spanish: translate directly, never with Wix machine-translation
  credits. Mexican vocabulary (renta, recámaras, colonia, financiamiento);
  preserve Susi MacDonald, place names, prices, measurements, links and legal
  meaning.
- The Spanish site is live and must stay complete: never publish a page whose
  `/es/…` route is missing its copy.
- One source of truth per component. The connected repo
  (`/home/admin/susimacdonald-wix`) holds it; the older
  `weareheadless/susimacdonald-rentals` repo is archive and reference only and
  must not hold a second copy of a component or a packet.

## Listings

- The CMS is the only source of a page's property list. City pages read it at
  runtime (`src/public/city-listings.js` plus the page code, which sets the
  element's `buildings` attribute); never bake a list, a count or a price range
  into a page JSON, a component or a packet.
- City pages show sales only: no rental (type, monthly price or rental route)
  and a price at or above USD 20,000. `/es` serves translated field values, so
  `type` reads "Renta" there: filter on the row, never on the English word
  alone.
- Quote the price the listing states (`price`, the "from" figure), not
  `priceRange`, which is a bucket ("$50,000 - 100,000 USD") and made every card
  quote the bucket floor.
- The HTTP endpoint lane is not available on this site (`/_functions/*` returns
  500 `MODULE_LOAD_ERROR`), so there is no endpoint file in the repository.
- Never update a Wix Data collection item with a partial `PUT`. Use `PATCH` with
  `fieldModifications`, or fetch the whole item, keep a private copy and send it
  back complete.
- Before any raw collection write, snapshot the full item JSON to
  `.wix-bridge-state/backups/` and record the item id, collection, before-hash
  and the fields being changed. Read the item back and compare afterwards.
- Preserve the routing and integrity fields: `link-recipes-title`, `title`,
  `title12`, `title2`, `url`, `_publishStatus`, `_publishDate`, `_draftDate`,
  `address`, `housingType`, `image`, `mediagallery`, `mediaGalleryBottom`.
  Dropping `link-recipes-title` or `title` breaks `/real-estate-listings/…`.
- A price is not one field: check `price`, `priceRange`, `shortDescription1`,
  `metaDescription`, the `shortDescription` HTML, `introduction2` and the Spanish
  translation-content fields, and update every place the old price appears.
- After a listing write, verify the card, the detail page and both languages. A
  card being present is not proof the detail route still works.
- If a dynamic listing route returns 404 after a write, restore the item from the
  private snapshot first.

## Translation data

- Prefer the translation-content API for Spanish listing copy. The raw
  collection is the English source; do not overwrite English fields to change a
  translation.
- Blog translations created with `translationId` can be stored as separate
  Spanish posts with a `-1` slug. Check `translations` on the English post and
  the Spanish slug before claiming they are linked.
- Native Wix header/footer, menus, CMS card fields and the listing-detail source
  are separate translation domains. Embeds being translated does not make them
  translated, and runtime overlays are not a translation.
- `production/i18n/es-MX.json` is a draft dictionary of interface strings, not a
  deployed component and not proof of a translated page.

## MCP rental pipeline

- Code lives in `/MCP`. The one-input script is
  `/MCP/scripts/create_rental_listing_from_drive.py`; the Drive folder for a
  slug is in `/MCP/data/mcp_catalog.db` (`developments.drive_url`,
  `development_drive_mappings` where `is_current = 1`).
- Run it from `/MCP` with its `.env` loaded and the OpenRouter overrides, because
  the default text model aborts Wix content generation:
  `MCP_TEXT_PROVIDER=openrouter` and
  `MCP_LLM_TEXT_MODEL=google/gemini-3.1-flash-lite`.
- The Drive document is authoritative for rent. Fix the Drive source or a
  verified DB override before rerunning, or the pipeline overwrites a corrected
  price.
- It writes listing content; it is not the site publisher. Never run
  `wix publish`.
