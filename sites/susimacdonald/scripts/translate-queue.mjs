#!/usr/bin/env node
// A resumable bridge queue. A language model fills the exported batch; this
// script validates and publishes it through the installed Susi bridge app.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { WixAppTokenProvider } from '../../../src/wix-client.mjs';
import { validateTranslation } from './translation-guard.mjs';

const alias = 'susimacdonald';
const siteId = '878460ca-c98c-402b-8a10-862023f67cce';
const stateDir = path.resolve('sites/susimacdonald/.wix-bridge-state/translation-queue');
const manifestPath = 'sites/susimacdonald/site.manifest.json';
const args = process.argv.slice(2);
const command = args[0];
const option = (name, fallback) => {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
};
const apply = args.includes('--apply');
const digest = value => createHash('sha256').update(value).digest('hex');
const keyOf = row => JSON.stringify([row.schemaId, row.entityId, row.locale]);
const fieldKey = (row, id) => JSON.stringify([row.schemaId, row.entityId, id]);
const equivalentContent = (left, right) => {
  const normalize = value => value.split(/(<[^>]+>)/g).map(part =>
    part.startsWith('<') ? part : part.replace(/\s+/g, ' ').trim());
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
};

if (!['next', 'next-quarantine', 'apply', 'verify', 'status'].includes(command) || option('--site') !== alias || process.env.WIX_ALLOWED_SITE_IDS !== siteId) {
  throw Error('Use next|next-quarantine|apply|verify|status --site susimacdonald with the exact Susi site allowlist');
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.site?.alias !== alias || manifest.site?.siteId !== siteId) throw Error('Susi manifest target mismatch');
await mkdir(stateDir, { recursive: true, mode: 0o700 });
const quarantine = await readFile(path.join(stateDir, 'quarantine.json'), 'utf8').then(JSON.parse).catch(error => {
  if (error.code === 'ENOENT') return {};
  throw error;
});

async function client() {
  const token = await WixAppTokenProvider.fromEnv().getToken();
  const headers = { authorization: token, 'content-type': 'application/json' };
  const identityResponse = await fetch('https://www.wixapis.com/apps/v1/instance', { headers });
  if (!identityResponse.ok) throw Error(`Bridge identity HTTP ${identityResponse.status}`);
  const identity = await identityResponse.json();
  if (identity.site?.siteId !== siteId) throw Error('Bridge app is installed on a different site');
  return headers;
}

async function inventory(headers) {
  const rows = [];
  let cursor;
  for (let page = 0; page < 100; page++) {
    const response = await fetch('https://www.wixapis.com/translation-content/v1/contents/query', {
      method: 'POST', headers,
      body: JSON.stringify({ query: { cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) } } }),
    });
    if (!response.ok) throw Error(`Translation inventory HTTP ${response.status}`);
    const data = await response.json();
    rows.push(...(data.contents ?? []));
    if (!data.pagingMetadata?.hasNext) return rows;
    cursor = data.pagingMetadata.cursors?.next;
    if (!cursor) throw Error('Wix reported more content without a cursor');
  }
  throw Error('Translation inventory exceeded 100 pages');
}

function remaining(rows) {
  const mainPages = new Set(['h4hzq', 'ch3wm', 's3xoo', 'avbtc', 'ugrr9', 'qu5lr', 'bwtyp', 'wwbvi', 'gvoul']);
  const placeholders = new Set(['Image Title', 'Add a title', 'Add text here']);
  const spanish = new Map(rows.filter(row => row.locale === 'es').map(row => [keyOf(row), row]));
  const queued = [];
  for (const en of rows.filter(row => row.locale === 'en')) {
    const es = spanish.get(JSON.stringify([en.schemaId, en.entityId, 'es']));
    for (const [fieldId, source] of Object.entries(en.fields ?? {})) {
      if (typeof source.textValue !== 'string' || !source.textValue.trim()) continue;
      if (/(?:^|-)data-uri$/.test(fieldId) || /^wix:image:\/\//.test(source.textValue)) continue;
      if (placeholders.has(source.textValue.trim())) continue;
      const target = es?.fields?.[fieldId];
      if (target?.published === true) continue;
      if (quarantine[fieldKey(en, fieldId)]?.sourceSha256 === digest(source.textValue)) continue;
      // Preserve existing drafts: they are candidates for human/model review,
      // not empty slots that a new translation may silently overwrite.
      queued.push({ schemaId: en.schemaId, entityId: en.entityId, parentEntityId: en.parentEntityId ?? null,
        fieldId, source: source.textValue, sourceSha256: digest(source.textValue),
        existingSpanish: typeof target?.textValue === 'string' ? target.textValue : null,
        existingPublished: target?.published === true });
    }
  }
  // Main pages first; other page copy follows, then listings and long copy.
  const priority = row => mainPages.has(row.parentEntityId) || mainPages.has(row.entityId) ? 0
    : row.parentEntityId ? 1 : row.schemaId === '672796f0-1e24-49d3-918d-2e531f79dac4' ? 3 : 2;
  const visibleWords = row => (row.source.replace(/<[^>]+>/g, ' ').match(/\b[\wÀ-ÿ]+\b/g) ?? []).length;
  return queued.sort((a, b) => priority(a) - priority(b) ||
    visibleWords(b) - visibleWords(a) ||
    (a.parentEntityId ?? '').localeCompare(b.parentEntityId ?? '') ||
    a.entityId.localeCompare(b.entityId) || a.fieldId.localeCompare(b.fieldId));
}

function activeQuarantineCount(rows) {
  const spanish = new Map(rows.filter(row => row.locale === 'es').map(row => [keyOf(row), row]));
  let count = 0;
  for (const en of rows.filter(row => row.locale === 'en')) {
    const es = spanish.get(JSON.stringify([en.schemaId, en.entityId, 'es']));
    for (const [fieldId, source] of Object.entries(en.fields ?? {})) {
      if (es?.fields?.[fieldId]?.published === true) continue;
      if (typeof source.textValue === 'string' &&
          quarantine[fieldKey(en, fieldId)]?.sourceSha256 === digest(source.textValue)) count++;
    }
  }
  return count;
}

async function quarantinedRows(rows) {
  const spanish = new Map(rows.filter(row => row.locale === 'es').map(row => [keyOf(row), row]));
  const savedBatches = new Map();
  const queued = [];
  for (const en of rows.filter(row => row.locale === 'en')) {
    const es = spanish.get(JSON.stringify([en.schemaId, en.entityId, 'es']));
    for (const [fieldId, source] of Object.entries(en.fields ?? {})) {
      const item = quarantine[fieldKey(en, fieldId)];
      if (!item || (item.attempts ?? 1) >= 3 || es?.fields?.[fieldId]?.published === true ||
          typeof source.textValue !== 'string' || item.sourceSha256 !== digest(source.textValue)) continue;
      if (!/^batch-[a-zA-Z0-9_-]+\.json$/.test(item.batch)) throw Error('Invalid quarantine batch name');
      if (!savedBatches.has(item.batch)) savedBatches.set(item.batch, (await readBatch(item.batch)).batch);
      const previous = savedBatches.get(item.batch).rows.find(row =>
        row.schemaId === en.schemaId && row.entityId === en.entityId && row.fieldId === fieldId);
      if (!previous?.translation) throw Error(`Missing quarantined translation for ${en.entityId}.${fieldId}`);
      queued.push({ schemaId: en.schemaId, entityId: en.entityId, parentEntityId: en.parentEntityId ?? null,
        fieldId, source: source.textValue, sourceSha256: item.sourceSha256,
        existingSpanish: typeof es?.fields?.[fieldId]?.textValue === 'string' ? es.fields[fieldId].textValue : null,
        existingPublished: false, previousTranslation: previous.translation, reviewReason: item.reason });
    }
  }
  return queued.sort((a, b) => (a.parentEntityId ?? '').localeCompare(b.parentEntityId ?? '') ||
    a.entityId.localeCompare(b.entityId) || a.fieldId.localeCompare(b.fieldId));
}

async function readBatch(name) {
  if (!name || path.basename(name) !== name || !/^batch-[a-zA-Z0-9_-]+\.json$/.test(name)) throw Error('Pass a private batch filename such as batch-001.json');
  return { file: path.join(stateDir, name), batch: JSON.parse(await readFile(path.join(stateDir, name), 'utf8')) };
}

if (command === 'next' || command === 'next-quarantine' || command === 'status') {
  const headers = await client();
  const rows = await inventory(headers);
  const left = command === 'next-quarantine' ? await quarantinedRows(rows) : remaining(rows);
  const summary = { site: alias, records: rows.length, remainingFields: left.length,
    quarantinedFields: activeQuarantineCount(rows),
    existingDrafts: left.filter(row => row.existingSpanish !== null).length,
    noSpanishField: left.filter(row => row.existingSpanish === null).length };
  if (command === 'status') { console.log(JSON.stringify(summary)); process.exit(0); }
  const limit = Number(option('--limit', '12'));
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw Error('--limit must be 1..30');
  const maxChars = Number(option('--max-chars', '12000'));
  if (!Number.isInteger(maxChars) || maxChars < 500 || maxChars > 100000) throw Error('--max-chars must be 500..100000');
  const batchRows = [];
  let chars = 0;
  for (const row of left) {
    if (batchRows.length >= limit) break;
    // Fill spare capacity with later fields instead of ending a batch when
    // one large field does not fit. The skipped field leads the next batch.
    if (chars + row.source.length > maxChars && batchRows.length) continue;
    batchRows.push(row);
    chars += row.source.length;
  }
  if (!batchRows.length) { console.log(JSON.stringify({ ...summary, complete: true })); process.exit(0); }
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const name = `batch-${command === 'next-quarantine' ? 'rework-' : ''}${stamp}.json`;
  const batch = { siteAlias: alias, siteId, locale: 'es-MX', instructions: 'Translate each source to natural Mexican Spanish. Preserve HTML tags, links, names, prices, dates, measurements, and legal meaning. Fill translation only. Existing Spanish drafts are context; correct them when needed.',
    rows: batchRows.map(row => ({ ...row, translation: '' })) };
  await writeFile(path.join(stateDir, name), `${JSON.stringify(batch, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify({ ...summary, batch: path.join(stateDir, name), batchFields: batchRows.length, sourceChars: chars }));
  process.exit(0);
}

const { file, batch } = await readBatch(option('--batch'));
if (batch.siteAlias !== alias || batch.siteId !== siteId || batch.locale !== 'es-MX' || !Array.isArray(batch.rows) || !batch.rows.length) throw Error('Invalid Susi batch');
const seen = new Set();
for (const row of batch.rows) {
  const key = fieldKey(row, row.fieldId);
  if (seen.has(key)) throw Error(`Repeated field ${key}`);
  seen.add(key);
  if (typeof row.source !== 'string' || digest(row.source) !== row.sourceSha256 || typeof row.translation !== 'string' || !row.translation.trim()) throw Error(`Incomplete or altered source ${key}`);
  try { validateTranslation(row); } catch (error) { throw Error(`${error.message} for ${key}`); }
}
const headers = await client();
const live = await inventory(headers);
const liveMap = new Map(live.map(row => [keyOf(row), row]));
if (command === 'verify') {
  for (const row of batch.rows) {
    const saved = liveMap.get(JSON.stringify([row.schemaId, row.entityId, 'es']))?.fields?.[row.fieldId];
    if (saved?.published !== true || !equivalentContent(saved.textValue, row.translation)) {
      throw Error(`Read-back mismatch for ${row.entityId}.${row.fieldId}`);
    }
  }
  console.log(JSON.stringify({ site: alias, batch: path.basename(file), fields: batch.rows.length, status: 'verified' }));
  process.exit(0);
}
for (const row of batch.rows) {
  const en = liveMap.get(JSON.stringify([row.schemaId, row.entityId, 'en']));
  const es = liveMap.get(JSON.stringify([row.schemaId, row.entityId, 'es']));
  if (!en || digest(en.fields?.[row.fieldId]?.textValue ?? '') !== row.sourceSha256) throw Error(`English source changed for ${row.entityId}.${row.fieldId}`);
  const current = es?.fields?.[row.fieldId];
  if (current?.published === true) throw Error(`Spanish field already published: ${row.entityId}.${row.fieldId}`);
  const unchanged = (current?.textValue ?? null) === row.existingSpanish;
  const ownCreatedDraft = row.existingSpanish === null && current?.textValue === row.translation && current.published === false;
  if (!unchanged && !ownCreatedDraft) throw Error(`Spanish draft changed: ${row.entityId}.${row.fieldId}`);
}
const groups = new Map();
for (const row of batch.rows) {
  const key = JSON.stringify([row.schemaId, row.entityId]);
  const old = groups.get(key) ?? { schemaId: row.schemaId, entityId: row.entityId, locale: 'es', fields: {} };
  old.fields[row.fieldId] = { textValue: row.translation, published: true, updatedBy: 'USER' };
  groups.set(key, old);
}
const updates = [...groups.values()].map(record => ({ content: record }));
const missing = updates.filter(item => !liveMap.has(JSON.stringify([item.content.schemaId, item.content.entityId, 'es'])));
const preview = { site: alias, batch: path.basename(file), records: updates.length, fields: batch.rows.length, apply };
console.log(JSON.stringify(preview));
if (!apply) process.exit(0);
const receiptFile = path.join(stateDir, `receipt-${Date.now()}.json`);
const receipt = { ...preview, status: 'started', before: batch.rows.map(row => ({ schemaId: row.schemaId, entityId: row.entityId, fieldId: row.fieldId, existingSpanish: row.existingSpanish })), results: [] };
await writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
for (let offset = 0; offset < missing.length; offset += 100) {
  const drafts = missing.slice(offset, offset + 100).map(({ content }) => ({
    schemaId: content.schemaId, entityId: content.entityId, locale: 'es',
    ...(batch.rows.find(row => row.schemaId === content.schemaId && row.entityId === content.entityId)?.parentEntityId
      ? { parentEntityId: batch.rows.find(row => row.schemaId === content.schemaId && row.entityId === content.entityId).parentEntityId }
      : {}),
    fields: Object.fromEntries(Object.entries(content.fields).map(([id, field]) => [id, { ...field, published: false }])),
  }));
  const response = await fetch('https://www.wixapis.com/translation-content/v1/bulk/contents/create', {
    method: 'POST', headers, body: JSON.stringify({ contents: drafts, returnEntity: true }),
  });
  if (!response.ok) throw Error(`Bridge draft create HTTP ${response.status}; inspect ${receiptFile}`);
  const result = await response.json();
  receipt.results.push({ stage: 'create', result });
  await writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  if (result.bulkActionMetadata?.totalFailures || !result.results?.every(item => item.itemMetadata?.success)) throw Error(`Partial draft creation; inspect ${receiptFile}`);
}
for (let offset = 0; offset < updates.length; offset += 100) {
  const response = await fetch('https://www.wixapis.com/translation-content/v1/bulk/contents/update-by-key', {
    method: 'POST', headers, body: JSON.stringify({ contents: updates.slice(offset, offset + 100), returnEntity: true }),
  });
  if (!response.ok) throw Error(`Bridge update HTTP ${response.status}; inspect ${receiptFile}`);
  const result = await response.json();
  receipt.results.push({ stage: 'publish', result });
  await writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  if (result.bulkActionMetadata?.totalFailures || !result.results?.every(item => item.itemMetadata?.success)) throw Error(`Partial update; inspect ${receiptFile}`);
}
const verified = await inventory(headers);
const after = new Map(verified.map(row => [keyOf(row), row]));
for (const row of batch.rows) {
  const saved = after.get(JSON.stringify([row.schemaId, row.entityId, 'es']))?.fields?.[row.fieldId];
  if (saved?.published !== true || !equivalentContent(saved.textValue, row.translation)) throw Error(`Read-back mismatch for ${row.entityId}.${row.fieldId}; inspect ${receiptFile}`);
}
receipt.status = 'verified';
await writeFile(receiptFile, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ...preview, status: 'verified', receipt: receiptFile }));
