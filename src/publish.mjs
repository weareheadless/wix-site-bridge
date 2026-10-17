import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeRepoUrl, sha256 } from "./security.mjs";
import { resolveSource } from "./artifacts.mjs";

function git(repoPath, args) {
  const result = spawnSync("git", ["-C", repoPath, ...args], { encoding: "utf8" });
  if (result.error) throw new Error("Git is required to inspect the selected Wix source repository.");
  if (result.status !== 0) throw new Error(`Git preflight failed for ${args[0]}.`);
  return result.stdout.trim();
}

export async function inspectPublishTarget(site, repoPath) {
  if (!repoPath) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
  const root = path.resolve(repoPath);
  const branch = git(root, ["branch", "--show-current"]);
  if (branch !== site.defaultBranch) throw new Error(`Current branch ${branch || "(detached)"} does not match configured Wix default branch ${site.defaultBranch}.`);
  const workingTree = git(root, ["status", "--porcelain"]);
  if (workingTree) throw new Error("Wix source repository has uncommitted changes. Commit and push the selected release first.");
  const remote = git(root, ["remote", "get-url", "origin"]);
  if (normalizeRepoUrl(remote) !== site.connectedRepo.toLowerCase()) throw new Error("origin does not match the canonical Wix-connected repository in the manifest.");
  const head = git(root, ["rev-parse", "HEAD"]);
  const remoteHead = git(root, ["rev-parse", `refs/remotes/origin/${site.defaultBranch}`]);
  if (head !== remoteHead) throw new Error("Local HEAD does not match origin/default branch. Push or fetch before planning a release.");

  const configPath = resolveSource(root, site.wixConfigPath);
  const rawConfig = await readFile(configPath, "utf8");
  let config;
  try { config = JSON.parse(rawConfig); } catch { throw new Error(`${site.wixConfigPath} is not valid JSON.`); }
  if (config.siteId !== site.siteId) throw new Error(`${site.wixConfigPath} siteId does not match the explicitly selected Wix target.`);
  return {
    repoPath: root,
    branch,
    sourceCommit: head,
    remoteHead,
    connectedRepo: site.connectedRepo,
    wixConfigPath: site.wixConfigPath,
    uiConfigSha256: sha256(rawConfig),
    uiVersion: typeof config.uiVersion === "string" ? config.uiVersion : null
  };
}

export function checkWixCliAuth(env = process.env, exec = spawnSync) {
  let who = exec("wix", ["whoami"], { encoding: "utf8", stdio: "ignore" });
  if (who.error?.code === "ENOENT") throw new Error("Wix CLI for Sites is not installed. Install @wix/cli using Wix's official setup instructions.");
  if (who.status === 0) return { authenticated: true, method: "wix-cli-session" };
  if (!env.WIX_CLI_API_KEY) throw new Error("Wix CLI is not authenticated. Run `wix login`, or configure the Wix CLI for Sites API key in WIX_CLI_API_KEY.");
  const login = exec("wix", ["login", "--api-key", env.WIX_CLI_API_KEY], { encoding: "utf8", stdio: "ignore" });
  if (login.status !== 0) throw new Error("Wix CLI API-key authentication failed. No key or CLI output was logged.");
  return { authenticated: true, method: "wix-cli-api-key" };
}

export function invokeWixPublish(repoPath, { exec = spawnSync, env = process.env, stdio = "inherit" } = {}) {
  checkWixCliAuth(env, exec);
  const result = exec("wix", ["publish"], { cwd: repoPath, env, stdio, encoding: "utf8" });
  if (result.error) throw new Error("Could not start the Wix CLI publish command.");
  if (result.status !== 0) throw new Error(`Wix CLI publish exited with status ${result.status ?? "unknown"}. Custom Embed snippets were not updated.`);
  return { status: "published" };
}
