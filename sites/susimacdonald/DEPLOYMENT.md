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

One JSON per page in `src/page-content/<tag>.json`: `hero`, `buildings`,
`tags`, and the `en` / `es` copy objects. The element is the Puerto Morelos
condo template with its copy and listings swapped, so the JSON is the only
difference between city pages. Nothing else about a page is improvised.

## 2. Build

```sh
cd /home/admin/susimacdonald-wix
ESBUILD_BIN=/SEO/node_modules/esbuild/bin/esbuild node scripts/build-city-type-pages.mjs
```

It writes, for every page in its registry:

- `src/public/custom-elements/<tag>-v1.js` — light DOM so the copy stays in the
  document, bilingual in one source, `/* global __CC_LOCALE__ */` at the top;
- `packets/<tag>-packet-<locale>-<n>.html` — per locale, gzip + base64, chunks
  under 13,500 characters, each guarded to its own route and carrying the hero
  `<link rel=preload>`.

The packet defines the element first on the live page, so **rebuild the packets
whenever the component changes**; a stale packet pins the old component.

## 3. Deploy

One command per page set: build, write every chunk (creating an entry by name
when it does not exist, rewriting it in place when it does), `publish-site`,
`publish` the repository code, read every stored hash back, decode the live
documents.

```sh
node scripts/deploy-city-type-pages.mjs                     # every page in the registry
node scripts/deploy-city-type-pages.mjs --pages city-condos-tulum
```

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

## 4. The slot the element lives in

Wix places the element in a slot (`#comp-…`, `display:flex`) whose height is the
value saved in the editor, and as a flex item the element resolves
`min-height:auto` to that height. The element owns the correction:

1. `align-self:flex-start` and `height:auto` on the tag, so it sizes to content;
2. `min-height:0 !important` inline on connect;
3. the measured content height (last section's bottom − element's top) written to
   the slot's inline `height`, re-applied from a `ResizeObserver`.

Never resolve this from Velo page code. `$w('#comp-…').on('section-resize')`
binds but never receives the element's `CustomEvent` on this site (live:
`relay bound`, no `relay applies`, box unchanged), and page code only reaches
production through the editor's code publish. Page code is optional; no layout
depends on it.

## 5. Verify (agent)

- Stored hash of every chunk matches the built file.
- Served HTML: one `<tag>`, the hero preload, the packet for each locale, no
  mount script, no `cc-pm-` cover.
- Rendered, fresh load, at 1440 and 390, EN and ES: one element, one `<h1>`, the
  footer directly after the content (no empty band), no horizontal overflow.
- Performance gates below.

## 6. Performance gates

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

## 7. Page title and meta description

`seo-tags --route <route> --title … --description … --apply` writes them through
the Item SEO Tags API with a site-scoped token: `WIX_SEO_API_KEY` /
`WIX_API_KEY` if set, otherwise the Wix CLI session token for this exact
`siteId`. Both are legitimate for this site only; never borrow another site's
key.

The API reads and writes the **primary language only**. A translated page's
title and description are an editor setting, so `/es/…` keeps the editor's value
and is verified in the rendered document instead.

## 8. Retry, rollback, legacy

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

## 9. Page registry

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
| Tulum condos | `city-condos-tulum` | `/tulum-condos-sale` | — | — |
| Cozumel condos | `city-condos-cozumel` | `/cozumel-condos-sale` | — | — |
| Bacalar condos | `city-condos-bacalar` | `/bacalar-condos-sale` | — | — |
| Puerto Aventuras condos | `city-condos-puerto-aventuras` | `/puerto-aventuras-condos-sale` | — | — |
| Akumal condos | `city-condos-akumal` | `/akumal-condos-sale` | — | — |
