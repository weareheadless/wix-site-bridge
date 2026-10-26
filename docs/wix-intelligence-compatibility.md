# Wix intelligence adapter compatibility inventory

Status: UI-013 inventory for Wix Bridge `main` at `1f9baca1c70c2e46c33bc022aa239bd9d35a4959` (`package.json` version `0.1.0`). This is a repository-source comparison, not a Wix tenant test or a platform API certification. The machine-readable rows and intentional incompatibilities live in `examples/intelligence-adapter-fixtures.json` and are checked by `test/centralized-intelligence.test.mjs`.

## Contract and trust boundaries

- All operations load one v1 site manifest, require the exact `--site` alias, and compare that alias's manifest `siteId` against `WIX_ALLOWED_SITE_IDS`. The manifest binds the connected repository, branch, configured embed IDs, placement and page scope. IDs/URLs do not select a target. The bridge has no project/workspace knowledge identity; that remains a consumer-side mapping.
- Custom Embed API calls use Wix's documented `https://www.wixapis.com/embeds/v1/custom-embeds` API and the documented Wix OAuth token endpoint. The bridge obtains a site-scoped app token from `WIX_APP_ID`, `WIX_APP_SECRET`, and `WIX_APP_INSTANCE_ID`; the app needs `SCOPE.EDITOR.MANAGE_CUSTOM_EMBEDS`. Account API keys, browser cookies, editor internals, undocumented endpoints and user-session identity are not accepted substitutes. Wix CLI publish uses the separately authenticated interactive Wix CLI.
- The package has a bridge version (`0.1.0`) and MCP protocol negotiation (`2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`). The Wix Custom Embeds URL is not versioned by this project; do not imply that the package/MCP version pins Wix's upstream API schema.
- `--apply` gates local artifact/snapshot writes, Custom Embed writes and restore. CLI `publish --apply` and `release --apply` invoke Wix CLI and require its interactive confirmation. MCP publish/release `apply=true` returns `requires-local-terminal`; it does not silently publish. A custom embed update can affect the next live render immediately. This interface is not a safe queue or an exact approval receipt by itself.

## Consumer operation and flag mapping

| Consumer request (CrawlSEO `lib/bridge/client.ts`) | Current Wix Bridge mapping | Result / compatibility |
| --- | --- | --- |
| `inspectBridgeSite(alias, siteRepo?)` -> `inspect` | CLI `inspect --manifest --site [--site-repo]`; MCP `wix_bridge_inspect` | Supported: target/readiness inspection; no Wix API request. |
| `planBridgeSite(alias, siteRepo)` -> `plan` | CLI `plan --manifest --site --site-repo`; MCP `wix_bridge_plan` | Supported: compares the source-derived packet with configured embed contents; read-only. |
| `deployBridgeSite(alias, siteRepo, apply?)` -> `deploy` | CLI `deploy --manifest --site --site-repo [--apply]`; MCP `wix_bridge_deploy` | Supported with explicit target and default dry-run. Apply updates embeds only, CAS by Wix revision, and can be partial/immediately live. |
| `releaseBridgeSite(alias, siteRepo)` -> `release --apply --non-interactive` | CLI `release --apply`; MCP `wix_bridge_release` | **Not compatible as requested.** `--non-interactive` is not in CLI help or parser semantics; CLI release requires the interactive Wix CLI confirmation. MCP deliberately returns `requires-local-terminal`. Do not strip the interaction requirement or fake success. |
| `verifyBridgeSite(alias, siteRepo)` -> `verify` | CLI `verify --manifest --site --site-repo`; MCP `wix_bridge_verify` | Supported: checks embed content hashes and optional live URL HTTP response. It does not prove fresh DOM, visual behavior, editor state, or publication correctness. |
| `readBridgeSnippet(alias, snippetId)` -> `snippet --snippet` | CLI `snippet --manifest --site --snippet`; MCP `wix_bridge_read_snippet` | Supported only for manifest-configured IDs and matching scope/placement. The public bridge output redacts configured secrets; not a general Wix data read. |
| `updateBridgeSnippet(alias, snippetId, htmlFile, apply?, preserveScope=true)` -> `update-snippet --snippet --html-file --preserve-scope` | No matching CLI command or MCP tool. Closest operations are `build`, `plan` and `deploy`. | **Unsupported.** `update-snippet`, `--html-file` and `--preserve-scope` are not current generic-bridge operations/flags. Do not alias this to `deploy`: the semantics and source of HTML differ. The generic bridge only writes generated component packets declared by the manifest. |

These mismatches are explicit handoff items for UI-014's consumer producer/consumer PR, not a mandate to add compatibility flags here. UI-013 does not change either repository's runtime, auth, command parser, or customer artifacts.

## Generic bridge capabilities and outcomes

| Capability | Current operation | Effect class | Preconditions and outcome |
| --- | --- | --- | --- |
| Target/auth/repository preflight | `inspect` / `doctor` | Read-only local | Exact alias and allowed site ID; optional separately-connected Wix repo inspected locally. Credential readiness is reported without contacting Wix. |
| Embed inventory / configured read | `snippets`, `snippet` | Read | Documented Custom Embeds API. `snippet` requires an ID in the selected manifest and exact configured placement/page scope. |
| Generate component packet | `build` | Private local preparation | Requires source repo; deterministic gzip/base64 artifact. Writes only with `--apply`; output directory/state files are local, private. |
| Compare desired and current embed | `plan` | Read-only preparation | Requires source repo; validates exact embed ID, category/load-once, placement and page scope. No mutation. |
| Save rollback input | `snapshot` | Private local preparation | Default is plan-only; `--apply` stores private snapshot of currently configured embeds. Snapshot is not a platform rollback for published code. |
| Apply generated embeds | `deploy` | Immediately-live embed mutation | Default dry-run; `--apply` writes only changed manifest-declared embeds with current revision, re-reads and verifies hash/scope. Revision conflict stops for re-read/re-plan. Failure after earlier writes returns `partial`; no automatic retries. |
| Publish Wix-connected code | `publish` | Code publication | Wix CLI preflight; default is plan. CLI `--apply` runs interactive `wix publish`, then writes a publish receipt. MCP apply yields a terminal command. Code publish is distinct from embed writes. |
| Combined release | `release` | Code publish then immediate embed mutation | Default is plan. CLI apply saves snapshot/receipt and executes code publish before revision-checked embed updates. These stages are non-atomic; embed failure after code publication is an explicit partial/recovery case. MCP apply yields a terminal command. |
| Verify | `verify` | Read-only observation | API hash comparison plus optional live URL HTTP status only; fresh DOM/desktop/mobile review is still required. |
| Restore embed snapshot | `restore --snapshot <id>` | Immediately-live embed mutation | Dry-run by default; with `--apply`, checks all current revisions/hashes before writing and refuses intervening edits. Restores embeds only; source rollback is a separate Git revert and Wix CLI publish. Partial restore stays explicit. |
| Native Wix UI | No bridge operation | Manual editor action | Initial custom-element placement/dataset binding and any unsupported editor work remains an owner/operator task; not inferred from code publish or represented as API success. |

## Phase receipts and recovery

The receipt state is not a single atomic “published” fact: `release-operation.mjs` writes a `publishing` receipt before code publish, then records `publish-failed` if that phase fails; after code publish, embed deployment has its own `complete`, `failed`, or `partial` result and nested snapshot/receipt IDs. A later retry must inspect the exact receipt, current source and embed revisions. Never repeat the previous plan blindly or overwrite an intervening Wix edit. `restore` is a compare-before-write operation for embeds; it does not roll back code. A disconnected/lost response can leave an uncertain external effect and requires fresh reads before any retry.

The first adapter contract can therefore promise: explicit target identity, read-only inspection/plan, private deterministic preparation, documented Wix Custom Embed read/write with revision checks, distinct interactive code publication, and phase-specific receipts/recovery. It cannot promise one atomic Wix release, an unattended MCP publish, arbitrary snippet HTML updates, a generalized Wix CMS writer, or visual/readback correctness beyond the stated checks.
