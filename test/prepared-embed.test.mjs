import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { applyPreparedEmbed, capabilityDeclaration, planPreparedEmbed, reconcilePreparedEmbed } from "../src/prepared-embed.mjs";
import { outputText } from "../src/bridge.mjs";

const site = { alias: "demo", siteId: "site-1", customCode: [{ id: "embed-1", position: "HEAD", pageScope: { type: "all" }, category: "ESSENTIAL", loadOnce: true }] };

function client(overrides = {}) {
  let embed = { id: "embed-1", revision: "7", position: "HEAD", pageFilter: null, loadOnce: true, embedData: { category: "ESSENTIAL", html: "before" } };
  const calls = { get: 0, update: 0 };
  return {
    calls,
    async get() { calls.get++; if (overrides.readError) throw Error("offline"); return structuredClone(embed); },
    async updateHtml(current, html) {
      calls.update++;
      if (overrides.updateError) { if (overrides.mutateThenError) embed = { ...embed, revision: "8", embedData: { ...embed.embedData, html } }; throw overrides.updateError; }
      if (String(current.revision) !== embed.revision) { const error = Error("conflict"); error.name = "WixRevisionConflictError"; error.status = 409; throw error; }
      embed = { ...embed, revision: "8", embedData: { ...embed.embedData, html } };
    },
    set(next) { embed = structuredClone(next); },
    current() { return structuredClone(embed); }
  };
}

async function fixture(t) {
  const stateDir = await mkdtemp(path.join(os.tmpdir(), "prepared-embed-"));
  t.after(() => rm(stateDir, { recursive: true, force: true }));
  return stateDir;
}

async function prepare(stateDir, api, html = "<b>prepared</b>") {
  const result = await planPreparedEmbed({ site, stateDir, client: api, snippetId: "embed-1", html });
  return result.plan;
}

test("capability declaration is versioned, bounded, and has no intelligence activation", () => {
  const declaration = capabilityDeclaration();
  assert.equal(declaration.contract, "wix-prepared-embed/1");
  assert.equal(declaration.capabilities.preparedEmbedApply, true);
  assert.equal(declaration.capabilities.arbitraryEmbedUpdate, false);
  assert.equal(declaration.capabilities.intelligenceBinding, false);
});

test("plan/apply keeps HTML private and persists intent before a single verified mutation", async (t) => {
  const stateDir = await fixture(t); const api = client(); const plan = await prepare(stateDir, api);
  assert.equal("html" in plan, false);
  assert.doesNotMatch(outputText(plan), /<b>prepared<\/b>/);
  assert.equal(api.calls.update, 0);
  const saved = JSON.parse(await readFile(path.join(stateDir, "prepared-embeds", `${plan.planId}.json`), "utf8"));
  assert.equal(saved.html, "<b>prepared</b>");
  const update = api.updateHtml.bind(api);
  api.updateHtml = async (...args) => {
    const intent = JSON.parse(await readFile(path.join(stateDir, "prepared-embeds", `${plan.planId}.intent.json`), "utf8"));
    assert.equal(intent.status, "applying");
    return update(...args);
  };
  const result = await applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 });
  assert.equal(result.status, "complete"); assert.equal(api.calls.update, 1);
  assert.equal((await stat(result.receiptPath)).mode & 0o777, 0o600);
  assert.equal((await applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 })).status, "complete");
  assert.equal(api.calls.update, 1);
});

test("stale revision, wrong hash, and scope drift fail before mutation", async (t) => {
  const stateDir = await fixture(t); const api = client(); const plan = await prepare(stateDir, api);
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: "wrong" }), /hash/);
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir, client: api, planId: "different-plan", expectedSha256: plan.desiredSha256 }), /ENOENT/);
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir, client: api, planId: "../../escape", expectedSha256: plan.desiredSha256 }), /invalid/);
  api.set({ ...api.current(), revision: "8" });
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 }), /stale/);
  const second = await prepare(stateDir, client()); const scoped = client();
  scoped.set({ ...scoped.current(), pageFilter: { pageIds: ["page-x"] } });
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir, client: scoped, planId: second.planId, expectedSha256: second.desiredSha256 }), /scope/);
  assert.equal(api.calls.update + scoped.calls.update, 0);
});

test("concurrent apply performs one mutation and duplicate caller is blocked", async (t) => {
  const stateDir = await fixture(t); const api = client(); const plan = await prepare(stateDir, api);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const original = api.updateHtml.bind(api);
  api.updateHtml = async (...args) => { await gate; return original(...args); };
  const first = applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 });
  await new Promise((resolve) => setTimeout(resolve, 20));
  const second = await applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 });
  assert.equal(second.status, "blocked"); release();
  assert.equal((await first).status, "complete"); assert.equal(api.calls.update, 1);
});

test("lost response after mutation is reconciled by readback without a retry", async (t) => {
  const stateDir = await fixture(t); const api = client({ mutateThenError: true, updateError: Error("socket lost") }); const plan = await prepare(stateDir, api);
  const applied = await applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 });
  assert.equal(applied.status, "uncertain");
  const result = await reconcilePreparedEmbed({ site, stateDir, client: api, planId: plan.planId });
  assert.equal(result.status, "reconciled"); assert.equal(result.uncertaintyRetained, true); assert.equal(api.calls.update, 1);
});

test("readback mismatch and unavailable state remain uncertain; receipt persistence interruption never mutates", async (t) => {
  const stateDir = await fixture(t); const api = client({ updateError: Object.assign(Error("server"), { status: 500 }) }); const plan = await prepare(stateDir, api);
  assert.equal((await applyPreparedEmbed({ site, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 })).status, "uncertain");
  assert.equal((await reconcilePreparedEmbed({ site, stateDir, client: api, planId: plan.planId })).status, "uncertain");
  const state2 = await fixture(t); const api2 = client(); const plan2 = await prepare(state2, api2);
  let writes = 0;
  const writer = async (file, value) => {
    writes++;
    if (String(file).endsWith(`${plan2.planId}.receipt.json`)) throw Error("disk full");
    const { writePrivateJson } = await import("../src/security.mjs");
    await writePrivateJson(file, value);
  };
  await assert.rejects(() => applyPreparedEmbed({ site, stateDir: state2, client: api2, planId: plan2.planId, expectedSha256: plan2.desiredSha256, writeJson: writer }), /disk full/);
  assert.equal(writes, 2);
  assert.equal(api2.calls.update, 0);
});

test("candidate is bound to target and unsupported identifiers are rejected", async (t) => {
  const stateDir = await fixture(t); const api = client(); const plan = await prepare(stateDir, api);
  await assert.rejects(() => applyPreparedEmbed({ site: { ...site, alias: "other" }, stateDir, client: api, planId: plan.planId, expectedSha256: plan.desiredSha256 }), /different target/);
  await assert.rejects(() => planPreparedEmbed({ site, stateDir, client: api, snippetId: "unknown", html: "<p>x</p>" }), /declared/);
});
