import { open, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { newId, sha256, writePrivateJson } from "./security.mjs";

const PROTOCOL = "wix-prepared-embed/1";

function liveScope(embed) {
  const ids = embed.pageFilter?.pageIds;
  return !ids?.length ? { type: "all" } : { type: "pages", pageIds: [...ids].sort() };
}

function declaredScope(snippet) {
  return snippet.pageScope.type === "all" ? { type: "all" } : { type: "pages", pageIds: [...snippet.pageScope.pageIds].sort() };
}

function assertTarget(embed, candidate, snippet) {
  if (!snippet) throw new Error(`Selected site's manifest no longer declares prepared embed ${candidate.snippetId}; refusing to mutate or retry.`);
  if (!embed || embed.id !== candidate.snippetId) throw new Error("Prepared embed target could not be read.");
  if (embed.position !== candidate.position || JSON.stringify(liveScope(embed)) !== JSON.stringify(candidate.pageScope)) throw new Error("Prepared embed placement or page scope changed; refusing to mutate.");
  if (embed.embedData?.category !== candidate.category || embed.loadOnce !== candidate.loadOnce) throw new Error("Prepared embed category or loadOnce setting changed; refusing to mutate.");
  if (snippet.position !== candidate.position || JSON.stringify(declaredScope(snippet)) !== JSON.stringify(candidate.pageScope) || snippet.category !== candidate.category || snippet.loadOnce !== candidate.loadOnce) throw new Error("Manifest no longer matches the prepared embed target.");
}

function statePaths(stateDir, id) {
  if (typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(id) || id.includes("..")) throw new Error("Prepared plan ID is invalid.");
  const base = path.join(stateDir, "prepared-embeds");
  return { candidate: path.join(base, `${id}.json`), intent: path.join(base, `${id}.intent.json`), receipt: path.join(base, `${id}.receipt.json`) };
}

function publicCandidate(candidate) {
  const { html, ...safe } = candidate;
  return safe;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function requestedHtml(args) {
  const html = args.html ?? args.preparedHtml;
  if (typeof html !== "string" || !html.trim()) throw new Error("Pass prepared HTML content.");
  return html;
}

export function capabilityDeclaration() {
  return {
    contract: PROTOCOL,
    version: 1,
    capabilities: {
      preparedEmbedInspect: true,
      preparedEmbedPlan: true,
      preparedEmbedApply: true,
      preparedEmbedReconcile: true,
      arbitraryEmbedUpdate: false,
      codePublish: false,
      cmsWrite: false,
      editorPlacement: false,
      seoPublish: false,
      intelligenceBinding: false
    }
  };
}

export async function planPreparedEmbed({ site, stateDir, client, snippetId, html }) {
  const snippet = site.customCode.find((item) => item.id === snippetId);
  if (!snippet || /^REPLACE_/i.test(snippet.id)) throw new Error("Prepared embed snippet must be declared with a concrete ID in the selected manifest.");
  const embed = await client.get(snippetId);
  if (!embed || embed.id !== snippet.id) throw new Error("Configured custom embed could not be read.");
  const pageScope = liveScope(embed);
  if (embed.position !== snippet.position || JSON.stringify(pageScope) !== JSON.stringify(declaredScope(snippet))) throw new Error("Custom embed placement or page scope differs from the manifest.");
  if (embed.embedData?.category !== snippet.category || embed.loadOnce !== snippet.loadOnce) throw new Error("Custom embed category or loadOnce setting differs from the manifest.");
  if (typeof html !== "string" || !html.trim()) throw new Error("Prepared HTML content must be a non-empty string.");
  const planId = newId("prepared-embed");
  const candidate = {
    protocol: PROTOCOL, planId, siteAlias: site.alias, siteId: site.siteId, snippetId,
    position: snippet.position, pageScope, category: snippet.category, loadOnce: snippet.loadOnce,
    currentRevision: String(embed.revision), currentSha256: sha256(embed.embedData?.html ?? ""),
    desiredSha256: sha256(html), html, createdAt: new Date().toISOString()
  };
  await writePrivateJson(statePaths(stateDir, planId).candidate, candidate);
  return { status: "planned", plan: publicCandidate(candidate) };
}

export async function applyPreparedEmbed({ site, stateDir, client, planId, expectedSha256, writeJson = writePrivateJson }) {
  const paths = statePaths(stateDir, planId);
  const candidate = await readJson(paths.candidate);
  if (candidate.protocol !== PROTOCOL || candidate.siteAlias !== site.alias || candidate.siteId !== site.siteId) throw new Error("Prepared plan belongs to a different target or protocol.");
  if (expectedSha256 !== candidate.desiredSha256) throw new Error("Reviewed desired hash does not match the prepared plan.");
  let lock;
  try { lock = await open(`${paths.intent}.lock`, "wx", 0o600); }
  catch (error) { if (error.code === "EEXIST") return { status: "blocked", planId, reason: "Another apply owns this plan or an interrupted apply needs reconciliation." }; throw error; }
  try {
  try {
    const existing = await readJson(paths.receipt);
    if (["complete", "reconciled"].includes(existing.status)) return { ...existing, receiptPath: paths.receipt };
    if (existing.status === "uncertain" || existing.status === "applying") return { status: "blocked", planId, reason: "An earlier apply is uncertain; reconcile before any further mutation." };
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  let current;
  try { current = await client.get(candidate.snippetId); }
  catch { throw new Error("Could not re-read prepared embed target; no mutation was attempted."); }
  const snippet = site.customCode.find((item) => item.id === candidate.snippetId);
  assertTarget(current, candidate, snippet);
  if (String(current.revision) !== candidate.currentRevision || sha256(current.embedData?.html ?? "") !== candidate.currentSha256) throw new Error("Prepared embed is stale; re-plan before applying.");
  const intent = { protocol: PROTOCOL, planId, siteAlias: site.alias, siteId: site.siteId, snippetId: candidate.snippetId, desiredSha256: candidate.desiredSha256, status: "applying", createdAt: new Date().toISOString() };
  await writeJson(paths.intent, intent);
  await writeJson(paths.receipt, { ...intent, status: "applying", receiptUpdatedAt: new Date().toISOString() });
  try {
    await client.updateHtml(current, candidate.html);
  } catch (error) {
    const unknown = !Number.isInteger(error?.status) || error.status >= 500;
    const receipt = { ...intent, status: unknown ? "uncertain" : "failed", outcome: unknown ? "mutation-response-unknown" : "mutation-rejected", error: unknown ? "Mutation outcome unknown; reconcile before retrying." : error.name === "WixRevisionConflictError" ? "revision-conflict" : `Wix request failed with HTTP ${error.status}`, finishedAt: new Date().toISOString() };
    await writePrivateJson(paths.receipt, receipt);
    return { ...receipt, receiptPath: paths.receipt };
  }
  try {
    const confirmed = await client.get(candidate.snippetId);
    assertTarget(confirmed, candidate, snippet);
    if (sha256(confirmed.embedData?.html ?? "") !== candidate.desiredSha256) throw new Error("Readback hash did not match the desired content.");
    const receipt = { ...intent, status: "complete", outcome: "applied-and-readback-verified", verifiedRevision: String(confirmed.revision), finishedAt: new Date().toISOString() };
    await writePrivateJson(paths.receipt, receipt);
    return { ...receipt, receiptPath: paths.receipt };
  } catch {
    const receipt = { ...intent, status: "uncertain", outcome: "mutation-response-readback-unknown", error: "Readback failed or did not confirm the desired state; reconcile before any retry.", finishedAt: new Date().toISOString() };
    await writePrivateJson(paths.receipt, receipt);
    return { ...receipt, receiptPath: paths.receipt };
  }
  } finally {
    await lock.close();
    await rm(`${paths.intent}.lock`, { force: true });
  }
}

export async function reconcilePreparedEmbed({ site, stateDir, client, planId }) {
  const paths = statePaths(stateDir, planId);
  const candidate = await readJson(paths.candidate);
  if (candidate.protocol !== PROTOCOL || candidate.siteAlias !== site.alias || candidate.siteId !== site.siteId) throw new Error("Prepared plan belongs to a different target or protocol.");
  let receipt;
  try { receipt = await readJson(paths.receipt); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    throw new Error("Prepared embed receipt is missing; outcome remains unknown. Reconcile is read-only and no mutation or retry was attempted.");
  }
  if (receipt.planId !== planId || receipt.siteId !== site.siteId || receipt.siteAlias !== site.alias) throw new Error("Prepared receipt target does not match the selected site.");
  if (["complete", "reconciled"].includes(receipt.status)) return { ...receipt, receiptPath: paths.receipt };
  if (receipt.status === "applying") {
    const blocked = { ...receipt, status: "uncertain", outcome: "interrupted-apply-requires-readback", error: "Apply was interrupted; readback only, no mutation retry." };
    await writePrivateJson(paths.receipt, blocked);
  }
  let current;
  try { current = await client.get(candidate.snippetId); }
  catch {
    const blocked = { ...receipt, status: "uncertain", outcome: "readback-unavailable", error: "Readback unavailable; no retry was attempted." };
    await writePrivateJson(paths.receipt, blocked);
    return { ...blocked, receiptPath: paths.receipt };
  }
  try { assertTarget(current, candidate, site.customCode.find((item) => item.id === candidate.snippetId)); }
  catch (error) {
    const blocked = { ...receipt, status: "uncertain", outcome: "target-drift", error: `${error.message} Operator resolution required.` };
    await writePrivateJson(paths.receipt, blocked);
    return { ...blocked, receiptPath: paths.receipt };
  }
  const hash = sha256(current.embedData?.html ?? "");
  if (hash === candidate.desiredSha256) {
    const resolved = { ...receipt, status: "reconciled", outcome: "unknown-response-desired-state-observed", uncertaintyRetained: true, verifiedRevision: String(current.revision), finishedAt: new Date().toISOString() };
    await writePrivateJson(paths.receipt, resolved);
    return { ...resolved, receiptPath: paths.receipt };
  }
  const blocked = { ...receipt, status: "uncertain", outcome: hash === candidate.currentSha256 && String(current.revision) === candidate.currentRevision ? "desired-state-not-observed-no-retry" : "conflicting-state", error: "Readback did not prove the exact desired state; no retry was attempted." };
  await writePrivateJson(paths.receipt, blocked);
  return { ...blocked, receiptPath: paths.receipt };
}

export async function runPreparedEmbed(command, { site, stateDir, client, args }) {
  if (command === "prepared-embed-plan") return planPreparedEmbed({ site, stateDir, client, snippetId: args.snippet, html: requestedHtml(args) });
  if (command === "prepared-embed-apply") {
    if (args.apply !== true) return { status: "dry-run", planId: args.planId, message: "Set --apply only after reviewing the exact plan and desired hash." };
    if (!args.planId || !args.expectedSha256) throw new Error("Apply requires --plan-id and --expected-sha256 from the reviewed plan.");
    return applyPreparedEmbed({ site, stateDir, client, planId: args.planId, expectedSha256: args.expectedSha256 });
  }
  if (command === "prepared-embed-reconcile") {
    if (!args.planId) throw new Error("Reconcile requires --plan-id.");
    return reconcilePreparedEmbed({ site, stateDir, client, planId: args.planId });
  }
  throw new Error(`Unknown prepared embed operation: ${command}`);
}
