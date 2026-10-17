import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("MCP stdio handshake exposes documented bridge tools and explicit target checks", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-mcp-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = path.join(root, "site.json");
  await writeFile(manifest, JSON.stringify({
    version: 1,
    site: {
      alias: "mcp-test", siteId: "site-xyz", connectedRepo: "org/site-code", defaultBranch: "main",
      routes: [], components: [], customCode: []
    }
  }));
  const calls = [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "wix_bridge_inspect", arguments: { manifest, site: "mcp-test" } } }
  ];
  const child = spawnSync(process.execPath, ["src/mcp.mjs"], {
    cwd: path.resolve("."), encoding: "utf8", input: `${calls.map((call) => JSON.stringify(call)).join("\n")}\n`,
    env: { ...process.env, WIX_ALLOWED_SITE_IDS: "site-xyz" }, timeout: 5000
  });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stderr, "");
  const results = child.stdout.trim().split("\n").map((line) => JSON.parse(line));
  assert.equal(results.length, 3);
  assert.equal(results[0].result.protocolVersion, "2025-06-18");
  const toolNames = results[1].result.tools.map((tool) => tool.name);
  assert.ok(toolNames.includes("wix_bridge_release"));
  assert.ok(toolNames.includes("wix_bridge_restore"));
  const inspect = JSON.parse(results[2].result.content[0].text);
  assert.equal(inspect.allowlisted, true);
  assert.equal(inspect.target.alias, "mcp-test");
});
