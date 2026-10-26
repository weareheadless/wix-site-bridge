#!/usr/bin/env node
import { runOperation, outputText } from "./bridge.mjs";
import { safeError } from "./security.mjs";
import { pathToFileURL } from "node:url";

export function exitCodeForStatus(status) {
  return ["partial", "failed", "blocked", "uncertain", "publish-failed", "drift"].includes(status) ? 2 : 0;
}

function parseArgs(tokens) {
  const options = {};
  const positional = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === "--apply") options.apply = true;
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

Read-only/planning: inspect, doctor, snippets, snippet, build, plan, verify, prepared-embed-plan, prepared-embed-reconcile
Mutations (dry-run by default): build --apply, snapshot --apply, deploy --apply, prepared-embed-apply --plan-id <id> --expected-sha256 <hash> --apply,
  publish --apply, release --apply, restore --snapshot <release-id> --apply

Options: --site-repo <Wix-connected repo> --state-dir <private local state dir>
         --snippet <configured embed id> --snapshot <release id> --out <artifact path>
         --html <prepared HTML> --plan-id <prepared plan id> --expected-sha256 <reviewed desired hash>

Every operation requires an explicit target alias and a matching site ID in
WIX_ALLOWED_SITE_IDS. Custom Embeds also require a Wix app installation and
WIX_APP_ID, WIX_APP_SECRET, and WIX_APP_INSTANCE_ID.\n`;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));
    if (!command || options.help) {
      process.stdout.write(help);
      process.exitCode = command ? 0 : 2;
    } else {
      const result = await runOperation(command, options, process.env, { transport: "cli" });
      process.stdout.write(`${outputText(result)}\n`);
      process.exitCode = exitCodeForStatus(result.status);
    }
  } catch (error) {
    process.stderr.write(`${safeError(error, [process.env.WIX_APP_SECRET, process.env.WIX_CLI_API_KEY])}\n`);
    process.exitCode = 1;
  }
}
