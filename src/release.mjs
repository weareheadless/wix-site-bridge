import { readFile } from "node:fs/promises";
import path from "node:path";
import { generateArtifacts } from "./artifacts.mjs";
import { newId, sha256, writePrivateJson } from "./security.mjs";

function hashHtml(embed) {
  return sha256(embed?.embedData?.html ?? "");
}

function liveScope(embed) {
  const pageIds = embed.pageFilter?.pageIds;
  if (!pageIds || pageIds.length === 0) return { type: "all" };
  return { type: "pages", pageIds: [...pageIds].sort() };
}

function expectedScope(snippet) {
  if (snippet.pageScope.type === "all") return { type: "all" };
  return { type: "pages", pageIds: [...snippet.pageScope.pageIds].sort() };
}

function assertScopeAndPlacement(embed, snippet) {
  if (!embed || embed.id !== snippet.id) throw new Error(`Configured custom embed ${snippet.id} could not be read.`);
  if (embed.position !== snippet.position) throw new Error(`Custom embed ${snippet.id} moved from its configured ${snippet.position} position; refusing to change it.`);
  if (JSON.stringify(liveScope(embed)) !== JSON.stringify(expectedScope(snippet))) {
    throw new Error(`Custom embed ${snippet.id} page scope differs from the manifest; refusing to widen or change scope.`);
  }
  if (snippet.category && embed.embedData?.category !== snippet.category) {
    throw new Error(`Custom embed ${snippet.id} category differs from the manifest; refusing to change it.`);
  }
  if (snippet.loadOnce !== undefined && embed.loadOnce !== snippet.loadOnce) {
    throw new Error(`Custom embed ${snippet.id} loadOnce setting differs from the manifest; refusing to change it.`);
  }
}

function requireConcreteSnippetIds(site) {
  for (const snippet of site.customCode) {
    if (!snippet.id || /^REPLACE_/i.test(snippet.id)) throw new Error(`Site manifest still has a placeholder custom embed ID for ${site.alias}.`);
  }
}

export async function planSnippetDeployment({ site, sourceRoot, client }) {
  requireConcreteSnippetIds(site);
  const artifacts = await generateArtifacts(site, sourceRoot);
  const planned = [];
  for (const snippet of site.customCode) {
    if (!snippet.component) continue;
    const current = await client.get(snippet.id);
    assertScopeAndPlacement(current, snippet);
    const artifact = artifacts.get(snippet.id);
    const currentHash = hashHtml(current);
    planned.push({
      id: snippet.id,
      name: current.name,
      position: current.position,
      pageScope: liveScope(current),
      revision: String(current.revision),
      beforeSha256: currentHash,
      afterSha256: artifact.artifactHash,
      changed: currentHash !== artifact.artifactHash,
      sourcePath: artifact.sourcePath,
      sourceSha256: artifact.sourceHash,
      compressedBytes: artifact.compressedBytes,
      uncompressedBytes: artifact.uncompressedBytes,
      current,
      desiredHtml: artifact.html
    });
  }
  return planned;
}

function snapshotPath(stateDir, id) {
  return path.join(stateDir, "snapshots", `${id}.json`);
}

function receiptPath(stateDir, id) {
  return path.join(stateDir, "receipts", `${id}.json`);
}

function publicPlan(items) {
  return items.map(({ current, desiredHtml, ...item }) => item);
}

export async function saveCurrentSnapshot({ site, stateDir, items, sourceCommit = null, uiConfigSha256 = null, kind = "snapshot" }) {
  const id = newId(kind);
  const snapshot = {
    snapshotId: id,
    siteAlias: site.alias,
    siteId: site.siteId,
    createdAt: new Date().toISOString(),
    sourceCommit,
    uiConfigSha256,
    items: items.map((item) => ({
      id: item.id,
      previous: item.current,
      beforeSha256: item.beforeSha256,
      desiredHtml: item.desiredHtml ?? null,
      desiredSha256: item.afterSha256 ?? null
    }))
  };
  await writePrivateJson(snapshotPath(stateDir, id), snapshot);
  return snapshot;
}

export async function snapshotSnippets({ site, client, stateDir }) {
  requireConcreteSnippetIds(site);
  const items = [];
  for (const snippet of site.customCode) {
    const current = await client.get(snippet.id);
    assertScopeAndPlacement(current, snippet);
    items.push({ id: current.id, current, beforeSha256: hashHtml(current) });
  }
  const snapshot = await saveCurrentSnapshot({ site, stateDir, items });
  return { status: "saved", snapshotId: snapshot.snapshotId, count: items.length, path: snapshotPath(stateDir, snapshot.snapshotId) };
}

export async function planSnapshot({ site, client }) {
  requireConcreteSnippetIds(site);
  const snippets = [];
  for (const declaration of site.customCode) {
    const current = await client.get(declaration.id);
    assertScopeAndPlacement(current, declaration);
    snippets.push({ id: current.id, revision: String(current.revision), position: current.position, pageScope: liveScope(current), htmlSha256: hashHtml(current) });
  }
  return { status: "dry-run", wouldSave: snippets.length, snippets };
}

export async function deploySnippets({ site, sourceRoot, client, stateDir, apply = false, sourceCommit = null, uiConfigSha256 = null, plannedItems = null, existingSnapshot = null, writeReceipt = true }) {
  const items = plannedItems ?? await planSnippetDeployment({ site, sourceRoot, client });
  const plan = publicPlan(items);
  if (!apply) return { status: "dry-run", plan, changed: items.filter((x) => x.changed).length };

  const snapshot = existingSnapshot ?? await saveCurrentSnapshot({ site, stateDir, items, sourceCommit, uiConfigSha256, kind: "deploy" });
  const receipt = {
    releaseId: snapshot.snapshotId,
    siteAlias: site.alias,
    siteId: site.siteId,
    createdAt: new Date().toISOString(),
    sourceCommit,
    uiConfigSha256,
    snapshotId: snapshot.snapshotId,
    status: "complete",
    attempted: [],
    updated: [],
    verified: [],
    failed: null,
    plan
  };
  for (const item of items.filter((x) => x.changed)) {
    receipt.attempted.push(item.id);
    try {
      await client.updateHtml(item.current, item.desiredHtml);
      receipt.updated.push(item.id);
      const confirmed = await client.get(item.id);
      if (hashHtml(confirmed) !== item.afterSha256) throw new Error("Wix returned content that does not match the planned hash.");
      assertScopeAndPlacement(confirmed, site.customCode.find((s) => s.id === item.id));
      receipt.verified.push(item.id);
    } catch (error) {
      receipt.failed = { snippetId: item.id, message: error.name === "WixRevisionConflictError" ? "revision conflict; re-read and re-plan before retrying" : error.status ? `Wix request failed with HTTP ${error.status}` : error.message };
      receipt.status = receipt.updated.length ? "partial" : "failed";
      break;
    }
  }
  receipt.finishedAt = new Date().toISOString();
  if (writeReceipt) await writePrivateJson(receiptPath(stateDir, receipt.releaseId), receipt);
  return { ...receipt, receiptPath: receiptPath(stateDir, receipt.releaseId), snapshotPath: snapshotPath(stateDir, receipt.snapshotId) };
}

export async function inspectSnippets({ site, client }) {
  const embeds = await client.listAll();
  return embeds.map((embed) => ({
    id: embed.id,
    name: embed.name,
    revision: String(embed.revision),
    enabled: embed.enabled,
    position: embed.position,
    category: embed.embedData?.category,
    pageScope: liveScope(embed),
    htmlBytes: Buffer.byteLength(embed.embedData?.html ?? "", "utf8"),
    htmlSha256: hashHtml(embed)
  }));
}

export async function readConfiguredSnippet({ site, snippetId, client, includeHtml = true }) {
  requireConcreteSnippetIds(site);
  const snippet = site.customCode.find((item) => item.id === snippetId);
  if (!snippet) throw new Error(`Snippet ${snippetId} is not declared in the selected site's manifest.`);
  const embed = await client.get(snippetId);
  assertScopeAndPlacement(embed, snippet);
  return embed;
}

export async function restoreSnippets({ site, snapshotId, client, stateDir, apply = false }) {
  const snapshotFile = snapshotPath(stateDir, snapshotId);
  const snapshot = JSON.parse(await readFile(snapshotFile, "utf8"));
  if (snapshot.siteId !== site.siteId || snapshot.siteAlias !== site.alias) throw new Error("Snapshot belongs to a different Wix site; refusing to restore it.");
  const planned = [];
  for (const item of snapshot.items) {
    if (!item.desiredSha256 || !item.desiredHtml) throw new Error("This snapshot has no deployment target and cannot be used for rollback. Use a deployment release ID.");
    const declaration = site.customCode.find((snippet) => snippet.id === item.id);
    if (!declaration) throw new Error(`Snapshot snippet ${item.id} is not in the selected site's manifest.`);
    const current = await client.get(item.id);
    assertScopeAndPlacement(current, declaration);
    const currentHash = hashHtml(current);
    if (currentHash === item.beforeSha256) {
      planned.push({ id: item.id, status: "unchanged", current, previous: item.previous });
    } else if (currentHash === item.desiredSha256) {
      planned.push({ id: item.id, status: "restore", current, previous: item.previous });
    } else {
      planned.push({ id: item.id, status: "conflict", current, previous: item.previous });
    }
  }
  const publicItems = planned.map(({ current, previous, ...item }) => ({ ...item, currentRevision: String(current.revision) }));
  if (!apply) return { status: "dry-run", snapshotId, plan: publicItems };
  if (planned.some((item) => item.status === "conflict")) {
    return { status: "blocked", snapshotId, plan: publicItems, message: "At least one snippet changed after the release. Nothing was restored." };
  }
  const restoreItems = planned.filter((item) => item.status === "restore");
  if (!restoreItems.length) return { status: "no-op", snapshotId, plan: publicItems, restored: [] };
  const backupItems = restoreItems.map((item) => ({ id: item.id, current: item.current, beforeSha256: hashHtml(item.current), desiredHtml: item.previous.embedData.html, afterSha256: hashHtml(item.previous) }));
  const rollbackSnapshot = await saveCurrentSnapshot({ site, stateDir, items: backupItems, kind: "rollback" });
  const result = { status: "complete", snapshotId, rollbackSnapshotId: rollbackSnapshot.snapshotId, restored: [], failed: null, plan: publicItems };
  for (const item of restoreItems) {
    try {
      await client.updateHtml(item.current, item.previous.embedData.html);
      const confirmed = await client.get(item.id);
      if (hashHtml(confirmed) !== hashHtml(item.previous)) throw new Error("Restored content hash did not match the saved snapshot.");
      result.restored.push(item.id);
    } catch (error) {
      result.failed = { snippetId: item.id, message: error.name === "WixRevisionConflictError" ? "revision conflict; no retry was attempted" : error.status ? `Wix request failed with HTTP ${error.status}` : error.message };
      result.status = result.restored.length ? "partial" : "failed";
      break;
    }
  }
  result.finishedAt = new Date().toISOString();
  result.receiptPath = receiptPath(stateDir, rollbackSnapshot.snapshotId);
  await writePrivateJson(result.receiptPath, result);
  return result;
}
