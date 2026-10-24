#!/usr/bin/env node
import { createInterface } from "node:readline";
import { runOperation, outputText } from "./bridge.mjs";
import { safeError } from "./security.mjs";

const string = { type: "string" };
const baseProperties = {
  manifest: { ...string, description: "Path to the selected site's manifest." },
  site: { ...string, description: "Explicit site alias from that manifest; also checked against WIX_ALLOWED_SITE_IDS." },
  siteRepo: { ...string, description: "Local checkout of the separately Wix-connected source repository." },
  stateDir: { ...string, description: "Private local directory for snapshots and receipts. Defaults to .wix-bridge-state." }
};
const baseRequired = ["manifest", "site"];
const baseSchema = (extra = {}, required = []) => ({
  type: "object",
  properties: { ...baseProperties, ...extra },
  required: [...baseRequired, ...required],
  additionalProperties: false
});

const tools = [
  { name: "wix_bridge_inspect", description: "Check target allowlisting, local Wix repository state, and credential readiness without contacting Wix.", inputSchema: baseSchema() , operation: "inspect" },
  { name: "wix_bridge_list_snippets", description: "List Wix Custom Embeds with revision, placement, page scope, and content hashes; code is not returned.", inputSchema: baseSchema(), operation: "snippets" },
  { name: "wix_bridge_read_snippet", description: "Read one configured Wix Custom Embed. HTML is redacted before it is returned.", inputSchema: baseSchema({ snippet: { ...string, description: "Configured Custom Embed ID." } }, ["snippet"]), operation: "snippet" },
  { name: "wix_bridge_create_snippet", description: "Create a Wix Custom Embed through the documented API. Dry-run by default. Because Wix applies new embeds to all pages and pageFilter is read-only, the bridge wraps the supplied HTML with an exact non-root route guard.", inputSchema: baseSchema({ name: { ...string, description: "Unique Wix Custom Embed name (1–100 characters)." }, htmlFile: { ...string, description: "Local HTML fragment to insert on the guarded route." }, route: { ...string, description: "Exact non-root path, for example /atelier-prototype." }, position: { ...string, description: "HEAD, BODY_START, or BODY_END." }, category: { ...string, description: "Wix consent category; defaults to FUNCTIONAL." }, enabled: { type: "boolean", default: true }, loadOnce: { type: "boolean", default: false }, apply: { type: "boolean", default: false } }, ["name", "htmlFile", "route"]), operation: "create-snippet" },
  { name: "wix_bridge_build_artifact", description: "Generate the deterministic gzip/base64 packet from the selected site's component source. Dry-run by default; set apply=true to write the artifact locally.", inputSchema: baseSchema({ apply: { type: "boolean", default: false }, out: string }, ["siteRepo"]), operation: "build" },
  { name: "wix_bridge_plan", description: "Compare component-derived packet artifacts with the configured live Wix snippets without changing them.", inputSchema: baseSchema({}, ["siteRepo"]), operation: "plan" },
  { name: "wix_bridge_snapshot", description: "Save the current configured Custom Embed contents privately for recovery. Set apply=true to write the snapshot; default is dry-run.", inputSchema: baseSchema({ apply: { type: "boolean", default: false } }), operation: "snapshot" },
  { name: "wix_bridge_deploy", description: "Update configured Wix Custom Embeds using their current revisions. Updates may take effect on the next site render. Dry-run by default; set apply=true to mutate.", inputSchema: baseSchema({ apply: { type: "boolean", default: false } }, ["siteRepo"]), operation: "deploy" },
  { name: "wix_bridge_publish", description: "Preflight/publish the Wix-connected site's committed code using the verified publication transaction: sync the current Wix UI revision, publish remote code, and require a successful revision-safe result.", inputSchema: baseSchema({ apply: { type: "boolean", default: false } }, ["siteRepo"]), operation: "publish" },
  { name: "wix_bridge_release", description: "Plan or run a concise release: verified Wix code publication first, then revision-checked Custom Embed updates.", inputSchema: baseSchema({ apply: { type: "boolean", default: false } }, ["siteRepo"]), operation: "release" },
  { name: "wix_bridge_verify", description: "Compare current configured Wix snippet hashes with generated source artifacts and check the configured live URL for an HTTP response. This does not replace fresh DOM and desktop/mobile visual checks.", inputSchema: baseSchema({}, ["siteRepo"]), operation: "verify" },
  { name: "wix_bridge_restore", description: "Restore only Custom Embed contents from a prior applied release, using current revisions and refusing to overwrite intervening edits. Dry-run by default; set apply=true to mutate.", inputSchema: baseSchema({ snapshot: { ...string, description: "Release or snapshot ID returned by a prior deployment." }, apply: { type: "boolean", default: false } }, ["snapshot"]), operation: "restore" }
];

const protocolVersions = new Set(["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]);
let negotiatedVersion = null;

function response(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function toolResult(value, isError = false) {
  return { content: [{ type: "text", text: outputText(value) }], isError };
}

export async function handleMessage(message, env = process.env, options = {}) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return errorResponse(message?.id ?? null, -32600, "Invalid JSON-RPC request.");
  }
  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") return null;
  if (message.method === "initialize") {
    const requested = message.params?.protocolVersion;
    if (!protocolVersions.has(requested)) return errorResponse(message.id, -32602, `Unsupported protocol version. Supported versions: ${[...protocolVersions].join(", ")}.`);
    negotiatedVersion = requested;
    return response(message.id, {
      protocolVersion: negotiatedVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "wix-site-bridge", version: "0.1.0" },
      instructions: "All site actions require explicit manifest and site alias. Mutation tools are dry-run unless apply=true. Wix publish uses the verified UI-revision transaction and runs non-interactively."
    });
  }
  if (message.method === "ping") return response(message.id, {});
  if (message.method === "tools/list") return response(message.id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (message.method === "tools/call") {
    if (!Object.hasOwn(message, "id")) return null;
    const tool = tools.find((candidate) => candidate.name === message.params?.name);
    if (!tool) return errorResponse(message.id, -32602, `Unknown tool: ${message.params?.name}`);
    const args = message.params?.arguments ?? {};
    if (!args.manifest || !args.site) return errorResponse(message.id, -32602, "Both manifest and explicit site alias are required.");
    try {
      const result = await runOperation(tool.operation, args, env, { ...options, transport: "mcp" });
      const isError = ["partial", "failed", "blocked", "publish-failed", "drift"].includes(result.status);
      return response(message.id, toolResult(result, isError));
    } catch (error) {
      return response(message.id, toolResult({ error: safeError(error, [env.WIX_APP_SECRET, env.WIX_CLI_API_KEY]) }, true));
    }
  }
  if (!Object.hasOwn(message, "id")) return null;
  return errorResponse(message.id, -32601, `Method not found: ${message.method}`);
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity, terminal: false });
for await (const line of input) {
  if (!line.trim()) continue;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    write(errorResponse(null, -32700, "Parse error."));
    continue;
  }
  try {
    const result = await handleMessage(message);
    if (result) write(result);
  } catch (error) {
    process.stderr.write(`${safeError(error, [process.env.WIX_APP_SECRET, process.env.WIX_CLI_API_KEY])}\n`);
    if (Object.hasOwn(message, "id")) write(errorResponse(message.id, -32603, "Internal server error."));
  }
}
