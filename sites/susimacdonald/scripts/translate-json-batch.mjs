#!/usr/bin/env node
// Ask Luna for structured translations directly; never ask it to edit JSON files.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [batchFile, logFile] = process.argv.slice(2);
if (!batchFile || !logFile) throw Error('Usage: translate-json-batch.mjs BATCH_FILE LOG_FILE');
const batch = JSON.parse(readFileSync(batchFile, 'utf8'));
const rows = batch.rows ?? [batch];
if (!rows.length || rows.some(row => typeof row.source !== 'string' || row.translation)) throw Error('Invalid input batch');
const input = rows.map((row, index) => ({ index, source: row.source,
  ...(row.previousTranslation ? { previousTranslation: row.previousTranslation } : {}),
  ...(row.reviewReason ? { reviewReason: row.reviewReason } : {}),
}));
const schema = {
  type: 'object', additionalProperties: false, required: ['translations'],
  properties: { translations: { type: 'array', items: { type: 'object', additionalProperties: false,
    required: ['index', 'text'], properties: { index: { type: 'integer' }, text: { type: 'string' } } } } },
};
const temp = mkdtempSync(path.join(os.tmpdir(), 'susi-json-translation-'));
try {
  const schemaFile = path.join(temp, 'schema.json');
  const answerFile = path.join(temp, 'answer.json');
  writeFileSync(schemaFile, JSON.stringify(schema));
  const complete = new Map();
  let totalTokens = 0;
  for (let attempt = 0; attempt < 3 && complete.size < rows.length; attempt++) {
    const missing = input.filter(item => !complete.has(item.index));
    const prompt = `Translate EVERY indexed source string into fluent, idiomatic Mexican Spanish for a luxury Riviera Maya real estate website. Preserve facts, place names, prices, dates, measurements, links, numeric figures, and legal meaning. Use natural Mexican real estate language where the source calls for it. Some source content is already Spanish; preserve it when natural. If previousTranslation and reviewReason are present, revise that translation to address the review concern without introducing new claims. Each §0§-style marker represents an HTML tag: copy each marker exactly in the same order, without adding or omitting any. Return an object with the same index and complete translated text for EACH input row. Do not omit an index, use tools, or edit files. Only return the required structured JSON.\n${JSON.stringify(missing)}`;
    const child = spawnSync('codex', [
      'exec', '-m', 'gpt-6-luna', '-c', 'model_reasoning_effort=low', '--ephemeral',
      '--ignore-user-config', '--skip-git-repo-check', '-C', temp, '-s', 'read-only',
      '--output-schema', schemaFile, '-o', answerFile, '-'
    ], { input: prompt, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
      env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR ?? os.tmpdir() } });
    writeFileSync(logFile, `${attempt ? `\n--- retry ${attempt} ---\n` : ''}${child.stdout ?? ''}\n${child.stderr ?? ''}`, { flag: attempt ? 'a' : 'w' });
    if (child.status !== 0) throw Error(`Structured translation failed; inspect ${logFile}`);
    const answer = JSON.parse(readFileSync(answerFile, 'utf8'));
    if (!Array.isArray(answer.translations)) throw Error('Structured translation returned no rows');
    const allowed = new Set(missing.map(item => item.index));
    for (const item of answer.translations) {
      if (!allowed.has(item.index) || complete.has(item.index) || typeof item.text !== 'string' || !item.text.trim()) {
        throw Error('Structured translation returned an invalid or repeated index');
      }
      complete.set(item.index, item.text);
    }
    const usage = [...(`${child.stdout ?? ''}\n${child.stderr ?? ''}`).matchAll(/tokens used\s*([\d,]+)/g)].at(-1)?.[1];
    totalTokens += usage ? Number(usage.replaceAll(',', '')) : 0;
  }
  if (complete.size !== rows.length) throw Error(`Structured translation missing ${rows.length - complete.size} rows after retries`);
  for (let i = 0; i < rows.length; i++) rows[i].translation = complete.get(i);
  writeFileSync(batchFile, `${JSON.stringify(batch, null, 2)}\n`);
  console.log(JSON.stringify({ fields: rows.length, tokensUsed: totalTokens }));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
