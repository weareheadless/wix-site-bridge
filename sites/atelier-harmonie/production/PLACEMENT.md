# Atelier production placement — shared workflow

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target: `--site atelier-harmonie` / `376faa89-fe6c-4ae8-8feb-10520e813a89`.
The human handles Wix Editor placement and sizing. Agents handle source, bindings and startup code. Do not operate the Editor UI.

| Container | Wix element ID | Velo file | Tag |
| --- | --- | --- | --- |
| Shared header | `customElement1` | `atelier-navbar-v1.js` | `atelier-navbar-v1` |
| Homepage section | `customElement2` | `atelier-home-v1.js` | `atelier-home-v1` |
| Shared footer | `customElement3` | `atelier-footer-v1.js` | `atelier-footer-v1` |

The human confirmed these three placements. Select **Velo file** under Choose Source, then the corresponding file and exact tag. All files live in the connected repository's `src/public/custom-elements/`. The homepage source excludes footer markup. Header cart events use the documented Wix cart API. Essential SEO markup is generated from the matching component markup and assigned using these IDs.

## Historical source and startup status (v2, superseded)

Wix-connected repository: `weareheadless/atelier-harmonie`, main, source commit `556209f`. Shared customer sources live in `weareheadless/wix-site-bridge/sites/atelier-harmonie/`. Startup release `atelier-production-20261018-v2` has matching initial-load/per-navigation Head controllers and four compressed packets (navbar, two home parts, footer), installed using the Custom Embeds API. Their IDs and unchanged scope/placement are recorded in the site manifest; recovery snapshots/receipts are private.

## Historical v2 placement checklist (not current release status)

- Human confirms all source/tag selections and saved desktop/mobile geometry for each custom element AND its Wix container.
- Preserve existing contact/newsletter functionality through supported Wix integrations; the custom footer currently provides contact links, not a replacement submission form. Confirm what native forms remain before promotion.
- Complete route/header exception coverage and fresh-load/internal-navigation inspection. No performance score is claimed.
- Retire old prototype injection entries only after the production replacements are confirmed. Their scope/placement must not be altered.
- Do not publish the checkout's stale UI version 740 over the human's newer placement. Synchronize a supported current UI snapshot before CLI publication, or have the human publish the saved Editor layout after the gate is satisfied.

That v2 release did not establish publication; current performance recovery is documented in PERFORMANCE_GEOMETRY.md. Source push and startup snippet updates are separate, non-atomic operations; use private receipts for recovery.
