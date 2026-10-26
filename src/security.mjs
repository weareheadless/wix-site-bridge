import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function newId(prefix = "release") {
  const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "-");
  return `${stamp}-${prefix}-${randomUUID().slice(0, 8)}`;
}

export function redact(value, secretValues = []) {
  let text = String(value ?? "");
  for (const secret of secretValues.filter(Boolean)) {
    text = text.replaceAll(String(secret), "[REDACTED]");
  }
  return text
    .replace(/(authorization\s*[:=]\s*)(?:bearer\s+|basic\s+)?[^\s,'";}]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*)['"]?[^\s,'";}]+/gi, "$1[REDACTED]");
}

export function safeError(error, secretValues = []) {
  if (error?.name === "WixRevisionConflictError") {
    return "Wix reports a revision conflict. No retry was attempted; re-read and plan again.";
  }
  if (Number.isInteger(error?.status)) {
    const code = typeof error.code === "string" && /^[A-Z0-9_-]{1,60}$/.test(error.code) ? ` (${error.code})` : "";
    const fields = Array.isArray(error.fields) && error.fields.length ? `; fields: ${error.fields.join(", ")}` : "";
    const hints = Array.isArray(error.hints) && error.hints.length ? `; validation: ${error.hints.join(", ")}` : "";
    return `Wix request failed with HTTP ${error.status}${code}${fields}${hints}. Response details were omitted.`;
  }
  return redact(error?.message ?? "Operation failed.", secretValues);
}

export async function writePrivateJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

export function targetAllowlist(env = process.env) {
  return new Set((env.WIX_ALLOWED_SITE_IDS ?? "").split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean));
}

export function assertAllowedTarget(site, selectedAlias, allowedSiteIds) {
  if (!selectedAlias || selectedAlias !== site.alias) {
    throw new Error("Target alias mismatch. Pass the exact site alias with --site.");
  }
  if (!site.siteId || /^REPLACE_/i.test(site.siteId)) {
    throw new Error(`Site ${site.alias} has no configured Wix site ID.`);
  }
  if (!allowedSiteIds?.has(site.siteId)) {
    throw new Error(`Site ${site.alias} is not in WIX_ALLOWED_SITE_IDS.`);
  }
  return site;
}

export function normalizeRepoUrl(url = "") {
  let match = url.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (!match) match = url.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i);
  return match?.[1]?.toLowerCase() ?? null;
}
