import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeGzipPacket } from "../src/artifacts.mjs";

const exampleDir = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(exampleDir, "site-source/src/public/custom-elements/property-card.js");
const outputPath = path.join(exampleDir, "generated/wh-property-card.html");
const source = await readFile(sourcePath, "utf8");
const packet = makeGzipPacket(source, "wh-property-card");
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${packet.html}\n`);
process.stdout.write(`${outputPath}\nsource sha256: ${packet.sourceHash}\nartifact sha256: ${packet.artifactHash}\n`);
