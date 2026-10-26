import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTranslation } from './translation-guard.mjs';

test('accepts fluent real estate copy with exact markup and price', () => {
  assert.doesNotThrow(() => validateTranslation({
    source: '<p>Explore condos from $250,000 USD in Tulum.</p>',
    translation: '<p>Descubre departamentos desde $250,000 USD en Tulum.</p>',
  }));
});

test('rejects altered markup, links and monetary values', () => {
  const source = '<a href="https://example.com">Condos from $250,000 USD</a>';
  for (const translation of [
    '<p>Departamentos desde $250,000 USD</p>',
    '<a href="https://elsewhere.com">Departamentos desde $250,000 USD</a>',
    '<a href="https://example.com">Departamentos desde $200,000 USD</a>',
  ]) assert.throws(() => validateTranslation({ source, translation }));
});

test('rejects conspicuous English left in long Spanish copy', () => {
  assert.throws(() => validateTranslation({
    source: 'Imagine waking up by the beach with property opportunities nearby.',
    translation: 'Imagine waking with your property and the beautiful beach while living de la zona.',
  }), /Likely untranslated English/);
});

test('accepts localized square-foot wording with the same measurements', () => {
  assert.doesNotThrow(() => validateTranslation({
    source: '<p>From 300 to 500 sq ft at $90,000 USD.</p>',
    translation: '<p>De 300 a 500 pies cuadrados por $90,000 USD.</p>',
  }));
});

test('ignores sentence punctuation after an unchanged currency figure', () => {
  assert.doesNotThrow(() => validateTranslation({
    source: '<p>Fees can reach $3,000.</p>',
    translation: '<p>Los cargos pueden alcanzar $3,000</p>',
  }));
});
