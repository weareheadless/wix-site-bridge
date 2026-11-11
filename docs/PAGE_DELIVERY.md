# Page delivery: the early packet and the mount

CrawlSEO delivers a Wix page as three artifacts: the component source, a HEAD
early packet that registers the custom element, and a BODY_END mount that puts
it on the page. The two entries are a pair; neither works alone. This document
is the mechanics contract. The product loop lives in the CrawlSEO repository at
`docs/wix-page-delivery-contract.md`.

## What one delivery writes

| Artifact | Written by | Where |
| --- | --- | --- |
| component source | CrawlSEO | `<site-repo>/src/public/custom-elements/<tag>.js`, committed and pushed |
| early packet | the bridge, `create-snippet` / `write-packet` | Custom Code, `HEAD`, `ESSENTIAL`, load-once, all pages |
| page mount | the bridge, `create-snippet` / `write-packet` | Custom Code, `BODY_END`, `ESSENTIAL`, load-once, all pages |

Names are fixed and carry the tag, so a retry finds the entry it created:

- `CrawlSEO early packet — <tag> — <n>` for each chunk, `n` starting at 1.
- `CrawlSEO page mount — <tag>`.

A long source is gzip + base64 and split into ordered chunks under the Wix
limit: the bridge chunks at 14,000 characters and refuses an entry at 15,000.
The last chunk decompresses and defines the element.

## Why two entries

Wix loads a custom element's own source from its CDN after the document, so the
element renders late. An HTML embed is worse: the bridge mounts it 2.5 s after
load. The site's own pages avoid both with a HEAD script that registers the
element before Wix's loader runs, and a body entry that creates it on the page.

- The packet only registers. It guards `customElements.define` with
  `customElements.get`, honours the site's `?earlyElements=off` control, and
  touches nothing else.
- The mount only places. It creates `<tag>` in the page container and re-mounts
  it through Wix hydration for the first minute, because hydration replaces the
  container after first paint.
- Both carry the same route and language guard. An entry that is site-wide at
  the API level is therefore inert everywhere except its own page.
- They must never both mount content. If both try, the page doubles or the
  mount is wiped.

The custom element renders the reviewed copy into the light DOM, so it stays in
the document for crawlers. JSON-LD is moved to `document.head` on connect,
because structured data inside a custom element is not read.

## Locales

A site that publishes several locales gets one tag, one packet and one mount per
locale, because the guard differs:

- a path-prefix locale (`/en/...`) guards its own route;
- a query locale (`lang=es`) also requires that query, and the default locale's
  entry excludes it;
- the default locale's entry also answers its explicit prefix (`/fr/...`), never
  another locale's prefix.

## Who does what

- **CrawlSEO** writes the component source, commits and pushes it, and calls the
  bridge for both entries.
- **The bridge** creates the entries, rewrites them in place on retry, reads the
  stored hash back, and disables a replaced embed.
- **The human** creates one blank, published Wix page at the route. There is no
  editor placement step: the mount adds the element to the page container.
  Optionally, narrow each entry's page scope in the Wix Custom Code panel; the
  API applies new entries to all pages and cannot change the filter.

Wix has no public API to create a site page, and the Custom Embed page filter is
read-only. That is why the page and the scope are human steps.

## Retry and update rules

- A retry looks up the entries by their exact names and rewrites them, so it
  never creates a second packet or mount for the same tag.
- `write-packet` refuses any embed whose name is not `CrawlSEO early packet` or
  `CrawlSEO page mount`, so a human's embed is never overwritten.
- `disable-embed` refuses any name that does not start with `CrawlSEO`.
- A page once delivered as an HTML embed is disabled when the element renders,
  because that embed replaces the page container and would hide the element.
- A component edit outside the page lane (a navigation link, a source fix)
  rebuilds the site's existing packet in the site's own format. It does not
  create a second controller or a new mount.

## Fallback lane

A site with no connected source repository keeps the HTML embed lane: one
route-guarded Custom Embed whose body script decompresses the fragment and
replaces the page container after 2.5 s. It is the fallback, not the target: it
is slower and cannot be registered early. Do not use it for a site that has a
repository.

## Verification

- The stored hash is the hard check: Wix must return exactly the bytes the
  bridge wrote, for the packet and for the mount.
- The rendered document must contain `<tag>`. The element mounts after the page
  loads, so a miss is reported, not turned into a failed publish.
- Check a fresh load and an internal link to the page. HTTP 200 alone does not
  prove the element rendered.

## Checklist for an agent

1. Is the page on the page lane? A new landing page is; an existing page update
   is not.
2. Does the component source exist at `src/public/custom-elements/<tag>.js` and
   is it pushed?
3. Do the packet and the mount both exist under the exact `CrawlSEO` names?
4. Does each entry carry the same route and language guard?
5. Is every packet chunk below 15,000 characters?
6. Did both hashes read back as a match?
7. Does the rendered page contain `<tag>` on a fresh load and after an internal
   navigation?
8. If the page was previously an HTML embed, is that embed disabled?
