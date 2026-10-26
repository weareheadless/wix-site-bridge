import { readFile, writeFile } from "node:fs/promises";
import { accessSync, constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import { normalizeRepoUrl, sha256 } from "./security.mjs";
import { resolveSource } from "./artifacts.mjs";

const localWixCli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.wix-cli/node_modules/.bin/wix");
const execFileAsync = promisify(execFile);
const REVISION_URL = "https://editor.wix.com/_serverless/typok/v1/site-revision";

export function wixExecutable() {
  try {
    accessSync(localWixCli, fsConstants.X_OK);
    return localWixCli;
  } catch {
    return "wix";
  }
}

function git(repoPath, args, exec = execFileAsync) {
  return exec("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  }).then((result) => result.stdout.trim());
}

function revisionNumber(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error("Wix did not return a valid site revision");
  return number;
}

export async function inspectPublishTarget(site, repoPath) {
  if (!repoPath) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
  if (!site.connectedRepo || !site.defaultBranch) throw new Error("The selected site manifest does not yet record its separate Wix-connected source repository and default branch.");
  const root = path.resolve(repoPath);
  const branch = await git(root, ["branch", "--show-current"]);
  if (branch !== site.defaultBranch) throw new Error(`Current branch ${branch || "(detached)"} does not match configured Wix default branch ${site.defaultBranch}.`);
  const workingTree = await git(root, ["status", "--porcelain"]);
  if (workingTree) throw new Error("Wix source repository has uncommitted changes. Commit and push the selected release first.");
  const remote = await git(root, ["remote", "get-url", "origin"]);
  if (normalizeRepoUrl(remote) !== site.connectedRepo.toLowerCase()) throw new Error("origin does not match the canonical Wix-connected repository in the manifest.");
  const head = await git(root, ["rev-parse", "HEAD"]);
  const remoteHead = await git(root, ["rev-parse", `refs/remotes/origin/${site.defaultBranch}`]);
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

export function checkWixCliAuth(env = process.env, exec = spawnSync, executable = wixExecutable()) {
  let who = exec(executable, ["whoami"], { encoding: "utf8", stdio: "ignore", env });
  if (who.error?.code === "ENOENT") throw new Error("Wix CLI for Sites is not installed. Install @wix/cli using Wix's official setup instructions.");
  if (who.status === 0) return { authenticated: true, method: "wix-cli-session" };
  if (!env.WIX_CLI_API_KEY) throw new Error("Wix CLI is not authenticated. Run `wix login`, or configure the Wix CLI for Sites API key in WIX_CLI_API_KEY.");
  const login = exec(executable, ["login", "--api-key", env.WIX_CLI_API_KEY], { encoding: "utf8", stdio: "ignore", env });
  if (login.status !== 0) throw new Error("Wix CLI API-key authentication failed. No key or CLI output was logged.");
  return { authenticated: true, method: "wix-cli-api-key" };
}

export async function getWixSiteRevision(siteId, options = {}) {
  const env = options.env ?? process.env;
  const exec = options.exec ?? execFileAsync;
  const fetchImpl = options.fetchImpl ?? fetch;
  const executable = options.executable ?? wixExecutable();
  const tokenResult = await exec(executable, ["token", "-s", siteId], {
    encoding: "utf8",
    env,
    timeout: 30_000,
  });
  const token = String(tokenResult.stdout || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).pop();
  if (!token) throw new Error(`Wix CLI did not return a site token for ${siteId}`);
  const response = await fetchImpl(REVISION_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "wix-cli",
      "X-XSRF-TOKEN": "nocheck",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Wix site revision lookup failed with HTTP ${response.status}`);
  const payload = await response.json();
  const raw = payload?.siteRevision?.revision;
  const revision = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  return { revision, number: revisionNumber(revision) };
}

async function assertCleanReleaseCommit(repoPath, gitSha, branch, exec) {
  const status = await git(repoPath, ["status", "--porcelain"], exec);
  if (status) throw new Error(`Site repository is not clean: ${status.split(/\r?\n/)[0]}`);
  const head = await git(repoPath, ["rev-parse", "HEAD"], exec);
  if (head !== gitSha) throw new Error(`Release commit ${gitSha} is not the repository HEAD`);
  const remote = await git(repoPath, ["rev-parse", `origin/${branch}`], exec);
  if (remote !== gitSha) throw new Error(`Release commit has not been pushed to origin/${branch}`);
}

async function syncWixUiVersion({ repoPath, siteId, branch, getRevision, exec }) {
  const revision = await getRevision(siteId);
  const configPath = path.join(repoPath, "wix.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (config.siteId !== siteId) throw new Error(`wix.config.json siteId ${config.siteId} does not match release site ${siteId}`);
  const current = await git(repoPath, ["rev-parse", "HEAD"], exec);
  if (String(config.uiVersion) === revision.revision) {
    return { changed: false, previousRevision: String(config.uiVersion), revision, commitSha: current };
  }
  const previousRevision = String(config.uiVersion);
  await writeFile(configPath, `${JSON.stringify({ ...config, uiVersion: revision.revision }, null, 2)}\n`, "utf8");
  await git(repoPath, ["add", "wix.config.json"], exec);
  await git(repoPath, ["commit", "-m", `chore: sync Wix UI revision to ${revision.revision}`], exec);
  await git(repoPath, ["push", "origin", branch], exec);
  const commitSha = await git(repoPath, ["rev-parse", "HEAD"], exec);
  return { changed: true, previousRevision, revision, commitSha };
}

async function runWixPublish(repoPath, env, exec) {
  const executable = wixExecutable();
  const result = await exec(executable, ["publish", "--source", "remote", "-y"], {
    cwd: repoPath,
    env: { ...env, CI: "1" },
    encoding: "utf8",
    timeout: 300_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  return { stdout: String(result.stdout || ""), stderr: String(result.stderr || "") };
}

export async function publishWixSite(input) {
  const repoPath = path.resolve(input.repoPath);
  const branch = input.branch ?? "main";
  const env = input.env ?? process.env;
  const exec = input.exec ?? execFileAsync;
  const getRevision = input.getRevision ?? ((siteId) => getWixSiteRevision(siteId, { env, exec, fetchImpl: input.fetchImpl }));
  const publish = input.publish ?? ((repoPathToPublish) => runWixPublish(repoPathToPublish, env, exec));

  await assertCleanReleaseCommit(repoPath, input.gitSha, branch, exec);
  const revisionBefore = await getRevision(input.siteId);
  const synced = await syncWixUiVersion({ repoPath, siteId: input.siteId, branch, getRevision: async () => revisionBefore, exec });
  const releaseSha = synced.commitSha;
  const releaseHead = await git(repoPath, ["rev-parse", "HEAD"], exec);
  const releaseRemote = await git(repoPath, ["rev-parse", `origin/${branch}`], exec);
  if (releaseHead !== releaseRemote) throw new Error(`The Wix UI revision commit has not been pushed to origin/${branch}`);

  const gate = await getRevision(input.siteId);
  if (gate.number !== revisionBefore.number) {
    throw new Error(`The Wix editor revision changed during release (${revisionBefore.revision} -> ${gate.revision}); retry the release`);
  }

  const published = await publish(repoPath);
  const reported = published.stdout.match(/UI version:\s*(\d+)/i)?.[1];
  if (reported && reported !== revisionBefore.revision) throw new Error(`Wix published UI version ${reported}, expected ${revisionBefore.revision}`);
  if (!reported) throw new Error("Wix publish did not report the UI version it used");
  if (!/published successfully|site has been published/i.test(published.stdout)) throw new Error("Wix publish did not return a successful publication result");
  if (/newer design changes/i.test(published.stdout)) throw new Error("Wix reported a concurrent editor revision during publish; retry the release");

  const revisionAfter = await getRevision(input.siteId);
  if (revisionAfter.number < revisionBefore.number) {
    throw new Error(`The Wix site revision moved backwards during publish (before ${revisionBefore.revision}, after ${revisionAfter.revision})`);
  }
  const previewUrl = published.stdout.match(/https:\/\/wix\.to\/[A-Za-z0-9]+/)?.[0] ?? null;
  return {
    codeSha: input.gitSha,
    releaseSha,
    revisionBefore,
    revisionPublished: revisionBefore,
    revisionAfter,
    previewUrl,
    output: published.stdout,
  };
}

export function invokeWixPublish(repoPath, { exec = spawnSync, env = process.env, stdio = "inherit", executable = wixExecutable(), args = [] } = {}) {
  checkWixCliAuth(env, exec, executable);
  const result = exec(executable, ["publish", ...args], { cwd: repoPath, env, stdio, encoding: "utf8" });
  if (result.error) throw new Error("Could not start the Wix CLI publish command.");
  if (result.status !== 0) throw new Error(`Wix CLI publish exited with status ${result.status ?? "unknown"}. Custom Embed snippets were not updated.`);
  return { status: "published" };
}
