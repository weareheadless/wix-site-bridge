import { translationPublishedContents } from '@wix/multilingual';
import { auth } from '@wix/essentials';

// Read Wix's authoritative published English copy. No local product snapshot or credentials.
const queryPublished = auth.elevate(translationPublishedContents.queryPublishedContent);
export async function englishProductCopy(ids, locale) {
 if (locale !== 'en' || !ids.length) return new Map();
 const response = await queryPublished({
  filter: {
   'schemaKey.appId': {$eq: '1380b703-ce81-ff05-f115-39571d94dfcd'},
   'schemaKey.entityType': {$eq: 'catalog-product'},
   'schemaKey.scope': {$eq: 'GLOBAL'},
   locale: {$eq: 'en'},
   entityId: {$in: ids.slice(0,100)}
  },
  cursorPaging: {limit: 100}
 });
 return new Map((response.publishedContent || []).map(record => [record.entityId, record.fields || []]));
}

export function translatedField(fields, key) {
 return fields?.find(field => field.schemaFieldKey === key)?.textValue;
}
