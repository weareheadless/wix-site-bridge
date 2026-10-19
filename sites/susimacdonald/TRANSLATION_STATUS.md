# Mexican Spanish translation status

Requested 18 October 2026. Direct translation only; no Wix translation credits or purchases.

Prepared: 120 Mexican Spanish UI/FAQ translations in `production/i18n/es-MX.json`, based on read-only copies of the existing Susi components. Existing source remains on the VPS at `/home/admin/susimacdonald-rentals`; no live content or source deployment changed.

Pending: save and install the two explicitly approved translation scopes on Susi Embed Bridge; retrieve complete native translation inventory and verify Spanish target locale/visibility; translate native copy, CMS listing narratives and remaining component configuration; integrate locale selection using supported Wix language context; synchronize existing normal sources/startup packets; human publish saved layout and confirm rendered Spanish.

Actual bridge translation-content read returned 403 before scope change. In-app browser controls repeatedly report disabled in Work settings, including after the human reported enabling them. This blocks the Developer Center permission save/install. Do not represent a connector's separate identity as this bridge's granted access, spend credits, or silently expand app permissions through another installation.

## Access corrected

Own installed app version 2.0 confirmed with both approved translation scopes. Translation reads succeed (HTTP 200) when the redundant wix-site-id header is omitted; app installation identity is verified against the exact Susi site ID before reading. Full private inventory: 921 source records, English only. App-instance multilingual configuration currently exposes only primary English (en-US); a Spanish target has not yet been confirmed. Earlier 403 was caused by request context, not missing installed permissions after update. No native translations saved yet.

## First native batch saved

128 Spanish draft records / 242 directly translated fields saved through Susi own bridge: native page titles, buttons, forms, chat and consultation copy. First batch returned 64 successes and 36 missing-parent failures; preserved original parentEntityId, skipped successes and completed remaining 64 records in the corrected batch. Original English and hidden language setting unchanged. Full site inventory contains approximately 198,507 source words across 921 records; listing narratives, long editorial copy, embedded component integration and production release remain incomplete. No full-site completion claim.
