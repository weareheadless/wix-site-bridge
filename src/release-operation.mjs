import { inspectPublishTarget, invokeWixPublish } from "./publish.mjs";
import { deploySnippets, planSnippetDeployment, saveCurrentSnapshot } from "./release.mjs";
import { safeError, writePrivateJson } from "./security.mjs";
import path from "node:path";

function receiptPath(stateDir, id) {
  return path.join(stateDir, "receipts", `${id}.json`);
}

export async function planRelease({ site, sourceRoot, client }) {
  const source = await inspectPublishTarget(site, sourceRoot);
  const snippets = await planSnippetDeployment({ site, sourceRoot, client });
  return {
    status: "dry-run",
    target: {
      alias: site.alias,
      siteId: site.siteId,
      connectedRepo: site.connectedRepo,
      branch: source.branch,
      sourceCommit: source.sourceCommit,
      uiConfigPath: source.wixConfigPath,
      uiConfigSha256: source.uiConfigSha256,
      uiVersion: source.uiVersion
    },
    order: ["publish the already committed Wix source with `wix publish`", "update configured Custom Embeds using their current revisions", "verify API state and the live site"],
    snippetPlan: snippets.map(({ current, desiredHtml, ...item }) => item),
    changedSnippets: snippets.filter((item) => item.changed).length
  };
}

export async function executeRelease({ site, sourceRoot, client, stateDir, apply = false, publish = invokeWixPublish }) {
  const source = await inspectPublishTarget(site, sourceRoot);
  const plannedItems = await planSnippetDeployment({ site, sourceRoot, client });
  const plan = {
    target: {
      alias: site.alias,
      siteId: site.siteId,
      connectedRepo: site.connectedRepo,
      branch: source.branch,
      sourceCommit: source.sourceCommit,
      uiConfigPath: source.wixConfigPath,
      uiConfigSha256: source.uiConfigSha256,
      uiVersion: source.uiVersion
    },
    order: ["publish code", "update Custom Embeds", "verify"],
    snippetPlan: plannedItems.map(({ current, desiredHtml, ...item }) => item),
    changedSnippets: plannedItems.filter((item) => item.changed).length
  };
  if (!apply) return { status: "dry-run", ...plan };

  const snapshot = await saveCurrentSnapshot({
    site,
    stateDir,
    items: plannedItems,
    sourceCommit: source.sourceCommit,
    uiConfigSha256: source.uiConfigSha256,
    kind: "release"
  });
  const receipt = {
    releaseId: snapshot.snapshotId,
    snapshotId: snapshot.snapshotId,
    siteAlias: site.alias,
    siteId: site.siteId,
    createdAt: new Date().toISOString(),
    sourceCommit: source.sourceCommit,
    uiConfigSha256: source.uiConfigSha256,
    status: "publishing",
    codePublished: false,
    snippetReceipt: null,
    failed: null,
    recovery: `Use restore --snapshot ${snapshot.snapshotId} --apply for Custom Embed snippets. Code rollback is a separate Git revert and Wix CLI publish operation.`
  };
  try {
    await publish(source.repoPath);
    receipt.codePublished = true;
  } catch (error) {
    receipt.status = "publish-failed";
    receipt.failed = { phase: "code-publish", message: safeError(error) };
    receipt.finishedAt = new Date().toISOString();
    await writePrivateJson(receiptPath(stateDir, receipt.releaseId), receipt);
    return { ...receipt, receiptPath: receiptPath(stateDir, receipt.releaseId), snapshotPath: path.join(stateDir, "snapshots", `${snapshot.snapshotId}.json`) };
  }

  try {
    const deployed = await deploySnippets({
      site,
      sourceRoot,
      client,
      stateDir,
      apply: true,
      sourceCommit: source.sourceCommit,
      uiConfigSha256: source.uiConfigSha256,
      plannedItems,
      existingSnapshot: snapshot,
      writeReceipt: false
    });
    receipt.snippetReceipt = { status: deployed.status, updated: deployed.updated ?? [], verified: deployed.verified ?? [], failed: deployed.failed ?? null };
    receipt.status = deployed.status === "complete" ? "complete" : "partial";
    if (deployed.failed) receipt.failed = { phase: "custom-embed-update", ...deployed.failed };
  } catch (error) {
    receipt.status = "partial";
    receipt.failed = { phase: "custom-embed-update", message: safeError(error) };
  }
  receipt.finishedAt = new Date().toISOString();
  await writePrivateJson(receiptPath(stateDir, receipt.releaseId), receipt);
  return { ...receipt, receiptPath: receiptPath(stateDir, receipt.releaseId), snapshotPath: path.join(stateDir, "snapshots", `${snapshot.snapshotId}.json`) };
}
