#!/usr/bin/env node
// Save flagged rows for focused correction; emit a batch of accepted rows only.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [batchFile, reviewFile] = process.argv.slice(2);
if (!batchFile || !reviewFile) throw Error('Usage: split-reviewed-batch.mjs BATCH_FILE REVIEW_FILE');
const batch = JSON.parse(readFileSync(batchFile, 'utf8'));
if (!Array.isArray(batch.rows) || !batch.rows.length) throw Error('Expected a full batch');
const review = JSON.parse(readFileSync(reviewFile, 'utf8'));
const rejected = new Set(review.rejectedIndices);
if (rejected.size !== review.rejectedIndices.length || [...rejected].some(index => !Number.isInteger(index) || index < 0 || index >= batch.rows.length)) throw Error('Invalid review indices');
const approved = batch.rows.filter((_, index) => !rejected.has(index));
const flagged = batch.rows.filter((_, index) => rejected.has(index));
const stateDir = path.resolve('sites/susimacdonald/.wix-bridge-state/translation-queue');
const quarantineFile = path.join(stateDir, 'quarantine.json');
const previous = (() => { try { return JSON.parse(readFileSync(quarantineFile, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return {}; throw error; } })();
for (const [index, row] of batch.rows.entries()) {
  if (!rejected.has(index)) continue;
  const key = JSON.stringify([row.schemaId, row.entityId, row.fieldId]);
  previous[key] = { sourceSha256: row.sourceSha256, reason: review.reasonsByIndex?.[index] ?? review.reason,
    batch: path.basename(batchFile),
    attempts: (previous[key]?.attempts ?? 0) + 1, updatedAt: new Date().toISOString() };
}
writeFileSync(quarantineFile, `${JSON.stringify(previous, null, 2)}\n`, { mode: 0o600 });
if (!approved.length) {
  console.log(JSON.stringify({ approved: 0, flagged: flagged.length, batch: null }));
  process.exit(0);
}
const name = path.basename(batchFile, '.json') + '-approved.json';
const output = path.join(stateDir, name);
writeFileSync(output, `${JSON.stringify({ ...batch, rows: approved }, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ approved: approved.length, flagged: flagged.length, batch: output }));
