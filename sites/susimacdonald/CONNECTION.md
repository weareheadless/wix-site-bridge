# Susi Macdonald bridge connection

Connected 18 October 2026. Customer alias `susimacdonald`, verified Wix site `878460ca-c98c-402b-8a10-862023f67cce`, https://www.susimacdonald.com/.

## Verified access

Dedicated private app **Susi Embed Bridge** v1.0 is installed and enabled. Only Custom Embeds management plus Wix's mandatory basic app-instance details were granted. The human approved app creation, installation and the final Wix terms agreement. Own app credentials are stored locally in `sites/susimacdonald/.wix-bridge-state/app.env` (0600, ignored); no Atelier credentials are used.

The shared bridge CLI `snippets --site susimacdonald` successfully authenticated and listed **20 existing snippets**. `embed-inventory.json` and the manifest record their actual IDs, placement, page scope, category, load-once settings and hashes. Private `live-embeds.json` retains a read-only full snapshot. No snippet, content, dataset, layout or publication was changed. Browser access was subsequently disabled in Work settings, so no final screenshot was captured; API access is confirmed independently through the app.

## Routine use

From shared bridge repository root:

```sh
set -a
source sites/susimacdonald/.wix-bridge-state/app.env
set +a
node src/cli.mjs snippets --manifest sites/susimacdonald/site.manifest.json --site susimacdonald --state-dir sites/susimacdonald/.wix-bridge-state
```

Refresh inventory (read-only Wix calls, updates local manifest):

```sh
node sites/susimacdonald/scripts/inventory.mjs --site susimacdonald
```

## Existing source and release boundary

Existing source repository inspected read-only: `/home/admin/susimacdonald-rentals` on authorized VPS `admin@216.238.93.99`, remote `weareheadless/susimacdonald-rentals`; checkout was clean. Its official Wix Git Integration connection is not established by that remote alone. Manifest `connectedRepo` remains null until an actual Wix-connected checkout is verified. Do not CLI publish this repository as if it contains a saved Wix UI version.

Existing startup covers cities, unit types, home, rentals and dynamic listings. Inventory also found unit-type-hub and disabled historic pilot/discovery entries. The initial/navigation controller hashes currently differ; preserve both during onboarding, compare against canonical source before a future authorized startup release, and never silently overwrite either. Human handles Editor placement and publication. Existing CMS dataset/filter/sort remains authoritative.
