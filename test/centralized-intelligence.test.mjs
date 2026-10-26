import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(await readFile(path.join(root, "examples/intelligence-adapter-fixtures.json"), "utf8"));
const doc = await readFile(path.join(root, "docs/wix-intelligence-compatibility.md"), "utf8");

test("CrawlSEO consumer calls map to existing MCP tools or explicit unsupported outcomes", async () => {
  const response = execFileSync(process.execPath, ["src/mcp.mjs"], {
    cwd: root,
    encoding: "utf8",
    input: `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`,
  });
  const result = JSON.parse(response.trim());
  const tools = new Set(result.result.tools.map(({ name }) => name));
  assert.equal(fixture.schemaVersion, "wix-bridge-compatibility/1");
  for (const consumer of fixture.consumers) {
    if (consumer.status === "unsupported") {
      assert.equal(consumer.cli, null);
      assert.equal(consumer.mcp, null);
      assert.ok(consumer.unsupportedFlags.length > 0);
      continue;
    }
    assert.ok(tools.has(consumer.mcp), `${consumer.consumer} must map to ${consumer.mcp}`);
    assert.ok(doc.includes(consumer.operation), `${consumer.operation} must be covered by the compatibility inventory`);
  }
  const help = execFileSync(process.execPath, ["src/cli.mjs", "inspect", "--help"], { cwd: root, encoding: "utf8" });
  for (const missing of ["update-snippet", "--html-file", "--preserve-scope", "--non-interactive"]) {
    assert.equal(help.includes(missing), false, `${missing} must not be claimed as supported by CLI help`);
  }
  for (const present of ["inspect", "build", "plan", "deploy", "publish", "release", "verify", "restore"]) {
    assert.ok(help.includes(present), `${present} must be represented in the CLI inventory`);
  }
});

test("capability fixture distinguishes read, local preparation, live embed apply and manual editor work", () => {
  const effects = new Set(fixture.capabilities.map(({ effect }) => effect));
  for (const expected of ["read", "private_preparation", "immediately_live_embed_apply", "code_publish", "manual_editor"]) {
    assert.ok(effects.has(expected), `missing capability boundary ${expected}`);
  }
  assert.match(doc, /WIX_ALLOWED_SITE_IDS/);
  assert.match(doc, /SCOPE\.EDITOR\.MANAGE_CUSTOM_EMBEDS/);
  assert.match(doc, /cannot promise one atomic Wix release/);
});

test("partial, stale and interactive-CLI outcomes stay explicit in consumer fixtures", () => {
  const scenarios = new Map(fixture.scenarios.map(({ name, expected }) => [name, expected]));
  assert.match(scenarios.get("stale_embed_revision"), /stop_without_retry/);
  assert.match(scenarios.get("release_code_published_then_embed_conflict"), /partial_embed_outcome/);
  assert.match(scenarios.get("intervening_edit_before_restore"), /refuse_all_restore_writes/);
  assert.match(scenarios.get("mcp_publish_apply"), /requires_local_terminal/);
});
