import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { generateArtifacts } from "./artifacts.mjs";
import { loadManifest, selectSite } from "./manifest.mjs";
import { inspectPublishTarget, invokeWixPublish, wixExecutable } from "./publish.mjs";
import { executeRelease, planRelease } from "./release-operation.mjs";
import { deploySnippets, inspectSnippets, planSnapshot, planSnippetDeployment, readConfiguredSnippet, restoreSnippets, snapshotSnippets } from "./release.mjs";
import { assertAllowedTarget, newId, redact, sha256, targetAllowlist, writePrivateJson } from "./security.mjs";
import { WixAppTokenProvider, WixCustomEmbedsClient } from "./wix-client.mjs";

function secretValues(env) {
  return [env.WIX_APP_SECRET, env.WIX_CLI_API_KEY, env.WIX_CUSTOM_EMBEDS_ACCESS_TOKEN];
}

export async function loadContext(args, env = process.env) {
  if (!args.manifest) throw new Error("Pass --manifest with the selected site's manifest.");
  const { manifest } = await loadManifest(args.manifest);
  const site = selectSite(manifest, args.site);
  assertAllowedTarget(site, args.site, targetAllowlist(env));
  const stateDir = path.resolve(args.stateDir ?? ".wix-bridge-state");
  return { site, stateDir, env, sourceRoot: args.siteRepo ? path.resolve(args.siteRepo) : null, manifestPath: path.resolve(args.manifest) };
}

function clientFor(site, env) {
  return new WixCustomEmbedsClient({ siteId: site.siteId, tokenProvider: WixAppTokenProvider.fromEnv(env) });
}

function routeGuardedEmbed(sourceHtml, route) {
  const routePath = route.replace(/\/+$/, "") || "/";
  if (!routePath.startsWith("/") || routePath === "/" || /[?#\\\s]/.test(routePath) || routePath.includes("//") || routePath.split("/").includes("..")) {
    throw new Error("Pass --route as one exact, non-root page path, such as /atelier-prototype.");
  }
  if (!sourceHtml.trim()) throw new Error("The Custom Embed HTML source file is empty.");
  const htmlLiteral = JSON.stringify(sourceHtml).replaceAll("<", "\\u003c");
  return `<script>(() => {
  const currentPath = window.location.pathname.replace(/\\/+$/, "") || "/";
  if (currentPath !== ${JSON.stringify(routePath)}) return;
  const template = document.createElement("template");
  template.innerHTML = ${htmlLiteral};
  const root = document.createElement("div");
  root.id = "wix-bridge-prototype";
  document.body.replaceChildren(root);
  root.append(template.content);
  for (const inertScript of root.querySelectorAll("script")) {
    const activeScript = document.createElement("script");
    for (const attribute of inertScript.attributes) activeScript.setAttribute(attribute.name, attribute.value);
    activeScript.textContent = inertScript.textContent;
    inertScript.replaceWith(activeScript);
  }
})();</script>`;
}

function parseBooleanOption(value, fallback, label) {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new Error(`--${label} must be true or false.`);
}

export async function runOperation(command, args, env = process.env, options = {}) {
  const ctx = await loadContext(args, env);
  const { site, stateDir, sourceRoot } = ctx;
  const apply = args.apply === true;

  if (command === "inspect" || command === "doctor") {
    let publish;
    if (sourceRoot) publish = await inspectPublishTarget(site, sourceRoot);
    const authConfigured = Boolean(env.WIX_APP_ID && env.WIX_APP_SECRET && env.WIX_APP_INSTANCE_ID);
    const cli = spawnSync(wixExecutable(), ["--version"], { encoding: "utf8", stdio: "ignore", env });
    return {
      status: "ok",
      target: { alias: site.alias, siteId: site.siteId, connectedRepo: site.connectedRepo, defaultBranch: site.defaultBranch },
      allowlisted: true,
      customEmbedsAuth: authConfigured ? "configured (not contacted)" : "missing Wix app credentials",
      wixCli: cli.status === 0 ? `installed (${wixExecutable() === "wix" ? "PATH" : "workspace"})` : "not installed",
      sourceRepo: publish
        ? { branch: publish.branch, sourceCommit: publish.sourceCommit, uiConfigSha256: publish.uiConfigSha256 }
        : site.connectedRepo ? "not checked; pass --site-repo" : "not connected; create and connect a separate Wix site source repository"
    };
  }

  if (command === "create-snippet") {
    if (!args.name || args.name.trim().length > 100) throw new Error("Pass --name with a custom embed name from 1 to 100 characters.");
    if (!args.htmlFile) throw new Error("Pass --html-file with the local HTML fragment for the new custom embed.");
    const position = args.position ?? "BODY_END";
    const category = args.category ?? "FUNCTIONAL";
    if (!["HEAD", "BODY_START", "BODY_END"].includes(position)) throw new Error("--position must be HEAD, BODY_START, or BODY_END.");
    if (!["ESSENTIAL", "FUNCTIONAL", "ANALYTICS", "ADVERTISING", "DATA_TO_THIRD_PARTY"].includes(category)) {
      throw new Error("--category must be a documented Wix Custom Embed category.");
    }
    if (!args.route) throw new Error("Pass --route for the exact prototype path. The API applies new embeds to all pages by default.");
    const routePath = args.route.replace(/\/+$/, "") || "/";
    const sourcePath = path.resolve(args.htmlFile);
    const sourceHtml = await readFile(sourcePath, "utf8");
    const html = routeGuardedEmbed(sourceHtml, routePath);
    const loadOnce = parseBooleanOption(args.loadOnce, false, "load-once");
    const enabled = parseBooleanOption(args.enabled, true, "enabled");
    const details = {
      name: args.name.trim(),
      enabled,
      loadOnce,
      position,
      category,
      routeGuard: routePath,
      apiPageScope: "all pages (pageFilter is read-only)",
      htmlBytes: Buffer.byteLength(html, "utf8"),
      htmlSha256: sha256(html),
      sourcePath
    };
    if (!apply) return { status: "dry-run", target: { alias: site.alias, siteId: site.siteId }, wouldCreate: details };

    const operationId = newId("embed-create");
    const receiptPath = path.join(stateDir, "receipts", `${operationId}.json`);
    const receiptBase = { operationId, siteAlias: site.alias, siteId: site.siteId, createdAt: new Date().toISOString(), ...details };
    await writePrivateJson(receiptPath, { ...receiptBase, status: "pending" });
    try {
      const client = clientFor(site, env);
      const sameName = (await client.listAll()).filter((embed) => embed.name?.toLowerCase() === details.name.toLowerCase());
      if (sameName.length) throw new Error(`A custom embed named ${details.name} already exists on ${site.alias}; choose a unique name after inspecting the existing embed.`);
      const created = await client.create({ name: details.name, enabled, loadOnce, position, category, html });
      const receipt = {
        ...receiptBase,
        status: "created",
        customEmbedId: created.id,
        revision: String(created.revision),
        confirmedEnabled: created.enabled,
        confirmedPosition: created.position,
        confirmedPageScope: created.pageFilter?.pageIds?.length ? { type: "pages", pageIds: created.pageFilter.pageIds } : { type: "all" }
      };
      await writePrivateJson(receiptPath, receipt);
      return { ...receipt, receiptPath };
    } catch (error) {
      await writePrivateJson(receiptPath, {
        ...receiptBase,
        status: "failed",
        failure: { name: error.name, httpStatus: Number.isInteger(error.status) ? error.status : null }
      }).catch(() => {});
      throw error;
    }
  }

  if (command === "build") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const artifacts = await generateArtifacts(site, sourceRoot);
    const output = [];
    for (const snippet of site.customCode) {
      const artifact = artifacts.get(snippet.id);
      if (!artifact) continue;
      const component = site.components.find((c) => c.name === snippet.component);
      const filename = `${component.tagName}.html`;
      const destination = path.resolve(args.out ?? path.join(stateDir, "artifacts", filename));
      output.push({ snippetId: snippet.id, component: component.name, sourcePath: artifact.sourcePath, sourceSha256: artifact.sourceHash, artifactSha256: artifact.artifactHash, compressedBytes: artifact.compressedBytes, uncompressedBytes: artifact.uncompressedBytes, destination });
      if (apply) {
        await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
        await writeFile(destination, artifact.html, { mode: 0o600 });
      }
    }
    return { status: apply ? "written" : "dry-run", artifacts: output };
  }

  if (command === "list-snippets" || command === "snippets") {
    return { snippets: await inspectSnippets({ site, client: clientFor(site, env) }) };
  }
  if (command === "read-snippet" || command === "snippet") {
    if (!args.snippet) throw new Error("Pass --snippet with an ID declared in the selected site's manifest.");
    const embed = await readConfiguredSnippet({ site, snippetId: args.snippet, client: clientFor(site, env) });
    const scrubbed = { ...embed, embedData: { ...embed.embedData, html: redact(embed.embedData?.html ?? "", secretValues(env)) } };
    return { snippet: scrubbed };
  }
  if (command === "plan") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const items = await planSnippetDeployment({ site, sourceRoot, client: clientFor(site, env) });
    return { status: "dry-run", changed: items.filter((i) => i.changed).length, plan: items.map(({ current, desiredHtml, ...item }) => item) };
  }
  if (command === "snapshot") {
    const client = clientFor(site, env);
    if (!apply) return planSnapshot({ site, client });
    return snapshotSnippets({ site, client, stateDir });
  }
  if (command === "deploy") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    return deploySnippets({ site, sourceRoot, client: clientFor(site, env), stateDir, apply });
  }
  if (command === "restore") {
    if (!args.snapshot) throw new Error("Pass --snapshot with a release receipt or snapshot ID.");
    return restoreSnippets({ site, snapshotId: args.snapshot, client: clientFor(site, env), stateDir, apply });
  }
  if (command === "publish") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const target = await inspectPublishTarget(site, sourceRoot);
    if (!apply) return { status: "dry-run", action: "wix publish", target: { siteId: site.siteId, repo: site.connectedRepo, branch: target.branch, sourceCommit: target.sourceCommit, uiConfigSha256: target.uiConfigSha256, uiVersion: target.uiVersion } };
    if (options.transport === "mcp") return { status: "requires-local-terminal", command: `npm run bridge -- publish --manifest ${ctx.manifestPath} --site ${site.alias} --site-repo ${sourceRoot} --apply`, reason: "The supported Wix CLI publish flow is interactive. Run this command in a local terminal and confirm the Wix CLI prompt." };
    const result = invokeWixPublish(sourceRoot, { env });
    const receiptId = newId("publish");
    const receipt = { releaseId: receiptId, siteAlias: site.alias, siteId: site.siteId, createdAt: new Date().toISOString(), status: result.status, sourceCommit: target.sourceCommit, uiConfigSha256: target.uiConfigSha256 };
    await writePrivateJson(path.join(stateDir, "receipts", `${receiptId}.json`), receipt);
    return { ...receipt, receiptPath: path.join(stateDir, "receipts", `${receiptId}.json`) };
  }
  if (command === "release") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const client = clientFor(site, env);
    if (!apply) return planRelease({ site, sourceRoot, client });
    if (options.transport === "mcp") {
      const plan = await planRelease({ site, sourceRoot, client });
      return { ...plan, status: "requires-local-terminal", command: `npm run bridge -- release --manifest ${ctx.manifestPath} --site ${site.alias} --site-repo ${sourceRoot} --apply`, reason: "The release must run the supported, interactive Wix CLI publish flow before it updates Custom Embeds. Run the command in a local terminal." };
    }
    return executeRelease({ site, sourceRoot, client, stateDir, apply: true });
  }
  if (command === "verify") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const client = clientFor(site, env);
    const plan = await planSnippetDeployment({ site, sourceRoot, client });
    const embeds = plan.map((item) => ({ id: item.id, expectedSha256: item.afterSha256, actualSha256: item.beforeSha256, matches: !item.changed, revision: item.revision, position: item.position, pageScope: item.pageScope }));
    let liveSite = { status: "url-not-configured" };
    if (site.liveUrl && !/^REPLACE_/i.test(site.liveUrl)) {
      try {
        const response = await fetch(site.liveUrl, { redirect: "follow" });
        liveSite = { status: response.ok ? "reachable" : "http-error", httpStatus: response.status, url: site.liveUrl, freshDomAndDesktopMobileVisualCheckRequired: true };
      } catch {
        liveSite = { status: "unreachable", url: site.liveUrl, freshDomAndDesktopMobileVisualCheckRequired: true };
      }
    }
    return { status: embeds.every((x) => x.matches) ? "api-state-matches" : "drift", embeds, liveSite };
  }
  throw new Error(`Unknown operation: ${command}`);
}

export function outputText(value, env = process.env) {
  return redact(JSON.stringify(value, null, 2), secretValues(env));
}
