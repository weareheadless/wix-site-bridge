import assert from "node:assert/strict";
import test from "node:test";

import {
  WixSeoClient,
  canonicalPath,
  currentSeoValue,
  mergeSeoTags,
  pageItemForRoute,
} from "../src/wix-client.mjs";

function page(itemId, path, tags = []) {
  return {
    itemId,
    tags,
    resolvedTags: [
      {
        tag: { type: "link", props: { rel: "canonical", href: `https://www.example.com${path}` } },
        source: "TAG_SOURCE_DEFAULT_PATTERN",
      },
    ],
  };
}

test("finds a static page by its canonical route, not by its title", () => {
  const pages = [
    page("home", "/"),
    page("agenda", "/agenda-artisans-normandie"),
    page("about", "/a-propos"),
  ];
  assert.equal(pageItemForRoute(pages, "/agenda-artisans-normandie").itemId, "agenda");
  assert.equal(pageItemForRoute(pages, "/agenda-artisans-normandie/").itemId, "agenda");
  assert.equal(pageItemForRoute(pages, "/missing"), null);
  assert.equal(canonicalPath(pages[1]), "/agenda-artisans-normandie");
});

test("refuses an ambiguous canonical route", () => {
  const pages = [page("one", "/agenda"), page("two", "/agenda")];
  assert.throws(() => pageItemForRoute(pages, "/agenda"), /More than one static page/);
});

test("replaces only the title and description, keeping the page's other tags", () => {
  const tags = [
    { type: "title", children: "Old title" },
    { type: "meta", props: { name: "description", content: "Old description" } },
    { type: "meta", props: { property: "og:image", content: "https://example.com/a.jpg" } },
    { type: "link", props: { rel: "canonical", href: "https://example.com/agenda" } },
  ];
  assert.deepEqual(mergeSeoTags(tags, { title: "New title", description: "New description" }), [
    { type: "title", children: "New title" },
    { type: "meta", props: { name: "description", content: "New description" } },
    { type: "meta", props: { property: "og:image", content: "https://example.com/a.jpg" } },
    { type: "link", props: { rel: "canonical", href: "https://example.com/agenda" } },
  ]);
});

test("reads a meta description from props.content", () => {
  const item = {
    tags: [{ type: "meta", props: { name: "description", content: "A real description" }, children: "" }],
  };
  assert.equal(currentSeoValue(item, "meta", "description"), "A real description");
});

test("sets tags and publishes through the SEO API", async () => {
  const calls = [];
  const responses = [
    {
      itemSeoTags: [
        {
          itemId: "page-1",
          tags: [],
          resolvedTags: [
            { tag: { type: "link", props: { rel: "canonical", href: "https://www.example.com/agenda" } } },
          ],
        },
      ],
      pagingMetadata: { hasNext: false },
    },
    {
      itemSeoTags: {
        itemId: "page-1",
        tags: [
          { type: "title", children: "New title" },
          { type: "meta", props: { name: "description", content: "New description" } },
        ],
      },
    },
  ];
  const client = new WixSeoClient({
    siteId: "site-1",
    apiKey: "test-key",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(responses.shift()), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const pages = await client.listStaticPages();
  assert.equal(pages.length, 1);
  const updated = await client.setItemSeoTags(pages[0], { title: "New title", description: "New description" });
  assert.equal(updated.itemSeoTags.tags[0].children, "New title");
  const patch = calls[1];
  assert.match(patch.url, /\/STATIC_PAGE\/page-1$/);
  assert.equal(patch.init.method, "PATCH");
  assert.equal(patch.init.headers.authorization, "test-key");
  assert.equal(patch.init.headers["wix-site-id"], "site-1");
  const body = JSON.parse(patch.init.body);
  assert.equal(body.publish, true);
  assert.equal(body.fieldMask, "tags");
  assert.deepEqual(body.itemSeoTags.tags, [
    { type: "title", children: "New title" },
    { type: "meta", props: { name: "description", content: "New description" } },
  ]);
});

test("publishes the site through the Site Publisher API", async () => {
  const calls = [];
  const client = new WixSeoClient({
    siteId: "site-1",
    apiKey: "test-key",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  await client.publishSite();
  assert.match(calls[0].url, /site-publisher\/v1\/site\/publish$/);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.authorization, "test-key");
  assert.equal(calls[0].init.headers["wix-site-id"], "site-1");
});
