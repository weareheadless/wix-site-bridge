import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runOperation } from "../src/bridge.mjs";

const siteId = "site-create-test";

async function makeFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-create-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = path.join(root, "manifest.json");
  const htmlFile = path.join(root, "prototype.html");
  const stateDir = path.join(root, "state");
  await writeFile(manifest, JSON.stringify({
    version: 1,
    site: { alias: "atelier-test", siteId, routes: ["/"], components: [], customCode: [] }
  }));
  await writeFile(htmlFile, "<main><h1>Prototype</h1><script>window.prototypeLoaded = true</script></main>");
  return { root, manifest, htmlFile, stateDir, env: { WIX_ALLOWED_SITE_IDS: siteId } };
}

function createArgs(fixture, extra = {}) {
  return {
    manifest: fixture.manifest,
    site: "atelier-test",
    stateDir: fixture.stateDir,
    name: "Atelier Prototype",
    htmlFile: fixture.htmlFile,
    route: "/atelier-prototype",
    ...extra
  };
}

test("create-snippet dry-run is route-specific, target-checked, and makes no API call", async (t) => {
  const fixture = await makeFixture(t);
  const result = await runOperation("create-snippet", createArgs(fixture), fixture.env);
  assert.equal(result.status, "dry-run");
  assert.equal(result.target.siteId, siteId);
  assert.equal(result.wouldCreate.routeGuard, "/atelier-prototype");
  assert.equal(result.wouldCreate.apiPageScope, "all pages (pageFilter is read-only)");
  assert.equal(Object.hasOwn(result.wouldCreate, "html"), false);
  await assert.rejects(() => stat(fixture.stateDir), { code: "ENOENT" });
  await assert.rejects(() => runOperation("create-snippet", createArgs(fixture, { route: "/" }), fixture.env), /non-root page path/);
  await assert.rejects(() => runOperation("create-snippet", createArgs(fixture), {}), /not in WIX_ALLOWED_SITE_IDS/);
});

test("create-snippet apply sends a guarded embed and writes a private receipt", async (t) => {
  const fixture = await makeFixture(t);
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, init = {}) => {
    const address = String(url);
    requests.push({ address, init });
    if (address === "https://www.wixapis.com/oauth2/token") {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), { status: 200 });
    }
    if (address.startsWith("https://www.wixapis.com/embeds/v1/custom-embeds")) {
      if (!init.method || init.method === "GET") return new Response(JSON.stringify({ customEmbeds: [], pagingMetadata: { hasNext: false } }), { status: 200 });
      const body = JSON.parse(init.body);
      return new Response(JSON.stringify({ customEmbed: {
        id: "embed-created", revision: "1", name: body.customEmbed.name, enabled: body.customEmbed.enabled,
        loadOnce: body.customEmbed.loadOnce, position: body.customEmbed.position,
        embedData: body.customEmbed.embedData, pageFilter: null
      } }), { status: 200 });
    }
    throw new Error(`Unexpected request ${address}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const env = {
    ...fixture.env,
    WIX_APP_ID: "app-id",
    WIX_APP_SECRET: "app-secret",
    WIX_APP_INSTANCE_ID: "instance-id"
  };
  const result = await runOperation("create-snippet", createArgs(fixture, { apply: true }), env);
  const createRequest = requests.find(({ address, init }) => address.endsWith("/custom-embeds") && init.method === "POST");
  assert.ok(createRequest);
  const body = JSON.parse(createRequest.init.body);
  const embedHtml = body.customEmbed.embedData.html;
  assert.match(embedHtml, /currentPath !== "\/atelier-prototype"/);
  assert.match(embedHtml, /document\.body\.replaceChildren\(root\)/);
  assert.match(embedHtml, /\\u003cmain>/);
  assert.equal(body.customEmbed.position, "BODY_END");
  assert.equal(body.customEmbed.embedData.category, "FUNCTIONAL");
  assert.equal(createRequest.init.headers["wix-site-id"], siteId);
  assert.equal(result.status, "created");
  assert.equal(result.customEmbedId, "embed-created");
  assert.deepEqual(result.confirmedPageScope, { type: "all" });
  const receipt = JSON.parse(await readFile(result.receiptPath, "utf8"));
  assert.equal(receipt.customEmbedId, "embed-created");
  assert.equal(Object.hasOwn(receipt, "html"), false);
  assert.equal((await stat(result.receiptPath)).mode & 0o777, 0o600);
});
