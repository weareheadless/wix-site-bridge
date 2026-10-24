import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { deflateSync } from "node:zlib";
import { generateArtifacts } from "./artifacts.mjs";
import { loadManifest, selectSite } from "./manifest.mjs";
import { inspectPublishTarget, publishWixSite, wixExecutable } from "./publish.mjs";
import { executeRelease, planRelease } from "./release-operation.mjs";
import { deploySnippets, inspectSnippets, planSnapshot, planSnippetDeployment, readConfiguredSnippet, restoreSnippets, saveCurrentSnapshot, snapshotSnippets } from "./release.mjs";
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

function livePageScope(embed) {
  const pageIds = embed.pageFilter?.pageIds;
  return !pageIds?.length ? { type: "all" } : { type: "pages", pageIds: [...pageIds].sort() };
}

function routeGuardedEmbed(sourceHtml, route, mount = null) {
  const routePath = route.replace(/\/+$/, "") || "/";
  if (!routePath.startsWith("/") || routePath === "/" || /[?#\\\s]/.test(routePath) || routePath.includes("//") || routePath.split("/").includes("..")) {
    throw new Error("Pass --route as one exact, non-root page path, such as /atelier-prototype.");
  }
  if (mount && (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(mount.id) || !Number.isInteger(mount.order) || mount.order < 0 || mount.order > 999)) {
    throw new Error("Stacked embed mounts need a safe --mount-id and an integer --mount-order from 0 to 999.");
  }
  if (!sourceHtml.trim()) throw new Error("The Custom Embed HTML source file is empty.");
  const compressedHtml = deflateSync(Buffer.from(sourceHtml, "utf8"), { level: 9 }).toString("base64");
  const mountJson = JSON.stringify(mount);
  return `<script>(()=>{const p=location.pathname.replace(/\\/+$/,"")||"/",m=${mountJson};if(p!==${JSON.stringify(routePath)}||(!m&&document.getElementById("wix-bridge-prototype"))||(m&&document.getElementById("wix-bridge-section-"+m.id)))return;const run=async()=>{try{const b=Uint8Array.from(atob(${JSON.stringify(compressedHtml)}),x=>x.charCodeAt(0)),h=await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate"))).text(),t=document.createElement("template");t.innerHTML=h;const find=()=>document.getElementById("PAGES_CONTAINER")||document.getElementById("main_MF")||document.querySelector("main"),activate=s=>{for(const x of s.querySelectorAll("script")){const n=document.createElement("script");for(const a of x.attributes)n.setAttribute(a.name,a.value);n.textContent=x.textContent;x.replaceWith(n)}},mount=()=>{if((location.pathname.replace(/\\/+$/,"")||"/")!==${JSON.stringify(routePath)})return false;let r=document.getElementById("wix-bridge-prototype");if(!r){const c=find();if(!c||!c.childElementCount)return false;r=document.createElement("div");r.id="wix-bridge-prototype";c.replaceChildren(r)}if(m){if(document.getElementById("wix-bridge-section-"+m.id))return true;if(!r.dataset.wixBridgeStack){r.replaceChildren();r.dataset.wixBridgeStack="true"}const s=document.createElement("div");s.id="wix-bridge-section-"+m.id;s.dataset.wixBridgeOrder=String(m.order);s.append(t.content.cloneNode(true));r.append(s);Array.from(r.children).filter(x=>x.dataset.wixBridgeOrder!==undefined).sort((a,b)=>Number(a.dataset.wixBridgeOrder)-Number(b.dataset.wixBridgeOrder)).forEach(x=>r.append(x));activate(s);return true}if(r.childElementCount)return false;r.append(t.content.cloneNode(true));activate(r);return true};mount();const o=new MutationObserver(()=>{if((location.pathname.replace(/\\/+$/,"")||"/")!==${JSON.stringify(routePath)})return;if(document.getElementById(m?"wix-bridge-section-"+m.id:"wix-bridge-prototype"))return;clearTimeout(o.timer);o.timer=setTimeout(mount,800)});o.observe(document.documentElement,{childList:true,subtree:true})}catch{console.error("Wix Site Bridge: embed could not be loaded; existing page content left unchanged.")}};setTimeout(run,2500)})();</script>`;
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
    if (args.allPages && args.route) throw new Error("Use either --route or --all-pages, not both.");
    if (!args.route && !args.allPages) throw new Error("Pass --route for the exact prototype path, or --all-pages for a sitewide packet.");
    const routePath = args.allPages ? null : (args.route.replace(/\/+$/, "") || "/");
    const sourcePath = path.resolve(args.htmlFile);
    const sourceHtml = await readFile(sourcePath, "utf8");
    if (!sourceHtml.trim()) throw new Error("The Custom Embed HTML source file is empty.");
    const mountId = args.mountId?.trim();
    const mountOrder = args.mountOrder === undefined ? undefined : Number(args.mountOrder);
    if (Boolean(mountId) !== (mountOrder !== undefined)) throw new Error("Pass both --mount-id and --mount-order to stack embeds; omit both for a single-page embed.");
    const mount = mountId ? { id: mountId, order: mountOrder } : null;
    if (args.allPages && mount) throw new Error("Global startup embeds cannot use stacked-section mounts.");
    const html = args.allPages ? sourceHtml : routeGuardedEmbed(sourceHtml, routePath, mount);
    const loadOnce = parseBooleanOption(args.loadOnce, false, "load-once");
    const enabled = parseBooleanOption(args.enabled, true, "enabled");
    const details = {
      name: args.name.trim(),
      enabled,
      loadOnce,
      position,
      category,
      routeGuard: args.allPages ? "all-pages (controller handles supported routes)" : routePath,
      ...(mount ? { mountId: mount.id, mountOrder: mount.order } : {}),
      apiPageScope: "all pages (pageFilter is read-only)",
      htmlBytes: Buffer.byteLength(html, "utf8"),
      sourceHtmlBytes: Buffer.byteLength(sourceHtml, "utf8"),
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

  if (command === "update-snippet") {
    if (!args.snippet) throw new Error("Pass --snippet with an ID declared in the selected site's manifest.");
    if (!args.htmlFile) throw new Error("Pass --html-file with the local HTML fragment for the custom embed.");
    const snippet = site.customCode.find((item) => item.id === args.snippet);
    if (!snippet) throw new Error(`Snippet ${args.snippet} is not declared in the selected site's manifest.`);
    const preserveScope = args.preserveScope === true;
    if (preserveScope && (args.allPages || args.route)) throw new Error("Use --preserve-scope without --route or --all-pages.");
    if (!preserveScope && args.allPages && args.route) throw new Error("Use either --route or --all-pages, not both.");
    if (!preserveScope && !args.allPages && !args.route) throw new Error("Pass --route for the exact prototype path, --all-pages for an existing global embed, or --preserve-scope for a content packet.");
    if (!preserveScope && args.allPages && snippet.pageScope.type !== "all") throw new Error("--all-pages is only allowed for an embed already declared with all-pages scope.");
    const allowedCategories = ["ESSENTIAL", "FUNCTIONAL", "ANALYTICS", "ADVERTISING", "DATA_TO_THIRD_PARTY"];
    const category = args.category ?? snippet.category;
    const fromCategory = args.fromCategory ?? snippet.category;
    if (!allowedCategories.includes(category) || category !== snippet.category) {
      throw new Error("The requested category must be a documented Wix category and match the selected site's manifest.");
    }
    if (!allowedCategories.includes(fromCategory)) throw new Error("--from-category must be a documented Wix category.");
    const sourceHtml = await readFile(path.resolve(args.htmlFile), "utf8");
    const mount = !preserveScope && snippet.mountId ? { id: snippet.mountId, order: snippet.mountOrder } : null;
    if (!preserveScope && args.allPages && mount) throw new Error("Global startup embeds cannot use stacked-section mounts.");
    const routePath = preserveScope ? null : (args.allPages ? null : (args.route.replace(/\/+$/, "") || "/"));
    const html = preserveScope || args.allPages ? sourceHtml : routeGuardedEmbed(sourceHtml, routePath, mount);
    const details = {
      snippetId: snippet.id,
      routeGuard: preserveScope ? "preserve-scope (content packet)" : (args.allPages ? "all-pages (controller handles supported routes)" : routePath),
      position: snippet.position,
      pageScope: snippet.pageScope,
      ...(mount ? { mountId: mount.id, mountOrder: mount.order } : {}),
      category,
      fromCategory,
      loadOnce: snippet.loadOnce,
      htmlBytes: Buffer.byteLength(html, "utf8"),
      sourceHtmlBytes: Buffer.byteLength(sourceHtml, "utf8"),
      htmlSha256: sha256(html),
      sourcePath: path.resolve(args.htmlFile)
    };
    if (!apply) return { status: "dry-run", target: { alias: site.alias, siteId: site.siteId }, wouldUpdate: details };

    const client = clientFor(site, env);
    const current = await client.get(snippet.id);
    if (current.position !== snippet.position) throw new Error(`Custom embed ${snippet.id} moved from its configured ${snippet.position} position; refusing to change it.`);
    if (JSON.stringify(livePageScope(current)) !== JSON.stringify(snippet.pageScope.type === "all" ? { type: "all" } : { type: "pages", pageIds: [...snippet.pageScope.pageIds].sort() })) {
      throw new Error(`Custom embed ${snippet.id} page scope differs from the manifest; refusing to widen or change scope.`);
    }
    if (current.loadOnce !== snippet.loadOnce) throw new Error(`Custom embed ${snippet.id} loadOnce setting differs from the manifest; refusing to change it.`);
    if (current.embedData?.category !== fromCategory) throw new Error(`Custom embed ${snippet.id} category differs from --from-category; refusing to overwrite an unexpected category.`);
    const beforeHtml = current.embedData?.html ?? "";
    const beforeSha256 = sha256(beforeHtml);
    const afterSha256 = sha256(html);
    const snapshot = await saveCurrentSnapshot({
      site,
      stateDir,
      items: [{ id: current.id, current, beforeSha256, desiredHtml: html, afterSha256 }],
      kind: "embed-update"
    });
    const operationId = newId("embed-update");
    const receiptPath = path.join(stateDir, "receipts", `${operationId}.json`);
    let updated = false;
    try {
      await client.updateHtml(current, html, category);
      updated = true;
      const confirmed = await readConfiguredSnippet({ site, snippetId: snippet.id, client });
      if (sha256(confirmed.embedData?.html ?? "") !== afterSha256) throw new Error("Wix returned content that does not match the planned hash.");
      const receipt = {
        operationId, siteAlias: site.alias, siteId: site.siteId, createdAt: new Date().toISOString(),
        ...details, status: "updated", beforeSha256, afterSha256, confirmedRevision: String(confirmed.revision),
        snapshotId: snapshot.snapshotId, snapshotPath: path.join(stateDir, "snapshots", `${snapshot.snapshotId}.json`),
        recovery: `npm run bridge -- restore --manifest ${ctx.manifestPath} --site ${site.alias} --snapshot ${snapshot.snapshotId} --apply`
      };
      await writePrivateJson(receiptPath, receipt);
      return { ...receipt, receiptPath };
    } catch (error) {
      const receipt = {
        operationId, siteAlias: site.alias, siteId: site.siteId, createdAt: new Date().toISOString(),
        ...details, status: updated ? "partial" : "failed", beforeSha256, afterSha256,
        failure: { httpStatus: Number.isInteger(error.status) ? error.status : null, name: error.name },
        snapshotId: snapshot.snapshotId, snapshotPath: path.join(stateDir, "snapshots", `${snapshot.snapshotId}.json`),
        recovery: `npm run bridge -- restore --manifest ${ctx.manifestPath} --site ${site.alias} --snapshot ${snapshot.snapshotId} --apply`
      };
      await writePrivateJson(receiptPath, receipt);
      return { ...receipt, receiptPath };
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
    if (!apply) return { status: "dry-run", action: "verified wix publish", target: { siteId: site.siteId, repo: site.connectedRepo, branch: target.branch, sourceCommit: target.sourceCommit, uiConfigSha256: target.uiConfigSha256, uiVersion: target.uiVersion } };
    const publication = await publishWixSite({
      repoPath: sourceRoot,
      siteId: site.siteId,
      gitSha: target.sourceCommit,
      branch: target.branch,
      env,
    });
    const receiptId = newId("publish");
    const receipt = { releaseId: receiptId, siteAlias: site.alias, siteId: site.siteId, createdAt: new Date().toISOString(), status: "published", sourceCommit: target.sourceCommit, uiConfigSha256: target.uiConfigSha256, publication };
    await writePrivateJson(path.join(stateDir, "receipts", `${receiptId}.json`), receipt);
    return { ...receipt, receiptPath: path.join(stateDir, "receipts", `${receiptId}.json`) };
  }
  if (command === "release") {
    if (!sourceRoot) throw new Error("Pass --site-repo with the separately connected Wix source repository.");
    const client = clientFor(site, env);
    if (!apply) return planRelease({ site, sourceRoot, client });
    return executeRelease({
      site,
      sourceRoot,
      client,
      stateDir,
      apply: true,
      publish: async (repoPath) => {
        const source = await inspectPublishTarget(site, repoPath);
        return publishWixSite({
          repoPath,
          siteId: site.siteId,
          gitSha: source.sourceCommit,
          branch: source.branch,
          env,
        });
      },
    });
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
