import assert from "node:assert/strict";
import { stat, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { assertAllowedTarget, redact, writePrivateJson } from "../src/security.mjs";

const site = { alias: "new-test", siteId: "site-123" };

test("target allowlist requires both the exact alias and exact site ID", () => {
  assert.equal(assertAllowedTarget(site, "new-test", new Set(["site-123"])), site);
  assert.throws(() => assertAllowedTarget(site, "other", new Set(["site-123"])), /alias mismatch/);
  assert.throws(() => assertAllowedTarget(site, "new-test", new Set(["other-site"])), /not in WIX_ALLOWED_SITE_IDS/);
  assert.throws(() => assertAllowedTarget({ ...site, siteId: "REPLACE_ME" }, "new-test", new Set(["REPLACE_ME"])), /no configured Wix site ID/);
});

test("redaction removes secrets and credential-shaped values from tool output", () => {
  const input = `Authorization: secret-token api_key=key-123 client_secret: "secret-456"`;
  const output = redact(input, ["secret-token"]);
  assert.doesNotMatch(output, /secret-token|key-123|secret-456/);
  assert.match(output, /\[REDACTED\]/);
});

test("snapshots are written with owner-only permissions", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-state-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, "snapshots", "test.json");
  await writePrivateJson(file, { contents: "retained privately" });
  const mode = (await stat(file)).mode & 0o777;
  assert.equal(mode, 0o600);
});
