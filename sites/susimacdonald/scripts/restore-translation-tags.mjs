#!/usr/bin/env node
// Restore the exact source HTML tags when a model only changed tag attributes.
// Abort on a different tag sequence so structural errors still require review.
import { readFileSync, writeFileSync } from 'node:fs';
import { validateTranslation } from './translation-guard.mjs';

const file = process.argv[2];
if (!file) throw Error('Usage: restore-translation-tags.mjs BATCH_FILE');
const data = JSON.parse(readFileSync(file, 'utf8'));
const rows = data.rows ?? [data];
let restored = 0;
for (const row of rows) {
  const sourceTags = row.source.match(/<[^>]+>/g) ?? [];
  const targetTags = row.translation.match(/<[^>]+>/g) ?? [];
  if (sourceTags.join('\0') === targetTags.join('\0')) {
    validateTranslation(row);
    continue;
  }
  const tagName = tag => tag.match(/^<\/?([a-z][\w:-]*)\b/i)?.[1]?.toLowerCase();
  if (sourceTags.length !== targetTags.length ||
      sourceTags.some((tag, index) => tagName(tag) !== tagName(targetTags[index]) ||
        tag.startsWith('</') !== targetTags[index].startsWith('</'))) {
    throw Error('HTML structure changed; exact-tag restoration is unsafe');
  }
  let index = 0;
  row.translation = row.translation.replace(/<[^>]+>/g, () => sourceTags[index++]);
  validateTranslation(row);
  restored++;
}
writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(JSON.stringify({ fields: rows.length, restored }));
