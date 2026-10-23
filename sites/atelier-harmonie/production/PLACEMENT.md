# Atelier production placement — shared workflow

Target: `--site atelier-harmonie` / `376faa89-fe6c-4ae8-8feb-10520e813a89`.
The human handles Wix Editor placement and sizing. Agents handle source, bindings and startup code. Do not operate the Editor UI.

| Container | Wix element ID | Velo file | Tag |
| --- | --- | --- | --- |
| Shared header | `customElement1` | `atelier-navbar-v1.js` | `atelier-navbar-v1` |
| Homepage section | `customElement2` | `atelier-home-v1.js` | `atelier-home-v1` |
| Shared footer | `customElement3` | `atelier-footer-v1.js` | `atelier-footer-v1` |

The human confirmed these three placements. Select **Velo file** under Choose Source, then the corresponding file and exact tag. All files live in the connected repository's `src/public/custom-elements/`. The homepage source excludes footer markup. Header cart events use the documented Wix cart API. Essential SEO markup is generated from the matching component markup and assigned using these IDs.

## Source and startup status

Wix-connected repository: `weareheadless/atelier-harmonie`, main, source commit `556209f`. Shared customer sources live in `weareheadless/wix-site-bridge/sites/atelier-harmonie/`. Startup release `atelier-production-20261018-v2` has matching initial-load/per-navigation Head controllers and four compressed packets (navbar, two home parts, footer), installed using the Custom Embeds API. Their IDs and unchanged scope/placement are recorded in the site manifest; recovery snapshots/receipts are private.

## Remaining production gate

- Human confirms all source/tag selections and saved desktop/mobile geometry for each custom element AND its Wix container. Component self-sizing does not reserve the parent Wix section.
- Preserve existing contact/newsletter functionality through supported Wix integrations; the custom footer currently provides contact links, not a replacement submission form. Confirm what native forms remain before promotion.
- Complete route/header exception coverage and fresh-load/internal-navigation inspection. No performance score is claimed.
- Retire old prototype injection entries only after the production replacements are confirmed. Their scope/placement must not be altered.
- Do not publish the checkout's stale UI version 740 over the human's newer placement. Synchronize a supported current UI snapshot before CLI publication, or have the human publish the saved Editor layout after the gate is satisfied.

The production homepage migration is not yet verified or published by this release. Source push and startup snippet updates are separate, non-atomic operations; use private receipts for recovery.
