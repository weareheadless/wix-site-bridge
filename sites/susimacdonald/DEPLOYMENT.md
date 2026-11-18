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

## The three artifacts

A page delivery is exactly three things:

1. **Component** — `src/public/custom-elements/<tag>.js` in the connected repo,
   light DOM so the copy stays in the document, bilingual in one source when the
   page has a translated route.
2. **Early packet** — `HEAD`, one entry per locale per chunk, registered before
   Wix's loader runs.
3. **Mount** — `BODY_END`, creates `<tag>` in `#PAGES_CONTAINER` and re-mounts it
   through hydration.

A standalone HTML embed is the fallback lane for a site **without** a connected
repository. This site has one, so an HTML embed is always the wrong artifact.

## Build

The build lives next to the component it compiles:

```sh
cd /home/admin/susimacdonald-wix
ESBUILD_BIN=/SEO/node_modules/esbuild/bin/esbuild \
  node scripts/build-early-packets-pages.mjs
```

Output goes to `packets/`. The script:

- compiles one bundle per locale (`--define:__CC_LOCALE__`), so a page does not
  ship the other language's copy;
- gzips and base64s the bundle;
- splits it into 12,400-character chunks. The bridge accepts up to 13,500 and
  refuses 15,000, so leave headroom;
- writes one guarded packet per chunk plus the mount.

Every packet and the mount guard their own route in the script itself. That is
why a site-wide entry is safe and why the shared controller is not touched for a
single page.

## Deploy

Credentials are this site's own app credentials. Never use Atelier's.

```sh
cd /home/admin/wix-site-bridge
set -a; . sites/susimacdonald/.wix-bridge-state/app.env; set +a
```

Create the packet chunks and the mount once. Names are fixed, so a retry updates
the same entry instead of adding another:

```sh
node src/cli.mjs create-snippet \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --name "CrawlSEO early packet — <tag> — <locale> <n>" \
  --html-file /home/admin/susimacdonald-wix/packets/<tag>-packet-<locale>-<n>.html \
  --position HEAD --category ESSENTIAL --all-pages --load-once false --apply

node src/cli.mjs create-snippet \
  --manifest sites/susimacdonald/site.manifest.json \
  --site susimacdonald \
  --state-dir sites/susimacdonald/.wix-bridge-state \
  --name "CrawlSEO page mount — <tag>" \
  --html-file /home/admin/susimacdonald-wix/packets/<tag>-mount.html \
  --position BODY_END --category ESSENTIAL --all-pages --load-once false --apply
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
inert elsewhere.

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

Custom Embed writes are drafts until the site is published. Publish through the
bridge API:

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
2. Raw live HTML contains the packet key for each locale chunk and the mount.
3. Rendered document contains `<tag>` on a fresh load and after an internal
   navigation.
4. Both locales: their own copy, their own links, one `<h1>`.
5. Desktop and 390px mobile: no horizontal overflow, no doubled sections.
6. The page's own title and meta description appear in the rendered document.
7. The other routes still work: a site-wide entry must be inert there.

## Rollback

Disable the packet chunks and the mount with `disable-embed`; their ids are in
`site.manifest.json` and `embed-inventory.json`. Nothing else on the page was
changed, so the previous page returns on the next render. If a rebuild made the
page worse, restore the last known-good entry from its receipt first, then fix
the source — never layer a new guess on a broken live state.

## Do not

- Paste a standalone HTML page into Wix on this site.
- Build a second packet from a second repository copy.
- Create a second entry when a retry can rewrite the first.
- Use `wix publish`, or Atelier's app credentials, tokens or state.
- Claim success without the rendered-document check.
