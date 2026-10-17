import assert from "node:assert/strict";
import test from "node:test";
import { validateManifest, selectSite } from "../src/manifest.mjs";

function validManifest() {
  return {
    version: 1,
    site: {
      alias: "demo", siteId: "site-123", connectedRepo: "org/site-code", defaultBranch: "main", routes: ["/"],
      components: [{ name: "card", source: "src/public/card.js", tagName: "x-card", wixElementIds: ["cardElement"], datasetBindings: [] }],
      customCode: [{ id: "embed-1", position: "HEAD", pageScope: { type: "all" }, component: "card", category: "ESSENTIAL", loadOnce: true }]
    }
  };
}

test("manifest preserves explicit site, element, dataset, and snippet scope configuration", () => {
  const manifest = validateManifest(validManifest());
  assert.equal(manifest.site.components[0].wixElementIds[0], "cardElement");
  assert.equal(manifest.site.customCode[0].pageScope.type, "all");
  assert.equal(selectSite(manifest, "demo").siteId, "site-123");
  assert.throws(() => selectSite(manifest, ""), /explicit --site alias/);
  assert.throws(() => selectSite(manifest, "another"), /selected target/);
});

test("manifest rejects invalid custom-element tags and duplicate configured embed IDs", () => {
  const badTag = validManifest();
  badTag.site.components[0].tagName = "invalid";
  assert.throws(() => validateManifest(badTag), /must contain a hyphen/);
  const duplicate = validManifest();
  duplicate.site.customCode.push({ ...duplicate.site.customCode[0] });
  assert.throws(() => validateManifest(duplicate), /Duplicate custom code ID/);
});
