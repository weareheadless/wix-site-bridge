# Page delivery: the element in the page, the packet in the head

A CrawlSEO page is a custom element placed in a Wix page, registered before
Wix's loader by a HEAD packet, plus the page code that relays its height. The
element is in the page's HTML; the packet only makes it upgrade early.

The BODY_END mount is a prototype lane, not delivery. It exists for a page that
has no placed element yet, and a mounted page cannot meet the performance
contract below: it has to insert the element outside `#PAGES_CONTAINER` to
survive hydration, outside the section the editor sized, and after first paint.
"Mounts and renders" is not "delivered".

## What one delivery writes

| Artifact | Written by | Where |
| --- | --- | --- |
| component source | the agent | `<connected-repo>/src/public/custom-elements/<tag>.js`, committed and pushed |
| editor placement | the human | the element on the page, with its section sized for desktop and mobile |
| page code | the agent | `<connected-repo>/src/pages/<Page Name>.<pageId>.js`, relays `section-resize` |
| early packet | the agent, `create-snippet` / `write-packet` | Custom Code, `HEAD`, one entry per locale per chunk, route-guarded |
| page mount | nobody, once the element is placed | `disable-embed` the retired entry |

The connected repository named in the site manifest is the only source. An older
repository may still hold history for that site, but it must not hold a second
copy of a component or any packet: one element is edited and built in one place.

Names are fixed and carry the tag, so a retry finds the entry it created:

- `CrawlSEO early packet — <tag> — <n>` for each chunk, `n` starting at 1.
- `CrawlSEO page mount — <tag>` for the retired prototype entry.

A long source is gzip + base64 and split into ordered chunks under the Wix
limit: the bridge chunks at 13,500 characters and refuses an entry at 15,000.
Each chunk writes its own indexed slot, and any chunk that completes the set
decompresses it. The chunks are therefore order- and repeat-safe: Wix may load
them in any order, and may rerun them on navigation, without corrupting the
payload.

## Performance contract

A page is not delivered until these pass on a fresh PageSpeed Insights mobile
run. Each gate has already been shipped broken once; the failure column is the
symptom to look for.

| Gate | Target | How it fails |
| --- | --- | --- |
| CLS | 0 (never above 0.05) | the page is built after first paint, or the element's section has no saved height |
| LCP | the element's own hero `<img>`, preloaded, around 2.5 s on PSI mobile | the hero is a CSS background, or the element mounts after the page |
| Images | no "Improve image delivery" opportunity on PSI | 560 px files in 134 px slots, or an uploaded PNG served as PNG |
| Transfer | at or below a sibling page on the same site | the page ships its own copy of images the site already uses |
| TBT | whatever the site's own pages get (~70 ms here) | not this page's job; the Wix shell and its tags set it |

Rules that follow:

- The element is placed in the page and its **section is sized per breakpoint**
  before anything is measured. A saved height is the only thing that keeps the
  footer still while the element upgrades.
- The packet registers and preloads. It must not hide `#SITE_PAGES`, paint a
  placeholder, set a min-height or move anything: a page that is hidden and
  rebuilt after paint is a page with CLS.
- A measured page is never mounted from BODY_END. The mount must move the
  element out of its section to survive hydration, which defeats the editor
  geometry and puts the page back to create-after-paint.
- Images from Wix Media: ask for `.jpg` (Wix transcodes by the requested file
  name) and carry `srcset`/`sizes` sized to the slot, not to the source.
- `loading="lazy"` works only when the image has layout. An element created by
  script has none, so images inside it need an IntersectionObserver.
- Measure with PSI. Local Lighthouse on a shared machine can report 30x the TBT
  and a later LCP; it is reliable for bytes and CLS only. Three runs, same URL,
  same device, compare medians.

## Why the element, not a mount

Wix loads a custom element's own source from its CDN after the document, so
without early registration the element renders late. Registration is the only
part the packet has to solve. Placement is a layout decision and belongs in the
page.

With the element in the page:

- it is in the delivered HTML, so its hero is the LCP candidate from parse time
  and the section's saved height holds the page still while it upgrades;
- the packet upgrades it in place; nothing is created, moved or replaced after
  first paint;
- the page code only relays `section-resize` to the element's Wix wrapper.

With a BODY_END mount instead:

- the mount has to insert the element outside `#PAGES_CONTAINER`, because Wix
  hydration replaces that container's children, so it sits outside the section
  the editor sized;
- React re-renders around the foreign node and moves it, which shows up as a
  layout shift of roughly the header's height and, earlier, as a visible reload;
- the page is created after first paint, so LCP waits for the mount and no
  preload can help.

That is not a tuning problem. A mounted page can be made to render, but it
cannot be made to score like a placed one.

The custom element renders the reviewed copy into the light DOM, so it stays in
the document for crawlers. JSON-LD is moved to `document.head` on connect,
because structured data inside a custom element is not read.

## Locales

A site that publishes several locales gets one tag and one packet per locale,
because the guard differs:

- a path-prefix locale (`/en/...`) guards its own route;
- a query locale (`lang=es`) also requires that query, and the default locale's
  entry excludes it;
- the default locale's entry also answers its explicit prefix (`/fr/...`), never
  another locale's prefix.

## Execution settings

Packet entries are created with Wix's load-once setting **off** ("reload on
every page"). That is not a performance preference: with load-once on, Wix runs
the entry only during the initial site render, so a visitor who reaches the page
by client-side navigation would never register the element. The bridge sets it
off on create, and `write-packet` can correct an existing entry with
`--load-once false` and verifies the readback.

Page scope remains a human step because Wix exposes it read-only. Narrowing the
entries to their page is a transfer optimization: the route guard already makes
an all-pages entry inert everywhere else.

## Who does what

- **CrawlSEO** writes the component source and page code in the connected
  repository, commits and pushes them, and calls the bridge for every packet
  chunk, the page's SEO title and description, and the publish.
- **The bridge** creates the entries, rewrites them in place on retry, reads the
  stored hash back, disables a replaced embed, writes the page's SEO tags through
  the Item SEO Tags API, and publishes the saved site revision through
  `POST /site-publisher/v1/site/publish`.
- **The human** creates the Wix page if it does not exist, places the custom
  element on it (Add Elements > Embed > Popular Embeds > Custom Element, tag
  name = the tag), and sizes the element and its section for desktop and
  mobile. This is the one step with no API. Record the Wix element id and the
  section id in the delivery notes. Optionally, narrow each entry's page scope
  in the Wix Custom Code panel; the API applies new entries to all pages and
  cannot change the filter.

Wix has no public API to create a site page, and the Custom Embed page filter is
read-only. That is why the page and the scope are human steps. Everything else,
including the publish, is automated.

## Page SEO title and meta description

The page title and meta description are Wix page settings, not Custom Embed
content. The bridge sets them with the **Item SEO Tags API**:

1. `GET /promote/seo/v1/item-seo-tags/STATIC_PAGE` lists the site's static pages.
   The response has no page URL, so the bridge matches the route against the
   canonical link in each item's `tags` or `resolvedTags`.
2. `PATCH /promote/seo/v1/item-seo-tags/STATIC_PAGE/{pageId}` replaces the title
   and description and keeps every other tag the page owns. `publish: true`
   updates the existing published revision; it never publishes the whole site.

This is a site-scoped credential, not the installed-app token (which returns
HTTP 403 here). Use a Wix API key with `Manage SEO Settings`
(`SCOPE.PROMOTE.MANAGE-SEO`) stored as `WIX_SEO_API_KEY`; when a site has none,
the bridge generates the Wix CLI session's token for that exact `siteId`. The
token is per site, so it cannot read or publish another site.

The API reads and writes the site's **primary language only**: listing returns
one item per page with the primary tags, and a write with a `language` is
rejected with `LANGUAGE_NOT_SUPPORTED`. A translated page's title and
description are a Wix editor setting; a page that must set them itself does it
from its own component and is verified in a rendered document, not in the raw
HTML.

`seo-tags` is read-only by default and applies with `--apply`. A failure is
reported in the delivery result; it does not hide a page that already rendered.

## Publishing after writes

Custom Embed writes must be followed by a site publish, and the publish must not
overlap them. A publish publishes the revision it started from and can take
minutes; a write that lands while it is rolling out can be replaced by that
older snapshot. The order is therefore: write every entry, wait, `publish-site`,
then verify the live document. `wix publish` is not this operation and stays
forbidden.

`publish-site` calls `POST /site-publisher/v1/site/publish` with the same
site-scoped token. It is dry-run by default and applies with `--apply`. The call
publishes the site's saved revision, not one page: use it only for a site whose
published revision is the intended one. It is not `wix publish`, which pushes
the local UI snapshot.

A publish restores page settings from that saved revision, so tags written
through the Item SEO Tags API (which live outside the revision) can be lost with
it. `publish-site` therefore reads every page that owns its title or
description first, publishes, then writes each page's own tags back and
reports how many it restored. Skipping that step is what stripped the agenda
page's title and description on a manual publish.

A publish triggered by a push to the connected repository can also restore an
older revision over the drafts. CrawlSEO therefore publishes, reads the raw live
document for the packet key the delivery wrote, and publishes again — up to
three rounds — before it reports the page as published. A page it cannot confirm
is reported as `pending`, never as success.

## Retry and update rules

- A retry looks up the entries by their exact names and rewrites them, so it
  never creates a second packet for the same tag.
- A retry sets load-once off on every packet. An existing entry with the wrong
  setting is corrected in the same write.
- A source that got shorter disables the packet chunks it no longer needs, so an
  old chunk cannot wait for a set that will never complete or transfer bytes on
  every page.
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
  bridge wrote, for every packet chunk.
- The served HTML must contain `<tag>`: that is the placed element, and it is
  what makes the page's content exist before JavaScript. If it is missing, the
  element is not placed and the page is not delivered.
- The served HTML must contain the hero preload and no mount script, no
  `cc-pm-` style and no `#SITE_PAGES` hiding rule.
- The rendered document must contain exactly **one** `<tag>`, one `<h1>`, the
  right copy and links for its locale, and the footer below the element. A
  second element, or an element whose parent is `#masterPage`, means a mount is
  still running.
- Check a fresh load and an internal link to the page. HTTP 200 alone does not
  prove the element rendered.
- Run PSI mobile: CLS 0, LCP the element's hero, no image-delivery opportunity,
  transfer at or below a sibling page.

## Checklist for an agent

1. Is the element placed in the page and its section sized for desktop and
   mobile? If not, stop: there is no mount substitute. Ask the human, and record
   the returned Wix element id and section id.
2. Does the component source exist at `src/public/custom-elements/<tag>.js`,
   light DOM, bilingual in one source where the page has two locales, starting
   with `/* global __CC_LOCALE__ */`, and is it pushed?
3. Does the page code bind the real Wix element id and relay `section-resize`?
4. Is every packet chunk under 13,500 characters, route-guarded, load-once off,
   and free of page hiding, placeholders and min-heights?
5. Is the retired mount entry disabled, and would the deploy fail if it came
   back?
6. Do the stored hashes read back as a match, and did you decode the served
   bundle rather than trusting `read-embed`?
7. Does the served HTML contain one `<tag>` and the hero preload, and no mount?
8. Does the rendered page show one element, one `<h1>`, both locales, the
   footer in place, and no horizontal overflow at 1440 px and 390 px?
9. Does PSI mobile report CLS 0, the element's hero as LCP, no image-delivery
   opportunity, and transfer no larger than a sibling page?
