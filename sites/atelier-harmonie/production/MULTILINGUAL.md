# English translation release — draft

Target: `--site atelier-harmonie`, site ID `376faa89-fe6c-4ae8-8feb-10520e813a89`.

English exists in Wix Multilingual and is hidden by the human's choice. Keep it hidden. No English visibility, locale, original French content or native translation content has been changed by this release.

## Prepared

- 846 original static strings translated in `i18n/en.json`, with additional shopping/accessibility messages in `i18n/ui.en.json`.
- Initial 487-string draft used existing Wix machine-translation credits before the human requested direct translation. Remaining copy was translated directly. No further machine translation or credit purchases.
- Corrected craft terminology, retained Atelier de l'harmonie and collection proper names, and preserved original legal clauses, dates, figures and French-precedence clause.
- Build injects a dictionary scoped to each of the 25 component definitions. Visible text, accessibility labels and internal links adapt to English. Canonical product option values and cart inputs stay untouched.
- Supported `wix-window-frontend.multilingual.currentLanguage` flows into existing elements through a `locale` attribute. French is the default.
- Scoped translation observers watch only each English component's own shadow root to handle asynchronous UI; they disconnect with the component. No Wix DOM selectors or document observers.
- English SEO markup is generated from the same dictionaries. Workshops metadata also has English copy.
- Startup v48 draft normalizes the `/en` prefix and keeps the same route registration/preload coverage. Both Head entries and normal source packets must deploy together.
- Build and startup dry-run completed. No browser render, internal-navigation check or test suite was run. The release is not installed or published.

## Pending

- Wix connector was removed/uninstalled during this work. Plugin discovery confirms Wix is available but not installed. Restore it before using translation-management APIs.
- Native translation inventory contained 159 records, including 35 French product records, 5 product-option records and native page/form/app settings. No English product records were present in that inventory. Sitemap URLs are not an authoritative product count.
- Read complete native source text in bounded batches, translate directly, and save English via documented translation-content bulk create/update APIs. Do not overwrite originals, consume machine credits, or invent a parallel product database.
- Confirm how live Velo product queries receive native English content; preserve French canonical classification/option identities for filtering and checkout.
- Finish native forms, gift-card application, checkout and blog translation coverage. Custom journal chrome does not translate native articles.
- English route slugs may be configured by Wix. Verify actual locale routes before publication; current prepared link/registry coverage assumes the confirmed subdirectory mode with `/en` and unchanged slugs.
- Sync reviewed source into selected `weareheadless/atelier-harmonie` checkout; do not stage its unrelated `wix.config.json` or `package-lock.json`.
- Install startup only after native coverage and locale runtime integration are ready; inspect receipts/mappings. Human publishes their current saved Editor layout. Never CLI-publish revision 740.
- Inspect fresh English and French loads and internal navigation, product/cart flows, text wrapping and SEO. Keep English hidden until human authorizes launch.

Current installed startup remains v47. v48 files are preparation, not evidence of live translation.
