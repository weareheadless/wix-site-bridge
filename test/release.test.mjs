import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { deploySnippets, planSnippetDeployment, restoreSnippets } from "../src/release.mjs";
import { executeRelease } from "../src/release-operation.mjs";
import { WixRevisionConflictError } from "../src/wix-client.mjs";

function makeSite() {
  const snippet = (id) => ({ id, position: "HEAD", pageScope: { type: "all" }, component: "card", category: "ESSENTIAL", loadOnce: true });
  return {
    alias: "demo", siteId: "site-123", connectedRepo: "weareheadless/site-code", defaultBranch: "main", wixConfigPath: "wix.config.json",
    components: [{ name: "card", source: "src/public/card.js", tagName: "x-card" }],
    customCode: [snippet("embed-one"), snippet("embed-two")]
  };
}

function fakeClient(ids = ["embed-one", "embed-two"], failIds = []) {
  const embeds = new Map(ids.map((id) => [id, { id, name: id, revision: "1", enabled: true, loadOnce: true, position: "HEAD", pageFilter: null, embedData: { category: "ESSENTIAL", html: `old:${id}` } }]));
  const failures = new Set(failIds);
  const counts = { gets: 0, updates: 0 };
  return {
    embeds, counts,
    async get(id) { counts.gets += 1; return structuredClone(embeds.get(id)); },
    async updateHtml(current, html) {
      counts.updates += 1;
      if (failures.has(current.id)) throw new WixRevisionConflictError(409);
      const actual = embeds.get(current.id);
      if (String(actual.revision) !== String(current.revision)) throw new WixRevisionConflictError(409);
      embeds.set(current.id, { ...actual, revision: String(Number(actual.revision) + 1), embedData: { ...actual.embedData, html } });
      return structuredClone(embeds.get(current.id));
    }
  };
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceFile = path.join(root, "src/public/card.js");
  await mkdir(path.dirname(sourceFile), { recursive: true });
  await writeFile(sourceFile, "if (!customElements.get('x-card')) customElements.define('x-card', class extends HTMLElement {});");
  return { root, stateDir: path.join(root, ".state"), site: makeSite() };
}

test("dry-run deployment compares hashes but performs no writes or snippet updates", async (t) => {
  const { root, stateDir, site } = await fixture(t);
  const client = fakeClient();
  const result = await deploySnippets({ site, sourceRoot: root, client, stateDir });
  assert.equal(result.status, "dry-run");
  assert.equal(result.changed, 2);
  assert.equal(client.counts.updates, 0);
  await assert.rejects(() => stat(stateDir));
});

test("revision conflicts fail closed with one request and no automatic retry", async (t) => {
  const { root, stateDir, site } = await fixture(t);
  const client = fakeClient(["embed-one"], ["embed-one"]);
  site.customCode = [site.customCode[0]];
  const result = await deploySnippets({ site, sourceRoot: root, client, stateDir, apply: true });
  assert.equal(result.status, "failed");
  assert.equal(result.failed.snippetId, "embed-one");
  assert.equal(client.counts.updates, 1);
  const saved = await readFile(result.snapshotPath, "utf8");
  assert.match(saved, /old:embed-one/);
});

test("a failed second update leaves an explicit partial receipt and rollback restores only applied snippets", async (t) => {
  const { root, stateDir, site } = await fixture(t);
  const client = fakeClient(["embed-one", "embed-two"], ["embed-two"]);
  const deployed = await deploySnippets({ site, sourceRoot: root, client, stateDir, apply: true });
  assert.equal(deployed.status, "partial");
  assert.deepEqual(deployed.updated, ["embed-one"]);
  assert.equal(deployed.failed.snippetId, "embed-two");
  assert.equal(JSON.parse(await readFile(deployed.receiptPath, "utf8")).status, "partial");

  const rollback = await restoreSnippets({ site, snapshotId: deployed.snapshotId, client, stateDir, apply: true });
  assert.equal(rollback.status, "complete");
  assert.deepEqual(rollback.restored, ["embed-one"]);
  assert.equal(client.embeds.get("embed-one").embedData.html, "old:embed-one");
  assert.equal(client.embeds.get("embed-two").embedData.html, "old:embed-two");
});

test("restore refuses to overwrite a snippet changed after the release", async (t) => {
  const { root, stateDir, site } = await fixture(t);
  const client = fakeClient(["embed-one"], []);
  site.customCode = [site.customCode[0]];
  const deployed = await deploySnippets({ site, sourceRoot: root, client, stateDir, apply: true });
  client.embeds.set("embed-one", { ...client.embeds.get("embed-one"), revision: "9", embedData: { category: "ESSENTIAL", html: "someone else's update" } });
  const result = await restoreSnippets({ site, snapshotId: deployed.snapshotId, client, stateDir, apply: true });
  assert.equal(result.status, "blocked");
  assert.equal(client.embeds.get("embed-one").embedData.html, "someone else's update");
  assert.equal(client.counts.updates, 1);
});

test("page scope or placement drift blocks updates before any mutation", async (t) => {
  const { root, site } = await fixture(t);
  const client = fakeClient(["embed-one"], []);
  site.customCode = [site.customCode[0]];
  client.embeds.set("embed-one", { ...client.embeds.get("embed-one"), pageFilter: { pageIds: ["page-1"] } });
  await assert.rejects(() => planSnippetDeployment({ site, sourceRoot: root, client }), /page scope differs/);
  assert.equal(client.counts.updates, 0);
});

function git(root, ...args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function gitFixture(t) {
  const { root, stateDir, site } = await fixture(t);
  await writeFile(path.join(root, "wix.config.json"), JSON.stringify({ siteId: site.siteId, uiVersion: "ui-v7" }));
  git(root, "init", "-b", "main");
  git(root, "config", "user.email", "bridge-test@example.invalid");
  git(root, "config", "user.name", "Bridge Test");
  git(root, "add", ".");
  git(root, "commit", "-m", "test source");
  git(root, "remote", "add", "origin", "https://github.com/weareheadless/site-code.git");
  git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
  return { root, stateDir, site };
}

test("release records a code publish failure and never changes snippets after that failure", async (t) => {
  const { root, stateDir, site } = await gitFixture(t);
  const client = fakeClient(["embed-one"], []);
  site.customCode = [site.customCode[0]];
  const result = await executeRelease({
    site, sourceRoot: root, client, stateDir, apply: true,
    publish: async () => { throw new Error("simulated CLI publish failure"); }
  });
  assert.equal(result.status, "publish-failed");
  assert.equal(client.counts.updates, 0);
  assert.equal(JSON.parse(await readFile(result.receiptPath, "utf8")).codePublished, false);
});

test("release publishes pinned source before updating snippets and saves the UI config hash", async (t) => {
  const { root, stateDir, site } = await gitFixture(t);
  const client = fakeClient(["embed-one"], []);
  site.customCode = [site.customCode[0]];
  const order = [];
  const updateHtml = client.updateHtml.bind(client);
  client.updateHtml = async (...args) => {
    order.push("snippet-update");
    return updateHtml(...args);
  };
  const result = await executeRelease({
    site, sourceRoot: root, client, stateDir, apply: true,
    publish: async (repo) => { order.push(`publish:${repo}`); }
  });
  assert.equal(result.status, "complete");
  assert.match(result.uiConfigSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(order, [`publish:${root}`, "snippet-update"]);
  assert.equal(client.counts.updates, 1);
  assert.equal(result.codePublished, true);
});
