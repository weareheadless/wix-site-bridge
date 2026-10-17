import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { sha256 } from "./security.mjs";

export function resolveSource(sourceRoot, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error("Component source paths must be relative to the selected Wix repository.");
  const root = path.resolve(sourceRoot);
  const fullPath = path.resolve(root, relativePath);
  const rel = path.relative(root, fullPath);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Component source must stay inside the selected Wix repository.");
  return fullPath;
}

export function makeGzipPacket(source, tagName) {
  const sourceHash = sha256(source);
  const compressed = gzipSync(Buffer.from(source, "utf8"), { level: 9, mtime: 0 });
  const payload = compressed.toString("base64");
  const marker = `wix-site-bridge:${tagName}:${sourceHash}`;
  const html = `<script data-wix-site-bridge="${marker}">(async()=>{const b=${JSON.stringify(payload)};const bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0));const source=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();(0,eval)(source)})().catch(e=>console.error("Wix component packet failed",e));</script>`;
  return { html, sourceHash, artifactHash: sha256(html), compressedBytes: compressed.length, uncompressedBytes: Buffer.byteLength(source, "utf8"), marker };
}

export async function generateArtifacts(site, sourceRoot) {
  const components = new Map(site.components.map((c) => [c.name, c]));
  const bySnippet = new Map();
  for (const snippet of site.customCode) {
    if (!snippet.component) continue;
    const component = components.get(snippet.component);
    const file = resolveSource(sourceRoot, component.source);
    const source = await readFile(file, "utf8");
    bySnippet.set(snippet.id, { ...makeGzipPacket(source, component.tagName), sourcePath: component.source, componentName: component.name });
  }
  return bySnippet;
}
