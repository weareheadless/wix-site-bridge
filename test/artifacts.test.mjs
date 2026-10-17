import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { generateArtifacts, makeGzipPacket, resolveSource } from "../src/artifacts.mjs";

test("gzip packet generation is deterministic and contains the exact source", () => {
  const source = "customElements.define('x-card', class extends HTMLElement {});";
  const first = makeGzipPacket(source, "x-card");
  const second = makeGzipPacket(source, "x-card");
  assert.equal(first.html, second.html);
  assert.equal(first.artifactHash, second.artifactHash);
  const encoded = first.html.match(/const b=("[^"]+")/)[1];
  const payload = JSON.parse(encoded);
  assert.equal(gunzipSync(Buffer.from(payload, "base64")).toString("utf8"), source);
  assert.notEqual(first.artifactHash, makeGzipPacket(`${source}\n`, "x-card").artifactHash);
});

test("artifact generation reads only from the chosen site repository", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-source-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourcePath = path.join(root, "src/public/custom-elements/card.js");
  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, "class Card extends HTMLElement {};");
  const site = {
    components: [{ name: "card", source: "src/public/custom-elements/card.js", tagName: "x-card" }],
    customCode: [{ id: "embed-1", component: "card" }]
  };
  const first = await generateArtifacts(site, root);
  assert.equal(first.get("embed-1").sourcePath, site.components[0].source);
  assert.throws(() => resolveSource(root, "../../outside.js"), /inside the selected Wix repository/);
  assert.throws(() => resolveSource(root, sourcePath), /must be relative/);
});
