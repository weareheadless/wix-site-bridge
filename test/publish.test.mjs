import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getWixSiteRevision, publishWixSite } from "../src/publish.mjs";

const roots = [];

test.afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "wix-bridge-publish-"));
  roots.push(root);
  const remote = path.join(root, "remote.git");
  const repo = path.join(root, "repo");
  git(root, "init", "--bare", "-b", "main", remote);
  await mkdir(repo);
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "bridge-publish@example.invalid");
  git(repo, "config", "user.name", "Bridge Publish");
  await writeFile(path.join(repo, "wix.config.json"), `${JSON.stringify({ siteId: "site-123", uiVersion: "729" }, null, 2)}\n`);
  git(repo, "add", "wix.config.json");
  git(repo, "commit", "-m", "initial");
  git(repo, "remote", "add", "origin", remote);
  git(repo, "push", "-u", "origin", "main");
  return { repo, remote };
}

function revision(number) {
  return { revision: String(number), number };
}

test("publish syncs a stale Wix UI revision, publishes, and verifies", async (t) => {
  const { repo, remote } = await fixture(t);
  const codeSha = git(repo, "rev-parse", "HEAD");
  const revisions = [revision(848), revision(848), revision(848)];
  let call = 0;
  let published = null;

  const result = await publishWixSite({
    repoPath: repo,
    siteId: "site-123",
    gitSha: codeSha,
    getRevision: async () => revisions[call++],
    publish: async (repoPath) => {
      published = repoPath;
      return { stdout: "UI version: 848\nYour site has been published successfully: https://www.example.com/", stderr: "" };
    },
  });

  assert.equal(published, repo);
  assert.equal(result.revisionBefore.revision, "848");
  assert.equal(result.revisionAfter.revision, "848");
  assert.equal(JSON.parse(await readFile(path.join(repo, "wix.config.json"), "utf8")).uiVersion, "848");
  assert.equal(git(remote, "rev-parse", "main"), git(repo, "rev-parse", "HEAD"));
  assert.match(result.output, /published successfully/);
});

test("publish rejects a concurrent editor revision before running Wix", async (t) => {
  const { repo } = await fixture(t);
  const codeSha = git(repo, "rev-parse", "HEAD");
  const revisions = [revision(848), revision(849)];
  let call = 0;
  let published = false;

  await assert.rejects(() => publishWixSite({
    repoPath: repo,
    siteId: "site-123",
    gitSha: codeSha,
    getRevision: async () => revisions[call++],
    publish: async () => {
      published = true;
      return { stdout: "UI version: 848\nYour site has been published successfully", stderr: "" };
    },
  }), /editor revision changed during release/);
  assert.equal(published, false);
});

test("publish rejects the Wix newer-editor caution", async (t) => {
  const { repo } = await fixture(t);
  const codeSha = git(repo, "rev-parse", "HEAD");
  const revisions = [revision(848), revision(848)];
  let call = 0;

  await assert.rejects(() => publishWixSite({
    repoPath: repo,
    siteId: "site-123",
    gitSha: codeSha,
    getRevision: async () => revisions[call++],
    publish: async () => ({
      stdout: "UI version: 848\nCaution: The Editor contains newer design changes.\nYour site has been published successfully",
      stderr: "",
    }),
  }), /concurrent editor revision/);
});

test("revision lookup uses a site-scoped token", async () => {
  const result = await getWixSiteRevision("site-123", {
    exec: async () => ({ stdout: "ignored\nOauthNG.test-token\n", stderr: "" }),
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ siteRevision: { revision: "848" } }),
    }),
  });
  assert.deepEqual(result, { revision: "848", number: 848 });
});
