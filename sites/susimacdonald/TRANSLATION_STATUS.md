# Mexican Spanish translation

## Current state — 18 October 2026

- Own Susi Embed Bridge v2.0 has the explicitly approved translation read/write permissions. App-only translation requests succeed when the redundant `wix-site-id` header is omitted. Each helper verifies the installed app's actual site ID before using that context.
- Human confirms Spanish (Mexico) is added and hidden. Preserve that visibility. Target translation records use language code `es`; Mexican wording is written directly. No machine-translation credits or purchases.
- **584 Spanish draft records / 794 text fields saved in native Wix**: 128 records / 242 fields for titles, buttons, forms, chat and consultation; 241 rich-text page-copy records; 48 listing records / 144 fields plus 167 title-only listing records for titles, summaries and meta descriptions.
- Saved content remains unpublished drafts. Existing English, CMS records, datasets, layout and startup snippets were not changed.
- Prepared separately: 120 custom-interface translations in `production/i18n/es-MX.json`. Component integration and ordinary source/startup release are not yet complete.

## Remaining work

- Complete remaining listing titles/summaries/metadata (summaries/metadata for source listing indexes 48–216; all 215 nonempty listing titles are translated), full listing narratives, long editorial/legal copy, other native text and custom component/configuration translations.
- Preserve HTML, links, prices, dates, measurements, factual and legal meaning. Do not treat translation as a rewrite or silently update old dated claims.
- Source inventory: 921 English records, approximately 198,507 words including HTML/source content, across 22 schemas. This is substantially more than the interface dictionary. Do not claim the whole site is translated.
- Wire locale through supported Wix context; synchronize ordinary custom-element source and both existing early controllers/packets before an authorized production release. Human publishes the current saved Editor layout. Native Spanish visibility remains a separate launch decision.

## Recovery and resumability

Private ignored `.wix-bridge-state/translation-source-original.json` is the original English inventory. `translation-inventory.json` is the latest read-back. `spanish-drafts-receipt-*.json` holds returned IDs, successes and original snapshot references. First batch missed required parentEntityId on 36 items; those were corrected using original parent mappings, skipping all successful creates. Subsequent batches succeeded with zero failures.

`save-spanish-drafts.mjs --site susimacdonald` previews the reviewed private `native-spanish-plan.json`; `--apply` saves only explicit Spanish draft text. It refuses duplicate keys already present in Wix. Later additions to existing Spanish records need a documented update-by-key operation preserving all prior fields; never delete/recreate to append fields.

Source dictionaries and reviewed listing translations are versioned under `production/i18n/`; these are editorial source artifacts, not a parallel runtime catalog. Runtime listing data remains in Wix.

Read-back confirmed original English fields unchanged. Spanish configuration now appears in app-instance context with languageCode es and countryCode MEX, consistent with the human-selected target. Direct Spanish rich-text translations preserve original tags and link destinations; 31 split-span records were translated per text span. Most recent native draft batch completed with zero failures.

## Publication authorization

Human explicitly requested finish and publish on 18 October 2026; Spanish public launch is authorized once complete. Current translation is incomplete and remains draft/hidden. Existing saved-layout/publication boundaries still apply; no stale CLI UI snapshot may be published. Four listing batches contain complete title/summary/meta text (48 records); following three batches cover all remaining 167 nonempty titles. Two original blank titles stay blank. Full property narratives and custom component integration remain pending.
