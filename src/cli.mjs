#!/usr/bin/env node
import { runOperation, outputText } from "./bridge.mjs";
import { safeError } from "./security.mjs";

function parseArgs(tokens) {
  const options = {};
  const positional = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "--apply") options.apply = true;
    else if (token === "--all-pages") options.allPages = true;
    else if (token === "--help" || token === "-h") options.help = true;
    else if (token.startsWith("--")) {
      const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = tokens[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`${token} requires a value.`);
      options[key] = value;
      i += 1;
    } else positional.push(token);
  }
  return { command: positional[0], options };
}

const help = `Wix Site Bridge

Usage: npm run bridge -- <operation> --manifest <file> --site <alias> [options]

Read-only/planning: inspect, doctor, snippets, snippet, build, plan, verify,
  create-snippet (requires --name and --html-file; use exact --route or --all-pages)
  update-snippet (requires --snippet and --html-file; use exact --route or --all-pages for an existing global embed)
Mutations (dry-run by default): create-snippet --apply, build --apply, snapshot --apply, deploy --apply,
  publish --apply, release --apply, restore --snapshot <release-id> --apply

Options: --site-repo <Wix-connected repo> --state-dir <private local state dir>
         --snippet <configured embed id> --snapshot <release id> --out <artifact path>
         --name <new embed name> --html-file <HTML fragment> --route </prototype-path>
         --all-pages (existing global embed only; preserves its all-pages scope)
         --position <HEAD|BODY_START|BODY_END> --category <Wix category>
         --enabled <true|false> --load-once <true|false> --category <Wix category>
         --mount-id <section-id> --mount-order <0..999> (append a stacked section)
         --from-category <current category, for an explicit category change>

Every operation requires an explicit target alias and a matching site ID in
WIX_ALLOWED_SITE_IDS. Custom Embeds also require a Wix app installation and
WIX_APP_ID, WIX_APP_SECRET, and WIX_APP_INSTANCE_ID. New embeds are page-wide
at the API level; use --all-pages for a sitewide startup packet, or pass an
exact non-root --route for a route-guarded embed. Pass both
--mount-id and --mount-order to append a section to the shared prototype root;
the manifest order determines the stack. Without them, the legacy single-embed
mode replaces that route's page content.\n`;

try {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || options.help) {
    process.stdout.write(help);
    process.exitCode = command ? 0 : 2;
  } else {
    const result = await runOperation(command, options, process.env, { transport: "cli" });
    process.stdout.write(`${outputText(result)}\n`);
    if (["partial", "failed", "blocked", "publish-failed", "drift"].includes(result.status)) process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(`${safeError(error, [process.env.WIX_APP_SECRET, process.env.WIX_CLI_API_KEY])}\n`);
  process.exitCode = 1;
}
