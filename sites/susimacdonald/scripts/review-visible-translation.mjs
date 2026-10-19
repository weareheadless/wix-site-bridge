#!/usr/bin/env node
// Independent review of visible copy. Flag risky rows rather than blocking
// approved translations or making unreviewed replacements in legal copy.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [batchFile, resultFile, logFile] = process.argv.slice(2);
if (!batchFile || !resultFile || !logFile) throw Error('Usage: review-visible-translation.mjs BATCH_FILE RESULT_FILE LOG_FILE');
const batch = JSON.parse(readFileSync(batchFile, 'utf8'));
const rows = batch.rows ?? [batch];
const visible = value => value.replace(/<[^>]+>|§\d+§/g, '').replace(/\s+/g, ' ').trim();
const sample = rows.map((row, index) => ({ index, source: visible(row.source), translation: visible(row.translation) }));
if (sample.some(row => !row.translation)) throw Error('Review input has an empty translation');
const schema = {
  type: 'object', additionalProperties: false,
  required: ['rejected'],
  properties: {
    rejected: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['index', 'reason'], properties: { index: { type: 'integer' }, reason: { type: 'string' } } } },
  },
};
const temp = mkdtempSync(path.join(os.tmpdir(), 'susi-visible-review-'));
try {
  const schemaFile = path.join(temp, 'schema.json');
  const answerFile = path.join(temp, 'answer.json');
  writeFileSync(schemaFile, JSON.stringify(schema));
  const prompt = `Independently review EVERY indexed English-to-Mexican-Spanish translation for a luxury Riviera Maya real estate site. Your task is translation fidelity and natural language, not fact-checking the English source. If the Spanish faithfully repeats a claim in the source, do not reject it because the claim might be unverified. Flag only a clear translation error: an untranslated English sentence, a material addition or omission, changed names or numeric facts, a reversed legal/financial/geographic meaning, or Spanish so awkward it harms comprehension. Accept natural synonyms and ordinary local terminology; do not reject a merely stylistic preference or speculate about source truth. Review every row before answering. For each flagged index, quote the specific source and Spanish phrases that differ in meaning. Some source copy is already Spanish. Do not edit files or use tools. HTML is checked separately; here you see visible copy only. Return the required short JSON.\n${JSON.stringify(sample)}`;
  const child = spawnSync('codex', [
    'exec', '-m', 'gpt-6-luna', '-c', 'model_reasoning_effort=low', '--ephemeral',
    '--ignore-user-config', '--skip-git-repo-check', '-C', temp, '-s', 'read-only',
    '--output-schema', schemaFile, '-o', answerFile, '-'
  ], {
    input: prompt, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR ?? os.tmpdir() },
  });
  writeFileSync(logFile, `${child.stdout ?? ''}\n${child.stderr ?? ''}`);
  if (child.status !== 0) throw Error(`Independent review failed; inspect ${logFile}`);
  const answer = JSON.parse(readFileSync(answerFile, 'utf8'));
  const rejected = answer.rejected;
  if (!Array.isArray(rejected) || rejected.some(item => !Number.isInteger(item.index) || item.index < 0 || item.index >= rows.length ||
      typeof item.reason !== 'string' || !item.reason.trim()) ||
      new Set(rejected.map(item => item.index)).size !== rejected.length) throw Error('Invalid reviewer findings');
  writeFileSync(resultFile, `${JSON.stringify({ rejectedIndices: rejected.map(item => item.index),
    reasonsByIndex: Object.fromEntries(rejected.map(item => [item.index, item.reason])),
    reason: rejected.map(item => `${item.index}: ${item.reason}`).join('; ') }, null, 2)}\n`, { mode: 0o600 });
  const usage = [...(`${child.stdout ?? ''}\n${child.stderr ?? ''}`).matchAll(/tokens used\s*([\d,]+)/g)].at(-1)?.[1];
  console.log(JSON.stringify({ fields: rows.length, accepted: rows.length - rejected.length, flagged: rejected.length, tokensUsed: usage ? Number(usage.replaceAll(',', '')) : null }));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
