import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { restoreSnippets } from "../src/release.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(await readFile(path.join(root, "examples/intelligence-adapter-fixtures.json"), "utf8"));
const doc = await readFile(path.join(root, "docs/wix-intelligence-compatibility.md"), "utf8");

function hashHtml(html) {
  return createHash("sha256").update(html).digest("hex");
}

async function restoreCase(t, currentItems) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-restore-test-"));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const stateDir = path.join(temp, ".state");
  const snapshotId = "restore-case";
  await mkdir(path.join(stateDir, "snapshots"), { recursive: true });
  const declarations = currentItems.map(({ id }) => ({
    id, position: "HEAD", pageScope: { type: "all" }, category: "ESSENTIAL", loadOnce: true
  }));
  const items = currentItems.map(({ id }) => {
    const previous = {
      id, name: id, revision: "4", enabled: true, loadOnce: true, position: "HEAD",
      pageFilter: null, embedData: { category: "ESSENTIAL", html: `before:${id}` }
    };
    return {
      id, previous, beforeSha256: hashHtml(previous.embedData.html),
      desiredHtml: `desired:${id}`, desiredSha256: hashHtml(`desired:${id}`)
    };
  });
  await writeFile(path.join(stateDir, "snapshots", `${snapshotId}.json`), JSON.stringify({
    siteAlias: "demo", siteId: "site-123", items
  }));
  const embeds = new Map(currentItems.map(({ id, html, revision }) => [id, {
    id, name: id, revision, enabled: true, loadOnce: true, position: "HEAD", pageFilter: null,
    embedData: { category: "ESSENTIAL", html }
  }]));
  const updateRevisions = [];
  const client = {
    async get(id) { return structuredClone(embeds.get(id)); },
    async updateHtml(current, html) {
      const actual = embeds.get(current.id);
      updateRevisions.push(String(current.revision));
      if (String(actual.revision) !== String(current.revision)) throw new Error("stale revision");
      embeds.set(current.id, { ...actual, revision: String(Number(actual.revision) + 1), embedData: { ...actual.embedData, html } });
      return structuredClone(embeds.get(current.id));
    }
  };
  const site = { alias: "demo", siteId: "site-123", customCode: declarations };
  return { client, embeds, site, stateDir, snapshotId, updateRevisions };
}

test("CrawlSEO consumer calls map to existing MCP tools or explicit unsupported outcomes", async () => {
  const response = execFileSync(process.execPath, ["src/mcp.mjs"], {
    cwd: root,
    encoding: "utf8",
    input: `${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" })}\n`,
  });
  const result = JSON.parse(response.trim());
  const tools = new Set(result.result.tools.map(({ name }) => name));
  assert.equal(fixture.schemaVersion, "wix-bridge-compatibility/1");
  assert.equal(fixture.bridge.baseline, "1f9baca1c70c2e46c33bc022aa239bd9d35a4959");
  assert.equal(fixture.bridge.hostRevision, "1146444e7af997b37ff5ca4ac5ea2cdcfaebed31");
  assert.match(fixture.bridge.consumerRevision, /^[a-f0-9]{40}$/);
  for (const consumer of fixture.consumers) {
    if (consumer.cli === null) {
      assert.equal(consumer.status, "unsupported");
      assert.equal(consumer.cli, null);
      assert.equal(consumer.mcp, null);
      assert.ok(consumer.unsupportedFlags.length > 0);
      continue;
    }
    assert.ok(tools.has(consumer.mcp), `${consumer.consumer} must map to ${consumer.mcp}`);
    assert.ok(doc.includes(consumer.operation), `${consumer.operation} must be covered by the compatibility inventory`);
  }
  const release = fixture.consumers.find(({ operation }) => operation === "release");
  assert.equal(release.status, "partial_compatibility");
  assert.equal(release.hostOnly.flagBehavior, "parsed_but_unused");
  assert.equal(release.hostOnly.unattendedPublishAuthorized, false);
  const updateSnippet = fixture.consumers.find(({ operation }) => operation === "update-snippet");
  assert.equal(updateSnippet.status, "unsupported");
  assert.equal(updateSnippet.hostOnly.cli, "update-snippet");
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
  assert.match(scenarios.get("release_code_published_then_embed_conflict"), /final_partial_receipt_records_codePublished_true_and_snapshot_source_identity/);
  assert.match(scenarios.get("release_code_published_then_embed_conflict"), /no_standalone_publish_receipt/);
  assert.match(scenarios.get("mcp_publish_apply"), /requires_local_terminal/);
  assert.equal(scenarios.get("restore_hash_matches_before"), "no_op_without_update");
  assert.match(scenarios.get("restore_hash_matches_desired"), /fetched_revision_cas/);
  assert.equal(scenarios.get("restore_hash_is_other"), "block_all_restore_writes_before_mutation");
});

test("restore uses content hashes and current revisions to decide whether writes are safe", async (t) => {
  await t.test("before hash is a no-op even when its revision changed", async (t) => {
    const state = await restoreCase(t, [{ id: "embed-one", html: "before:embed-one", revision: "12" }]);
    const result = await restoreSnippets({ ...state, apply: true });
    assert.equal(result.status, "no-op");
    assert.equal(result.plan[0].status, "unchanged");
    assert.deepEqual(state.updateRevisions, []);
  });

  await t.test("desired hash restores with the freshly fetched revision", async (t) => {
    const state = await restoreCase(t, [{ id: "embed-one", html: "desired:embed-one", revision: "23" }]);
    const result = await restoreSnippets({ ...state, apply: true });
    assert.equal(result.status, "complete");
    assert.deepEqual(state.updateRevisions, ["23"]);
    assert.equal(state.embeds.get("embed-one").embedData.html, "before:embed-one");
  });

  await t.test("any other hash blocks all restore writes before mutation", async (t) => {
    const state = await restoreCase(t, [
      { id: "embed-one", html: "desired:embed-one", revision: "23" },
      { id: "embed-two", html: "intervening edit", revision: "31" }
    ]);
    const result = await restoreSnippets({ ...state, apply: true });
    assert.equal(result.status, "blocked");
    assert.deepEqual(result.plan.map(({ status }) => status), ["restore", "conflict"]);
    assert.deepEqual(state.updateRevisions, []);
    assert.equal(state.embeds.get("embed-one").embedData.html, "desired:embed-one");
  });
});
