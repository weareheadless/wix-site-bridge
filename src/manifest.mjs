import { readFile } from "node:fs/promises";
import path from "node:path";

const placements = new Set(["HEAD", "BODY_START", "BODY_END"]);

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`Manifest field ${label} must be a non-empty string.`);
  return value.trim();
}

export function validateManifest(input) {
  if (!input || input.version !== 1 || !input.site) throw new Error("Manifest must have version: 1 and a site object.");
  const site = input.site;
  site.alias = requireString(site.alias, "site.alias");
  site.siteId = requireString(site.siteId, "site.siteId");
  if (site.connectedRepo !== undefined && site.connectedRepo !== null && site.connectedRepo !== "") {
    site.connectedRepo = requireString(site.connectedRepo, "site.connectedRepo").replace(/\.git$/i, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(site.connectedRepo)) throw new Error("site.connectedRepo must use owner/repository form.");
    site.defaultBranch = requireString(site.defaultBranch, "site.defaultBranch");
  } else {
    site.connectedRepo = null;
    site.defaultBranch = null;
  }
  site.wixConfigPath = site.wixConfigPath ?? "wix.config.json";
  if (typeof site.wixConfigPath !== "string" || path.isAbsolute(site.wixConfigPath)) throw new Error("site.wixConfigPath must be a relative path inside the Wix source repository.");
  if (site.liveUrl !== undefined) site.liveUrl = requireString(site.liveUrl, "site.liveUrl");
  if (!Array.isArray(site.routes) || !Array.isArray(site.components) || !Array.isArray(site.customCode)) {
    throw new Error("Manifest routes, components, and customCode must be arrays.");
  }
  const components = new Map();
  for (const component of site.components) {
    component.name = requireString(component.name, "component.name");
    component.source = requireString(component.source, `component ${component.name}.source`);
    component.tagName = requireString(component.tagName, `component ${component.name}.tagName`);
    if (!/^[a-z][.0-9_a-z-]*-[.0-9_a-z-]*$/.test(component.tagName)) {
      throw new Error(`Custom element tag ${component.tagName} must contain a hyphen.`);
    }
    if (components.has(component.name)) throw new Error(`Duplicate component name ${component.name}.`);
    component.routes ??= [];
    component.wixElementIds ??= [];
    component.datasetBindings ??= [];
    components.set(component.name, component);
  }
  const snippetIds = new Set();
  for (const snippet of site.customCode) {
    snippet.id = requireString(snippet.id, "customCode.id");
    if (/^REPLACE_/i.test(snippet.id)) continue;
    if (snippetIds.has(snippet.id)) throw new Error(`Duplicate custom code ID ${snippet.id}.`);
    snippetIds.add(snippet.id);
    if (!placements.has(snippet.position)) throw new Error(`Custom embed ${snippet.id} has an unsupported position.`);
    if (!snippet.pageScope || !["all", "pages"].includes(snippet.pageScope.type)) {
      throw new Error(`Custom embed ${snippet.id} must declare pageScope.type as all or pages.`);
    }
    if (snippet.pageScope.type === "pages" && (!Array.isArray(snippet.pageScope.pageIds) || snippet.pageScope.pageIds.length === 0)) {
      throw new Error(`Custom embed ${snippet.id} page scope must list at least one page ID.`);
    }
    if (snippet.component && !components.has(snippet.component)) throw new Error(`Custom embed ${snippet.id} references unknown component ${snippet.component}.`);
    snippet.category ??= "ESSENTIAL";
    snippet.loadOnce ??= true;
  }
  return input;
}

export async function loadManifest(filePath) {
  const fullPath = path.resolve(filePath);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(fullPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read JSON manifest at ${fullPath}: ${error.message}`);
  }
  return { manifest: validateManifest(parsed), path: fullPath };
}

export function selectSite(manifest, alias) {
  if (!alias) throw new Error("An explicit --site alias is required for every site operation.");
  if (manifest.site.alias !== alias) throw new Error(`Manifest is for ${manifest.site.alias}; selected target was ${alias}.`);
  return manifest.site;
}
