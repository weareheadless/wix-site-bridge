# Customer sites

The repository owns shared tooling in `src/` and customer-specific source under `sites/<alias>/`. Do not copy the bridge for each customer.

Each customer area contains:

- `AGENTS.md`: local design, placement, data, and release constraints.
- `site.manifest.json`: exact alias/site ID, permitted routes, components and deployed embed IDs.
- `prototype/`: independently mounted prototype section fragments, when used.
- `production/custom-elements/`: canonical visible component definitions.
- `production/custom-code/`: matching nonvisual early controller/packets.
- `scripts/`: site-specific deterministic assembly/release helpers.
- Documentation recording Wix placement, connected deployment repo, route coverage and rollout state.

Always run from the shared repository root and pass both the selected manifest and `--site`. Load only that customer's credentials into the process. Set `WIX_ALLOWED_SITE_IDS` to that site's exact ID for a deployment; do not use another customer's installation or source checkout. Keep private state in `sites/<alias>/.wix-bridge-state/` via `--state-dir`, or the explicitly recorded historical private state directory when restoring an older release.

Example:

```sh
npm run bridge -- inspect \
  --manifest sites/atelier-harmonie/site.manifest.json \
  --site atelier-harmonie \
  --state-dir sites/atelier-harmonie/.wix-bridge-state
```

Mutations remain dry-run unless the selected site/release is authorized and `--apply` is explicitly supplied. Do not infer a target or execute an automatic deployment across all customers. CLI `--site-repo` must identify the matching officially Wix-connected checkout; the shared bridge repository is not itself a substitute for that connection.

## Wix deployment repositories

The shared repository remains the customer-source workspace. Wix's Git Integration generates a dedicated connected repo for each Wix site. Only copy the selected customer's production files into that repo, respecting its existing page/master code and `wix.config.json`. Record both source revision and connected-repo revision; keep published UI, source and early packets synchronized. Never connect multiple customer sites to a shared deployment branch.

## Adding a customer

Start from `examples/new-site.manifest.json` after selecting the actual Wix site. Create a new alias directory and its own instructions/environment example. Do not reuse Atelier's IDs, copy, assets, credentials, deployment state, or tags. No other customer is authorized merely because its folder exists.
