# Wix Site Bridge instructions for coding agents

## Atelier Harmonie connection handoff

The approved Atelier target is the Wix site alias `atelier-harmonie`, site ID
`376faa89-fe6c-4ae8-8feb-10520e813a89`, with Wix app instance ID
`bb98e489-7ba5-461b-b510-ac1c1dddbf68`. The connected source repository is
`weareheadless/atelier-harmonie`; the separate
`weareheadless/atelier-harmonie-headless` repository is not this Wix deployment.

The bridge checkout on the box is `/home/admin/wix-site-bridge`. The customer
manifest is `sites/atelier-harmonie/site.manifest.json`, and customer-specific
instructions are in `sites/atelier-harmonie/AGENTS.md`. Run all customer
commands from the bridge repository root and pass `--site atelier-harmonie`
explicitly every time.

The bridge requires these environment names, mapped from the installed Wix app
credentials: `WIX_APP_ID`, `WIX_APP_SECRET`, `WIX_APP_INSTANCE_ID`, and
`WIX_ALLOWED_SITE_IDS`. Never print their values, commit them, or substitute
another customer's credentials. The verified local Mac source for the app ID
and secret is `/private/tmp/wix-app-setup-clean/atelier-embed-bridge/.env.local`
(`WIX_CLIENT_ID` maps to `WIX_APP_ID`; `WIX_CLIENT_SECRET` maps to
WIX_APP_SECRET is mapped from WIX_CLIENT_SECRET. The box copy is /ATELIER/.wix-bridge.env with mode 600; source it without printing values, map the two WIX_CLIENT names, and keep it outside Git.
The site allowlist must remain exactly 376faa89-fe6c-4ae8-8feb-10520e813a89.
Safe connection check, after secure environment injection, from
`/home/admin/wix-site-bridge`:

```sh
node --input-type=module <<'JS'
import { WixAppTokenProvider, WixCustomEmbedsClient } from './src/wix-client.mjs';
const tokenProvider = WixAppTokenProvider.fromEnv();
const token = await tokenProvider.getToken();
const identityResponse = await fetch('https://www.wixapis.com/apps/v1/instance', {
  headers: { authorization: token },
});
if (!identityResponse.ok) throw new Error(`Identity HTTP ${identityResponse.status}`);
const identity = await identityResponse.json();
if (identity.site?.siteId !== process.env.WIX_ALLOWED_SITE_IDS) throw new Error('Site identity mismatch');
const embeds = await new WixCustomEmbedsClient({
  siteId: process.env.WIX_ALLOWED_SITE_IDS,
  tokenProvider,
}).listAll();
console.log(JSON.stringify({
  authenticated: true,
  siteId: identity.site.siteId,
  embeds: embeds.length,
  changesMade: false,
}));
JS
```

For Atelier lamp category work, the current Wix custom element is `catlampes`
with tag `atelier-lamp-category-v1`; its source belongs in the connected
repository under `src/public/custom-elements/`, and the dynamic page binding is
`src/pages/LAMPES (Item).pyd4k.js`. Preserve the native Wix catalog, cart,
checkout, locale handling, and Editor layout. The current released source
revision is `8744568`; the route-aware bridge startup entry is recorded in the
private receipt for embed ID `41e2873b-2a99-4747-b1b6-156878469855`.

- This project uses our own installed Wix bridge app and Wix CLI. The ChatGPT/Codex Wix plugin is not a deployment dependency. Never stop bridge work or ask the human to install that plugin merely because its connector tools are unavailable; use the existing bridge app identity and documented APIs. Check the app's actual permissions before reporting a capability blocker. Additional API capabilities require documented contracts and explicitly authorized site scope; never silently add app permissions.

- Treat the site manifest and `WIX_ALLOWED_SITE_IDS` as a hard target boundary. Every site operation needs an explicit `--site` alias; never infer a target from a URL or repository name.
- Mutations are dry-run by default. Only pass `--apply` after the human has selected and authorized that site/release.
- The bridge repository is shared tooling. Edit a Wix site's separately connected source repository only when the user has selected that site and its local checkout.
- Use the documented Wix Custom Embeds API and Wix CLI for Sites. Explicitly approved site capabilities, such as Multilingual translation-content reads/writes, may use their documented APIs through our bridge app within the approved scopes. Do not use browser cookies, copied session tokens, editor internals, or undocumented endpoints.
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
- Preload only the actual first hero image with matching responsive URLs and defer noncritical work. Confirm live content on fresh loads and internal navigation. Registration timing alone is not proof of paint or speed.
- Global Custom Code is for early registration/nonvisual startup. The current stacked root-injection prototype is a design reference, not the production placement architecture. Put production navigation in one real custom element inside Wix's shared header container, and page sections in proper Wix section elements. Remove replaced native visual children after preserving behavior; do not retain hidden duplicate navbar/footer layers or persistent document observers as a production solution.
- Block promotion until the required implementation and per-route coverage are recorded. Do not claim the reference site's pilot performance scores apply to Atelier. Keep explicit site authorization, existing API boundaries, recovery, CMS, and source-repository boundaries in force.

## Shared repository / customer areas

- Keep reusable bridge code in root `src/`; keep customer source, manifests, build scripts and placement notes under `sites/<alias>/`. Read that site's `AGENTS.md` before changing it. Never copy site IDs, credentials or source across customers.
- Use the selected `sites/<alias>/site.manifest.json` and explicit `--site` for every operation. Record isolated private state via `--state-dir`; historical recovery directories remain valid until their receipts are deliberately migrated. Do not batch-deploy all customer folders.
- Wix-connected deployment repositories remain site-specific. Sync only the selected customer's reviewed production artifacts, preserve its existing Wix code and UI configuration, and record both source/deployment revisions. Never treat a shared bridge folder or an unrelated headless project as an officially connected Wix checkout.

## Shared placement workflow

- The human handles Wix Editor placement, section removal, sizing and element settings. Agents must not operate the Wix Editor UI unless the human explicitly changes this workflow.
- Agents build and push component source, Velo bindings and synchronized global startup packets. Give the human precise file names, tag names, element IDs and sizing instructions when placement is required.
- Do not publish using a stale local UI snapshot after the human edits layout. The human's saved Editor layout is authoritative; synchronize it through a supported workflow before any CLI publish, or ask the human to publish from the Editor after release readiness is confirmed.
