#!/usr/bin/env node
// Split an oversized single-field batch into paragraph-sized model inputs.
// Exact source concatenation and translation guards are checked on merge.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validateTranslation } from './translation-guard.mjs';

const [command, work, rawMax] = process.argv.slice(2);
const max = Number(rawMax ?? '6000');
if (!['prepare', 'assemble'].includes(command) || !work || !Number.isInteger(max) || max < 500) throw Error('Use prepare|assemble WORKDIR [MAX_CHARS]');
const file = path.join(work, 'batch.json');
const batch = JSON.parse(await readFile(file, 'utf8'));
if (batch.rows.length !== 1) throw Error('Chunking supports one oversized field per batch');
const row = batch.rows[0];
if (command === 'prepare') {
  if (row.source.length <= max) throw Error('This field does not need chunking');
  const dir = path.join(work, 'chunks');
  await mkdir(dir, { mode: 0o700 });
  const fragments = row.source.split(/(<\/(?:p|h[1-6]|li|ul|ol)>)/gi);
  const pieces = [];
  for (let i = 0; i < fragments.length; i += 2) pieces.push(fragments[i] + (fragments[i + 1] ?? ''));
  const chunks = [];
  let current = '';
  for (const piece of pieces) {
    if (current && current.length + piece.length > max) { chunks.push(current); current = ''; }
    if (piece.length > max) {
      if (current) { chunks.push(current); current = ''; }
      let start = 0;
      while (start < piece.length) {
        let end = Math.min(start + max, piece.length);
        if (end < piece.length) {
          const boundary = piece.lastIndexOf(' ', end);
          if (boundary > start + max / 2) end = boundary + 1;
        }
        chunks.push(piece.slice(start, end));
        start = end;
      }
    } else current += piece;
  }
  if (current) chunks.push(current);
  if (chunks.join('') !== row.source) throw Error('Chunk preparation altered the English source');
  for (let i = 0; i < chunks.length; i++) {
    const name = `chunk-${String(i + 1).padStart(3, '0')}.json`;
    await writeFile(path.join(dir, name), `${JSON.stringify({ source: chunks[i], translation: '', context: `${row.parentEntityId ?? row.entityId} part ${i + 1}/${chunks.length}` }, null, 2)}\n`, { mode: 0o600 });
  }
  console.log(JSON.stringify({ chunks: chunks.length, sourceChars: row.source.length }));
} else {
  const dir = path.join(work, 'chunks');
  const names = (await readdir(dir)).filter(name => /^chunk-\d+\.json$/.test(name)).sort();
  if (!names.length) throw Error('No translated chunks found');
  const chunks = await Promise.all(names.map(async name => JSON.parse(await readFile(path.join(dir, name), 'utf8'))));
  if (chunks.map(item => item.source).join('') !== row.source) throw Error('Chunk sources no longer match the batch');
  for (const chunk of chunks) validateTranslation(chunk);
  row.translation = chunks.map(item => item.translation).join('');
  validateTranslation(row);
  if (createHash('sha256').update(row.source).digest('hex') !== row.sourceSha256) throw Error('Batch source digest changed');
  await writeFile(file, `${JSON.stringify(batch, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ chunks: chunks.length, translationChars: row.translation.length }));
}
