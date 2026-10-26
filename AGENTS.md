# Wix Site Bridge instructions for coding agents

- Treat the site manifest and `WIX_ALLOWED_SITE_IDS` as a hard target boundary. Every site operation needs an explicit `--site` alias; never infer a target from a URL or repository name.
- Mutations are dry-run by default. Only pass `--apply` after the human has selected and authorized that site/release.
- The bridge repository is shared tooling. Edit a Wix site's separately connected source repository only when the user has selected that site and its local checkout.
- Use only the documented Wix Custom Embeds API and Wix CLI for Sites. Do not use browser cookies, copied session tokens, editor internals, or undocumented endpoints.
- Wix Custom Embeds calls require a Wix app or Wix user identity with `SCOPE.EDITOR.MANAGE_CUSTOM_EMBEDS`. An account API key is not a substitute.
- Do not change a snippet's placement or page scope through the bridge. The API exposes `pageFilter` as read-only; manifests declare expected scope so the bridge can fail closed if it changed.
- Wix code publishing and snippet updates are separate, non-atomic operations. Review the release receipt and its recovery instructions after every applied release.
- Never commit secrets, local snapshots, or release receipts. Logs and tool output must redact credentials.
- Keep runtime CMS records and dataset behavior in Wix. Do not create a parallel data store.
- The native editor placement of custom elements and dataset bindings is a one-time Wix UI setup and must be documented, not represented as an API operation.
## Agent task coordination

For UI/OPS implementation work, follow `docs/agent-coordination.md`: claim one
Ready issue with the actual run ID and bounded plan, keep an early draft PR,
record real tests and hand off for latest-diff manager review. Scope changes
require explicit replanning; agents stop before merge or deployment. Reuse the
shared key and existing Project, issues and CI; do not add a bot-management system.
