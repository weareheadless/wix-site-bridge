# Deploying a Susi page

This is the only runbook for this site. A page is code in the connected
repository plus Custom Code entries written through the bridge, then one API
publish. Nothing is pasted into the Wix editor and no HTML prototype is
deployed.

## Which repository is the source

| Repo | Role |
| --- | --- |
| `weareheadless/susimacdonald-wix` (`/home/admin/susimacdonald-wix`) | **Canonical.** Wix Git Integration's connected repository. New page components, their build scripts and built packets live here, and this is what gets committed and pushed. |
| `weareheadless/susimacdonald-rentals` (`/home/admin/susimacdonald-rentals`) | Archive and reference for the older site code, blog tooling and docs. It must **not** hold a second copy of a component that is delivered from the connected repo, and it must **not** hold packets. |

If a component exists only in `susimacdonald-rentals`, copy it into
`susimacdonald-wix/src/public/custom-elements/` first and treat the connected
repo as the source from that point on. Editing both copies is what produced the
wrong-lane deliveries; one element has one home.

## The delivery

A page delivery is four things, and one of them is a human step:

1. **Component** — `src/public/custom-elements/<tag>.js` in the connected repo,
   light DOM so the copy stays in the document, bilingual in one source when the
   page has a translated route.
2. **Editor placement** — the custom element placed on the page, with the
   element and its section sized for desktop and mobile. Human step; there is no
   API. Record the Wix element id (e.g. `comp-mwmg963v`) and the Wix section id
   (e.g. `comp-mwmb8lz3`).
3. **Early packet** — `HEAD`, one entry per locale per chunk, registered before
   Wix's loader runs. It registers and preloads; nothing else.
4. **Page code** — `src/pages/<Page Name>.<pageId>.js`, binding the Wix element
   id and relaying `section-resize` so the wrapper keeps the element's height.

There is no mount. A BODY_END mount has to move the element out of its editor
section to survive hydration, so it defeats the saved geometry, rebuilds the
page after first paint and puts back the visible reload and CLS 0.709. The
retired mount entry is disabled and the deploy fails if it is live again.

A standalone HTML embed is the fallback lane for a site **without** a connected
repository. This site has one, so an HTML embed is always the wrong artifact.

## Performance (read this before building, not after)

The page is measured against its siblings, not against a general ideal:

| Gate | Target |
| --- | --- |
| CLS | 0 (anything above 0.05 is a bug) |
| LCP | the element's own hero `<img>`, preloaded |
| Images | no "Improve image delivery" opportunity on PSI |
| Transfer | at or below a sibling page (~2.8 MB here; the Wix shell is most of it) |
| TBT | ~70 ms, set by the site and its tags, not by this page |

What produces each failure, from pages that already shipped:

- **CLS 0.709 / the page jumps.** The page is built after first paint: a mount,
  a `display:none` on `#SITE_PAGES`, or an unsized element section. The element
  belongs in the server HTML with its section height already saved.
- **A visible reload.** Two elements, or an element moved by a mount while Wix
  hydration runs. Check for a second `<tag>` and for a parent of `#masterPage`.
- **"I placed the element and nothing improved."** The mount is still enabled
  and is relocating the placed element. Disable it.
- **2.4 MB of images.** 560 px files in 134 px slots, and uploaded PNGs served
  as PNG. Ask for `.jpg` (Wix transcodes by the requested file name) and carry
  `srcset`/`sizes`.
- **LCP 6 s with a 3 s FCP.** The hero is a CSS background, or the element does
  not exist at parse time. Preload the hero with a real `<link>` in the packet.

Measure with PageSpeed Insights, not with Lighthouse on this box: the machine is
shared and can report 30x the TBT and a later LCP (4,000 ms against PSI's 70 ms
on the same page). Local runs are still good for transferred bytes and CLS.
Three runs, same URL, same device, compare medians.

## Build

The build lives next to the component it compiles:

```sh
cd /home/admin/susimacdonald-wix
ESBUILD_BIN=/SEO/node_modules/esbuild/bin/esbuild \
  node scripts/build-early-packets-pages.mjs
```

Output goes to `packets/`. The script:

- serves resize-appropriate images: Wix transcodes by the requested **file
  name**, so `.../fill/w_420,h_525,al_c,q_75/FACHADA%205.jpg` returns a 46 KB
  JPEG from an uploaded PNG that would otherwise be 801 KB at `w_560`. Any
  element that takes images from Wix Media must ask for `.jpg` and carry
  `srcset`/`sizes`; a 560 px card image in a 134 px slot is 10x the bytes;
- compiles one bundle per locale (`--define:__CC_LOCALE__`), so a page does not
  ship the other language's copy. The component must start with
  `/* global __CC_LOCALE__ */`: esbuild substitutes the define, but Wix's own
  build lints the source without it and fails `no-undef` otherwise;
- gzips and base64s the bundle;
- splits it into chunks under 13,500 characters. The current build uses 9,900
  base64 characters per chunk, because the chunk also carries the packet script;
- writes one guarded packet per chunk.

Every packet guards its own route in the script itself. That is why a site-wide
entry is safe and why the shared controller is not touched for a single page.

## Deploy

One command does the whole delivery in the only order that works — build, write
the four packet entries, disable the retired mount, publish once, read the
hashes back, and decode the live document:

```sh
cd /home/admin/susimacdonald-wix
node scripts/deploy-city-condos-puerto.mjs
```

It exits `0` only when the stored hashes match the built files and the live page
decodes to the expected bundle. If a publish that was already in flight puts an
older packet back, it rewrites the entries and publishes again, up to three
rounds.

Do not run the publish and the writes in parallel. A site publish takes minutes
and publishes the revision it started from; a write that lands while it is
rolling out can be overwritten by its snapshot. That is what made the page flip
between the new page and an older, unstyled packet.

### The shared controller has two entries — write both or neither

The homepage is the one route with no page-scoped packet: `create-snippet` needs
a non-root `--route`, so the home elements are registered by the site-wide
controller. That controller is installed twice, on purpose:

| Entry | id | load once |
| --- | --- | --- |
| `Susi — Early registration controller (every page)` | `6245ffcb-4cc7-4ca4-ae87-136c974eb381` | false |
| `Susi — Early registration bootstrap (initial load)` | `5b7edf14-687f-4961-a909-37ff76defa35` | true |

Both are HEAD and all-pages, and both carry the *same* source. The second one
runs later in the head, so writing only the first publishes a new release string
and a new route key that the second one immediately overwrites: the page keeps
the old registry, the new element is never registered, and `data-<tag>` on
`meta[name=susi-early-elements]` stays absent. A CTA "registered but never
defined" is this, not a bad packet. Update both with
`update-snippet --preserve-scope`, then publish once.

### The four entries

The page is one artifact kind plus the editor element:

- two HEAD early packets per locale, which register `<tag>` before Wix's loader
  and preload the hero with a real `<link>`. They do not hide the page or paint
  a placeholder: the element is in the page's server HTML, so it upgrades in
  place and its section already reserves the height;
- no page mount. A BODY_END mount has to move the element out of its editor
  section to survive hydration, which recreates the page after first paint, puts
  back the visible reload and costs CLS 0.709. The mount entry is disabled and
  the deploy fails if it is live again.

Credentials are this site's own app credentials. Never use Atelier's.

```sh
cd /home/admin/wix-site-bridge
set -a; . sites/susimacdonald/.wix-bridge-state/app.env; set +a
```

Create the packet chunks once. Names are fixed, so a retry updates the same
entry instead of adding another:

```sh
node src/cli.mjs create-snippet \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --name "CrawlSEO early packet — <tag> — <locale> <n>" \
  --html-file /home/admin/susimacdonald-wix/packets/<tag>-packet-<locale>-<n>.html \
  --position HEAD --category ESSENTIAL --all-pages --load-once false --apply

# There is no mount entry. If one exists from an earlier delivery, disable it:
node src/cli.mjs disable-embed \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --snippet <mount-id> --apply
```

On a rebuild, rewrite the existing entries with `write-packet` and the same
snippet id. Never create a second entry for the same chunk.

```sh
node src/cli.mjs write-packet \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --snippet <custom-embed-id> \
  --html-file /home/admin/susimacdonald-wix/packets/<file>.html \
  --load-once false --apply
```

Page scope is read-only in the API. Narrowing the entries in the Custom Code
panel is an optional transfer optimization; the route guard already makes them
inert elsewhere. The element itself is on one page, so scoping the packets to
that page is the clean state.

## Page title and meta description

`seo-tags` writes them through the Item SEO Tags API. It needs a site-scoped
token, which the bridge resolves in this order:

1. `WIX_SEO_API_KEY` or `WIX_API_KEY` if set;
2. otherwise the Wix CLI session's token for this exact site:
   `wix token -s 878460ca-c98c-402b-8a10-862023f67cce`.

The second path is what makes this site self-sufficient. The token is generated
for this `siteId` only, so it is not a borrowed credential.

```sh
node src/cli.mjs seo-tags \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --route /puerto-morelos-condos-sale \
  --title "…" --description "…" --apply
```

The SEO API covers the site's **primary language only**. A translated route's
title and description are an editor setting; until they are set there, the page
component states them for the rendered document, and verification reads the
rendered document, not the raw HTML.

## Publish

Publish **after** the four writes and the mount disable, never before or during
them. A publish takes
minutes and publishes the revision it started from; a write that lands while it
is rolling out can be replaced by that snapshot, which is how the page reverted
to an older unstyled packet. Publish through the bridge API:

```sh
node src/cli.mjs publish-site \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state --apply
```

`publish-site` calls `POST /site-publisher/v1/site/publish`, which publishes the
site's **saved revision** — the layout and language state the editor already
holds. It is the correct and expected final step of a delivery, and it is not
the same operation as `wix publish`.

`wix publish` is forbidden for this site. It publishes the local UI snapshot
from the connected repository and has repeatedly replaced the saved Spanish
state with an English one. `publish-site` never sends a local UI snapshot.

A publish restores page settings from the saved revision, so the bridge reads
every page that owns its title or description first, publishes, then writes
those tags back and reports how many it restored. For that reason either order
works: `seo-tags` then `publish-site` is fine because the restore step puts the
new tags back.

## Verify

Do not report a delivery from a green API response alone.

1. Stored hash: `read-embed` must return exactly the bytes that were written.
   Re-read after the publish; a publish can put a saved Custom Code revision
   back, so rewrite any entry whose hash no longer matches.
2. Decode the live bundle, not just the API: fetch the page, extract both HEAD
   chunks, gunzip them and check for the current markers. `read-embed` shows the
   draft; only the live document proves what visitors receive.
3. Served HTML: one `<city-condos-puerto>` or `<tag>`, the hero preload, and no
   mount script, no `cc-pm-` style and no rule hiding `#SITE_PAGES`. The element
   in the served HTML is what makes the page exist before JavaScript.
4. Rendered document: exactly one `<tag>`, one `<h1>`, its parent inside
   `#SITE_PAGES` and not `#masterPage`, the section at least as tall as the
   element, the footer below it, on a fresh load and after an internal
   navigation.
5. Both locales: their own copy, their own links.
6. The page's own title and meta description appear in the rendered document.
7. The other routes still work: a site-wide entry must be inert there.
8. Performance gates from the section above: CLS 0, LCP the element's hero, no
   image-delivery opportunity, transfer no larger than a sibling page. Record
   the PSI URL and the run date; do not substitute a local Lighthouse score.

## Rollback

Disable the packet chunks with `disable-embed`; their ids are in
`site.manifest.json` and `embed-inventory.json`. The element stays on the page
but is no longer defined early, so Wix loads its own source — slower, but
visible. If a rebuild made the page worse, restore the last known-good entry
from its receipt first, then fix the source; never layer a new guess on a broken
live state.

## Do not

- Paste a standalone HTML page into Wix on this site.
- Build a second packet from a second repository copy.
- Create a second entry when a retry can rewrite the first.
- Add a BODY_END mount to a page whose element is placed.
- Hide `#SITE_PAGES`, paint a placeholder, or set a min-height from a packet.
- Use `wix publish`, or Atelier's app credentials, tokens or state.
- Claim success, or a score, without the served-HTML, rendered-document and PSI
  checks.
