export function validateTranslation(row) {
  if (typeof row.translation !== 'string' || !row.translation.trim()) throw Error('Missing translation');
  const tags = text => [...text.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)].map(match => match[0].replace(/\s+/g, ' '));
  if (tags(row.source).join('|') !== tags(row.translation).join('|')) throw Error('HTML markup changed');
  const urls = text => [...text.matchAll(/https?:\/\/[^\s"'<>]+/g)].map(match => match[0]);
  if (urls(row.source).join('|') !== urls(row.translation).join('|')) throw Error('URL changed');
  const values = text => [...text.replace(/pies(?:\s+|\u00a0)cuadrados|pies²|square (?:feet|foot)/gi, 'sq ft').matchAll(/(?:[$€£]\s?\d[\d.,]*|\b\d[\d.,]*\s?(?:USD|MXN|%|m²|m2|sqm|sq\.?\s?m|sq\.?\s?ft)(?=\W|$))/gi)].map(match => match[0].replace(/[.,]$/, '').replace(/sq\.?\s?ft\b/gi, 'sq ft').replace(/\s*(?:m(?:2|²)|sqm|sq\.?\s?m)$/i, ' m²'));
  if (values(row.source).join('|') !== values(row.translation).join('|')) throw Error('Price, number, or measurement changed');
  const visible = row.translation.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  if (visible.length > 60) {
    const english = (visible.match(/\b(?:the|and|with|your|from|this|that|have|will|are|which|while|where|these|those|living|property|properties)\b/gi) ?? []).length;
    const spanish = (visible.match(/\b(?:el|la|los|las|de|del|que|con|para|una|uno|por|esta|este|sus|desde|donde|propiedad|propiedades)\b/gi) ?? []).length;
    if (english >= 3 && english > spanish / 2) throw Error(`Likely untranslated English: ${english} English markers, ${spanish} Spanish markers`);
  }
}
