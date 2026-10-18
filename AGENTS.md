# Wix Site Bridge instructions for coding agents

- Treat the site manifest and `WIX_ALLOWED_SITE_IDS` as a hard target boundary. Every site operation needs an explicit `--site` alias; never infer a target from a URL or repository name.
- Mutations are dry-run by default. Only pass `--apply` after the human has selected and authorized that site/release.
- The bridge repository is shared tooling. Edit a Wix site's separately connected source repository only when the user has selected that site and its local checkout.
- Use only the documented Wix Custom Embeds API and Wix CLI for Sites. Do not use browser cookies, copied session tokens, editor internals, or undocumented endpoints.
- Wix Custom Embeds calls require a Wix app or Wix user identity with `SCOPE.EDITOR.MANAGE_CUSTOM_EMBEDS`. An account API key is not a substitute.
- Do not change a snippet's placement or page scope through the bridge. The API exposes `pageFilter` as read-only; manifests declare expected scope so the bridge can fail closed if it changed.
- For a page built from stacked Custom Embeds, give every section its own self-contained HTML file, unique manifest `mountId`, and stable `mountOrder`. Use the same exact `routeGuard` for every section. The bridge appends each section under the shared prototype root and sorts by `mountOrder`, so load timing does not change the visual order. Never let a section replace the shared root or depend on another section's markup; repeat small shared styles when necessary. Keep all embed API placement and page scope unchanged.
- When creating or updating stacked sections, use an explicit `--site` alias and exact route, preview the dry-run, and only apply after authorization. After each applied update or create, inspect its receipt and confirm the manifest contains the returned embed ID and expected mount mapping. Keep the original site homepage untouched while building a hidden test route.
- Wix code publishing and snippet updates are separate, non-atomic operations. Review the release receipt and its recovery instructions after every applied release.
- Never commit secrets, local snapshots, or release receipts. Logs and tool output must redact credentials.
- Keep runtime CMS records and dataset behavior in Wix. Do not create a parallel data store.
- The native editor placement of custom elements and dataset bindings is a one-time Wix UI setup and must be documented, not represented as an API operation.

## CRITICAL — global startup performance gate for every production page

- Before homepage promotion, page creation, or any production page release, read `docs/GLOBAL_EARLY_REGISTRATION.md`. This mandatory contract comes from the inspected `susimacdonald-rentals` implementation; it is not optional polish.
- Every production route must have explicit coverage in the central early custom-element registry, including shared header definitions and dynamic routes. Keep the all-pages initial-load and per-navigation Head controllers synchronized, with matching guarded inline packets and normal Wix source fallback. Rebuild/deploy packets whenever their component source changes.
- Preload only the actual first hero image with matching responsive URLs; render hero copy without waiting for CMS, reserve saved desktop/mobile element AND section geometry, and defer only noncritical work. Confirm live content on fresh loads and internal navigation. Registration timing alone is not proof of paint or speed.
- Global Custom Code is for early registration/nonvisual startup. The current stacked root-injection prototype is a design reference, not the production placement architecture. Put production navigation in one real custom element inside Wix's shared header container, and page sections in proper Wix section elements. Remove replaced native visual children after preserving behavior; do not retain hidden duplicate navbar/footer layers or persistent document observers as a production solution.
- Block promotion until the required implementation and per-route coverage are recorded. Do not claim the reference site's pilot performance scores apply to Atelier. Keep explicit site authorization, existing API boundaries, recovery, CMS, and source-repository boundaries in force.

## Shared repository / customer areas

- Keep reusable bridge code in root `src/`; keep customer source, manifests, build scripts and placement notes under `sites/<alias>/`. Read that site's `AGENTS.md` before changing it. Never copy site IDs, credentials or source across customers.
- Use the selected `sites/<alias>/site.manifest.json` and explicit `--site` for every operation. Record isolated private state via `--state-dir`; historical recovery directories remain valid until their receipts are deliberately migrated. Do not batch-deploy all customer folders.
- Wix-connected deployment repositories remain site-specific. Sync only the selected customer's reviewed production artifacts, preserve its existing Wix code and UI configuration, and record both source/deployment revisions. Never treat a shared bridge folder or an unrelated headless project as an officially connected Wix checkout.
