import assert from "node:assert/strict";
import test from "node:test";
import { WixAppTokenProvider, WixCustomEmbedsClient, WixRevisionConflictError } from "../src/wix-client.mjs";

test("app token provider uses the documented client_credentials grant and caches before expiry", async () => {
  let calls = 0;
  let posted;
  const provider = new WixAppTokenProvider({
    appId: "app-id", appSecret: "app-secret", instanceId: "instance-id",
    fetchImpl: async (_url, init) => {
      calls += 1;
      posted = JSON.parse(init.body);
      return new Response(JSON.stringify({ access_token: "oauth-access-token", expires_in: 14400 }), { status: 200 });
    }
  });
  assert.equal(await provider.getToken(), "oauth-access-token");
  assert.equal(await provider.getToken(), "oauth-access-token");
  assert.equal(calls, 1);
  assert.deepEqual(posted, { grant_type: "client_credentials", client_id: "app-id", client_secret: "app-secret", instance_id: "instance-id" });
});

test("Custom Embed updates send explicit site context and the current revision", async () => {
  let request;
  const client = new WixCustomEmbedsClient({
    siteId: "site-123",
    tokenProvider: { getToken: async () => "app-access-token" },
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return new Response(JSON.stringify({ customEmbed: { id: "embed-1", revision: "8", embedData: { category: "ESSENTIAL", html: "new" } } }), { status: 200 });
    }
  });
  const current = { id: "embed-1", revision: "7", embedData: { category: "ESSENTIAL", html: "old" } };
  const updated = await client.updateHtml(current, "new");
  assert.equal(updated.revision, "8");
  assert.equal(request.init.headers.authorization, "app-access-token");
  assert.equal(request.init.headers["wix-site-id"], "site-123");
  assert.deepEqual(JSON.parse(request.init.body), { customEmbed: { id: "embed-1", revision: "7", embedData: { category: "ESSENTIAL", html: "new" } } });
});

test("Custom Embed creation uses the documented POST shape and explicit site context", async () => {
  let request;
  const client = new WixCustomEmbedsClient({
    siteId: "site-123",
    tokenProvider: { getToken: async () => "app-access-token" },
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return new Response(JSON.stringify({ customEmbed: { id: "embed-new", revision: "1", enabled: true, position: "BODY_END" } }), { status: 200 });
    }
  });
  const created = await client.create({
    name: "Prototype",
    enabled: true,
    loadOnce: false,
    position: "BODY_END",
    category: "FUNCTIONAL",
    html: "<script>prototype()</script>"
  });
  assert.equal(created.id, "embed-new");
  assert.equal(request.url, "https://www.wixapis.com/embeds/v1/custom-embeds");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.authorization, "app-access-token");
  assert.equal(request.init.headers["wix-site-id"], "site-123");
  assert.deepEqual(JSON.parse(request.init.body), {
    customEmbed: {
      name: "Prototype",
      enabled: true,
      loadOnce: false,
      position: "BODY_END",
      embedData: { category: "FUNCTIONAL", html: "<script>prototype()</script>" }
    }
  });
});

test("revision conflicts fail without retry", async () => {
  let calls = 0;
  const client = new WixCustomEmbedsClient({
    siteId: "site-123", tokenProvider: { getToken: async () => "app-access-token" },
    fetchImpl: async () => { calls += 1; return new Response("{}", { status: 409 }); }
  });
  await assert.rejects(() => client.updateHtml({ id: "embed-1", revision: "4", embedData: { category: "ESSENTIAL" } }, "new"), WixRevisionConflictError);
  assert.equal(calls, 1);
});

test("list operation follows Wix cursor pages", async () => {
  const seen = [];
  const client = new WixCustomEmbedsClient({
    siteId: "site-123", tokenProvider: { getToken: async () => "app-access-token" },
    fetchImpl: async (url) => {
      const requestUrl = new URL(url);
      seen.push(requestUrl.searchParams.get("paging.cursor"));
      if (seen.length === 1) return new Response(JSON.stringify({ customEmbeds: [{ id: "one" }], pagingMetadata: { hasNext: true, cursor: "cursor-2" } }), { status: 200 });
      return new Response(JSON.stringify({ customEmbeds: [{ id: "two" }], pagingMetadata: { hasNext: false, cursor: null } }), { status: 200 });
    }
  });
  assert.deepEqual((await client.listAll()).map((item) => item.id), ["one", "two"]);
  assert.deepEqual(seen, [null, "cursor-2"]);
});
