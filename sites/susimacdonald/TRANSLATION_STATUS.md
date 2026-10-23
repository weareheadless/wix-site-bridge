# Mexican Spanish translation

## Current state — 18 October 2026

- Own Susi Embed Bridge v2.0 has the explicitly approved translation read/write permissions. App-only translation requests succeed when the redundant `wix-site-id` header is omitted. Each helper verifies the installed app's actual site ID before using that context.
- Human confirms Spanish (Mexico) is added and hidden. Public launch is authorized once complete. Target translation records use language code `es`; Mexican wording is written directly. No machine-translation credits or purchases.
- **Verified by fresh API read-back: 616 Spanish draft records / 1,610 fields; zero published fields.** All 215 nonempty listing titles and all 214 nonempty listing summaries and meta descriptions are saved. Price labels, property types and availability have 451 additional translated fields; 57 additional short native footer/contact/navigation fields are saved. The previous 584-record / 794-field cumulative claim was not an exact inventory count; this fresh count supersedes it.
- Saved content remains unpublished drafts. Existing English, CMS records, datasets, layout and startup snippets were not changed.
- Prepared separately: 120 custom-interface translations in `production/i18n/es-MX.json`. Component integration and ordinary source/startup release are not yet complete.

## Remaining work

- Complete full listing narratives, long editorial/legal copy, remaining native text and page-specific custom component/configuration translations. Property cards (names, prices, beds/baths, availability, delivery, status) and city-guide bodies are CMS translations, not embed-page translations; they move to the CMS phase after the embed chrome is complete. Listing titles, summaries, metadata and translated status/price labels are now complete for all nonempty source fields.
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

## First CLI setup completed

The human created `weareheadless/susimacdonald-wix` through Wix Git Integration. Its generated config was inspected at commit `6583f8b493fa93ed2d19b35411afa960e4c491d5`: exact selected siteId, uiVersion `3267`. Canonical connected checkout is `/home/admin/susimacdonald-wix` on the authorized VPS. Dependencies installed and existing CLI authentication confirmed without exposing identity or credentials. `wix publish --help` confirms `--source local|remote` and `--approve-preview`; no publication has been run. Do not use `--force`. Preserve the generated saved layout and refresh it if the human changes Editor layout. Historical `/home/admin/susimacdonald-rentals` remains a design/source reference, not the connected publisher.

A source working copy at `/Users/benjamin/Documents/Codex/2026-10-18/susimacdonald-wix` contains prepared component render-localization edits; these are NOT pushed or deployed. `scripts/localize-components.mjs` records original/generated hashes and alters only rendering writes, accessible labels and same-site links. It has no persistent DOM observer or parallel listing data. Additional component and page-config translation dictionaries are prepared. Dictionary normalization was improved after the initial local build; regenerate from the original connected source before release. Complete configuration copy, inspect localization coverage, rebuild the matching early packets and synchronize both controllers (including `/es` route handling) before deploying. Do not publish this incomplete working copy.
