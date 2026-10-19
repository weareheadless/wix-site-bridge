#!/usr/bin/env node
// Replace verbose Wix HTML tags with short immutable markers for model input.
// Restore the original source and exact tags before any bridge validation/write.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateTranslation } from './translation-guard.mjs';

const [mode, file] = process.argv.slice(2);
if (!['prepare', 'restore'].includes(mode) || !file) throw Error('Usage: compact-batch-html.mjs prepare|restore BATCH_FILE');
const batch = JSON.parse(readFileSync(file, 'utf8'));
const rows = batch.rows ?? [batch];
const mapFile = `${file}.html-map.json`;
const marker = index => `§${index}§`;
if (mode === 'prepare') {
  const maps = rows.map(row => {
    if (/§\d+§/.test(row.source)) throw Error('Source conflicts with HTML markers');
    const source = row.source;
    const tags = [];
    row.source = source.replace(/<[^>]+>/g, tag => {
      tags.push(tag);
      return marker(tags.length - 1);
    });
    if (row.previousTranslation) {
      const previousTags = row.previousTranslation.match(/<[^>]+>/g) ?? [];
      if (previousTags.join('\0') !== tags.join('\0')) throw Error('Previous translation HTML differs from source');
      let at = 0;
      row.previousTranslation = row.previousTranslation.replace(/<[^>]+>/g, () => marker(at++));
    }
    return { source, tags };
  });
  writeFileSync(mapFile, `${JSON.stringify(maps)}\n`, { mode: 0o600 });
  writeFileSync(file, `${JSON.stringify(batch, null, 2)}\n`);
  console.log(JSON.stringify({ fields: rows.length, sourceChars: maps.reduce((n, item) => n + item.source.length, 0), compactChars: rows.reduce((n, row) => n + row.source.length, 0) }));
} else {
  const maps = JSON.parse(readFileSync(mapFile, 'utf8'));
  if (maps.length !== rows.length) throw Error('HTML map row count changed');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], map = maps[i];
    let at = 0;
    const compactSource = map.source.replace(/<[^>]+>/g, () => marker(at++));
    if (row.source !== compactSource) throw Error(`Compact source changed in row ${i}`);
    const found = [...row.translation.matchAll(/§(\d+)§/g)].map(match => Number(match[1]));
    if (found.length !== map.tags.length || found.some((value, index) => value !== index)) {
      throw Error(`HTML markers changed in row ${i}`);
    }
    at = 0;
    row.translation = row.translation.replace(/§\d+§/g, () => map.tags[at++]);
    row.source = map.source;
    validateTranslation(row);
    delete row.previousTranslation;
    delete row.reviewReason;
  }
  writeFileSync(file, `${JSON.stringify(batch, null, 2)}\n`);
  console.log(JSON.stringify({ fields: rows.length, restored: true }));
}
