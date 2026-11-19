# Deploying a Susi page

The only process for this site. A page is a custom element placed in a Wix page,
one HEAD packet per locale and chunk, and one deploy. Nothing is pasted into the
Wix editor, there is no mount, and there is no HTML-embed lane for this site
because it has a connected repository.

If anything elsewhere describes a different sequence — a page mount, a page-code
height relay, an editor publish for code, a manual Custom Code edit — it is
legacy and this file wins.

## Who does what

| Step | Who | Where |
| --- | --- | --- |
| create the page if missing, place the Custom Element (tag name = `<tag>`), report the element id (`comp-…`) and section id | human | Wix editor |
| component source `src/public/custom-elements/<tag>-v1.js` | agent | connected repo |
| build script, `src/page-content/<tag>.json` copy | agent | connected repo |
| packets `packets/<tag>-packet-<locale>-<n>.html` | agent, built | connected repo |
| every Custom Code entry (`create-snippet`, `write-packet`, `disable-embed`) | agent, via the bridge | Wix, `HEAD` |
| page SEO title and description | agent, `seo-tags` | Wix |
| commit, push, `publish-site`, `publish` | agent | repo + bridge |
| live verification and performance gates | agent | live site |

A delivery is never handed back to the human for a packet, an embed, a code
paste, a publish or a measurement.

## 1. Copy

One JSON per page in `src/page-content/<tag>.json`: `route`, `hero`, `source`
(the city and kind the page lists), `tags`, and the `en` / `es` copy objects.
Every page is the same layout from `src/templates/city-type-page.js`, so the
JSON is the only difference between city pages. It never carries a property
list or a count.

Numbers in the copy are tokens, not literals: `{n}` listings, `{min}`–`{max}`
price range, `{beds}` bedroom range. They are filled from the rows the page
receives, so the copy cannot drift from the CMS. Nothing else about a page is
improvised.

## 2. Listings

No page carries a property list. `src/public/city-listings.js` queries the
site's `Recipes` collection for the page's city and kind, keeps sales only and
maps each row to the card shape. Sales only means: no rental (a `type` saying
rent/renta, a monthly price, or a rental route), and a price at or above USD
20,000. The price is the one the listing quotes (`price`, the "from" figure);
`priceRange` is a bucket and only a fallback.

Both checks read the row, not one field, because `/es` returns translated
content: `type` is "Renta" there, and `priceRange` can be empty while `price`
is still the same number. Filtering on the English word alone let two Playa
rentals onto the Spanish page, which is why the check also looks at the monthly
price and the route. The page code for the page (`src/pages/<page>.js`)
runs it on ready and sets the element's `buildings` attribute; the element
renders the cards, the full table and the token numbers from whatever it
receives, and re-renders when the attribute changes.

A new development in the CMS therefore appears on the page without a rebuild or
a deploy. A page is rebuilt only when its layout or copy changes.

Do not add a build-time list or a fixed count to a JSON, an element or a
packet: that is the bug this replaced (a page offering 14 buildings out of the
full CMS set). Do not move the feed to an HTTP endpoint either: `/_functions/*`
answers 500 `MODULE_LOAD_ERROR` on this site, so the repository has no endpoint
file and the Velo page code is the only feed.

## 3. Build

```sh
cd /home/admin/susimacdonald-wix
ESBUILD_BIN=/SEO/node_modules/esbuild/bin/esbuild node scripts/build-city-type-pages.mjs
```

It reads `src/templates/city-type-page.js` and writes, for every page in the
registry:

- `src/public/custom-elements/<tag>-v1.js` — light DOM so the copy stays in the
  document, bilingual in one source, `/* global __CC_LOCALE__ */` at the top;
- `packets/<tag>-packet-<locale>-<n>.html` — per locale, gzip + base64, chunks
  under 13,500 characters, each guarded to its own route and carrying the hero
  `<link rel=preload>`. The number of chunks is whatever the element fits in:
  most pages take two per locale, the Puerto Morelos page takes three, and the
  deploy reads the count from `packets/` instead of assuming.

The packet defines the element first on the live page, so **rebuild the packets
whenever the component changes**; a stale packet pins the old component.

## 4. Deploy

One command per page set: build, write every chunk (creating an entry by name
when it does not exist, rewriting it in place when it does), `publish-site`,
`publish` the repository code, read every stored hash back, decode the live
documents.

```sh
node scripts/deploy-city-type-pages.mjs                            # every page in the registry
node scripts/deploy-city-type-pages.mjs --pages=city-condos-tulum  # one page
node scripts/deploy-city-type-pages.mjs --pages=city-condos-tulum,city-condos-cozumel
```

A page that is not placed yet fails the last check (`<tag>` absent from the
served HTML) by design: build and commit it, deploy it once the element is on
the page.

It exits `0` only when the stored hashes match the built files and every live
page decodes with its element, both packets, the preload and no mount. If a
publish that was already in flight puts an older packet back, it rewrites and
publishes again, up to three rounds.

Rules that are not negotiable:

- Writes first, then the publish. Never a publish and a write at the same time:
  a site publish takes minutes and publishes the revision it started from.
- **Never run `wix publish`.** It publishes the local UI snapshot and has
  replaced the saved Spanish state with English. `publish-site` publishes the
  saved revision; the two are not interchangeable.
- `publish-site` publishes Custom Code; `publish` publishes the component and
  page code from this repository. A page that changed only its copy needs the
  first; a page that changed its element needs both.
- `publish-site` restores each page's own title and description after
  publishing. Do not "fix" a missing title with a manual editor publish.

## 5. The slot the element lives in

Wix places the element in a slot (`#comp-…`, `display:flex`) whose height is the
value saved in the editor, and as a flex item the element resolves
`min-height:auto` to that height. The element owns the correction:

1. `align-self:flex-start` and `height:auto` on the tag, so it sizes to content;
2. `min-height:0 !important` inline on connect;
3. the measured content height (last section's bottom − element's top) written to
   the slot's inline `height`, re-applied from a `ResizeObserver`.

Never resolve this from Velo page code. `$w('#comp-…').on('section-resize')`
binds but never receives the element's `CustomEvent` on this site (live:
`relay bound`, no `relay applies`, box unchanged). Page code supplies the
listing rows and nothing else; no layout depends on it.

## 6. Verify (agent)

- Stored hash of every chunk matches the built file.
- Served HTML: one `<tag>`, the hero preload, the packet for each locale, no
  mount script, no `cc-pm-` cover.
- Rendered, fresh load, at 1440 and 390, EN and ES: one element, one `<h1>`, the
  footer directly after the content (no empty band), no horizontal overflow.
- Listing counts: the element shows the current CMS count in the facts and the
  copy (`{n}`, `{min}`–`{max}`, `{beds}`), in both locales, and the page log
  reads `city-<tag>: N listings sent to #…`. A count lower than the CMS's own
  filtered set means the page code did not receive the rows.
- Performance gates below.

## 7. Performance gates

| Gate | Target | How it fails |
| --- | --- | --- |
| CLS | 0, never above 0.05 | built after first paint: a mount, hidden `#SITE_PAGES`, or an element that does not size its slot |
| LCP | the element's own hero `<img>`, preloaded | hero is a CSS background, or the element is not in the parsed HTML |
| Images | no "Improve image delivery" on PSI | 560 px files in 134 px slots, or an uploaded PNG served as PNG |
| Transfer | at or below a sibling page | the page ships its own copy of images |
| Time to element | at or below the closest delivered sibling | the page has no packet, so its element waits for Wix's bundle |
| TBT | ~70 ms, set by the site and its tags | not this page's job |

Measured, unthrottled, desktop, medians of three runs — the packets are the
whole difference:

| Page | element defined, before | after |
| --- | --- | --- |
| Playa houses | 3,169 ms | 2,222 ms |
| Playa condos | 2,988 ms | 2,011 ms |
| Playa beachfront | 3,257 ms | 2,130 ms |
| Puerto Morelos condos (reference) | 1,799 ms | 1,933 ms |

Measure PSI mobile for the real numbers. Never use Lighthouse on this box for
TBT or a score: the machine is shared and reports ~30x the real TBT (4,000 ms
against PSI's 70 ms on the same page). Local runs are fine for bytes and CLS.

## 8. Page title and meta description

`seo-tags --route <route> --title … --description … --apply` writes them through
the Item SEO Tags API with a site-scoped token: `WIX_SEO_API_KEY` /
`WIX_API_KEY` if set, otherwise the Wix CLI session token for this exact
`siteId`. Both are legitimate for this site only; never borrow another site's
key.

The API reads and writes the **primary language only**. A translated page's
title and description are an editor setting, so `/es/…` keeps the editor's value
and is verified in the rendered document instead.

## 9. Retry, rollback, legacy

- A retry looks the entries up by their exact names and rewrites them; it never
  creates a second packet for the same chunk. `publish-site` and `publish` are
  safe to repeat.
- A regression is restored from the last good packet in
  `.wix-bridge-state/receipts/` first, then the canonical source is fixed. Never
  stack a speculative fix on a broken live state.
- A retired page mount is disabled with `disable-embed` and the deploy fails if
  it is live again. Do not create mounts for a page that has a placed element.
- The shared homepage controller has two entries
  (`Susi — Early registration controller (every page)`,
  `Susi — Early registration bootstrap (initial load)`) carrying the same
  source; updating only one leaves the page on the old registry. They are not
  part of a page delivery.

## 10. Page registry

Content is in `src/page-content/<tag>.json`; the element is
`src/public/custom-elements/<tag>-v1.js`. The Wix element and section ids are
filled in when the page is placed; a page without them is built and not yet
deployed.

| Page | Tag | Route | Wix element | Section |
| --- | --- | --- | --- | --- |
| Puerto Morelos condos | `city-condos-puerto` | `/puerto-morelos-condos-sale` | `comp-mwmg963v` | `comp-mwmb8lz3` |
| Playa houses | `city-houses-playa` | `/playa-del-carmen-house-sale` | `comp-mwn01eun` | `comp-mwmy60v7` |
| Playa condos | `city-condos-playa` | `/playa-del-carmen-condos-sale` | `comp-mwmzxblg` | `comp-m2c1hp5f` |
| Playa beachfront | `city-beachfront-playa` | `/playa-del-carmen-beachfront-sale` | `comp-mwmyntax` | `comp-mwmy7usw` |
| Tulum condos | `city-condos-tulum` | `/tulum-condos-sale` | `comp-mwnf0ol0` | `comp-mwnf019b` |
| Cozumel condos | `city-condos-cozumel` | `/cozumel-condos-sale` | `comp-mwnf69x5` | `comp-mwnf4dku` |
| Bacalar condos | `city-condos-bacalar` | `/bacalar-condos-sale` | `comp-mwnf9qo3` | `comp-mwnf936x` |
| Puerto Aventuras condos | `city-condos-puerto-aventuras` | `/puerto-aventuras-condos-sale` | `comp-mwnfcogn` | `comp-mwnfc33x` |
| Akumal condos | `city-condos-akumal` | `/akumal-condos-sale` | `comp-mwnfhp32` | `comp-mwnfgwqs` |

### The rentals page

`/apartments-for-rent-in-playa-del-carmen` (page id `gkrfz`) is not a city-type
page: its copy lives in the element, not in `src/page-content/`.

- Element: `src/public/custom-elements/rental-experience-v2.js` — hero, the
  listing collection, and the long-form guide (condo rentals, apartment
  rentals, long-term rentals, what renting costs, the application and the
  contract), English and Spanish in one source, light DOM.
- Packet: `node scripts/build-rental-packet.mjs` writes
  `packets/rental-experience-packet.html`. One Custom Code entry holds 15,000
  characters and the script fails if the packet outgrows it, so copy is written
  to fit the entry instead of opening a second one.
- It is written in place: the entry's name has no `crawlseo` prefix, so
  `write-packet` and `write-embed` refuse it.

```sh
node src/cli.mjs update-snippet \
  --manifest ./sites/susimacdonald/site.manifest.json --site susimacdonald \
  --snippet 9410c467-b293-48f9-8bff-9e888063c9bf \
  --html-file /home/admin/susimacdonald-wix/packets/rental-experience-packet.html \
  --preserve-scope --apply
```

Then `publish-site`, `seo-tags` for the route, and `publish`.

Two things are specific to this page. The guide is mounted from the element's
own `_mount` through `window.__rentalGuide`, not by wrapping
`connectedCallback` afterwards: Wix's server-rendered element can upgrade before
the packet has finished running, so a later patch never executes and the guide
never appears. And the element sets its own Spanish title and description,
because `seo-tags` writes the primary language only.
