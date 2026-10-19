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
- Build and startup dry-run completed. A fresh French homepage showed the existing v47 render with 15 live product cards. Public Wix still serves v47 until publication/cache refresh; this is not v48 paint verification. No English render, internal-navigation check or test suite was run. Startup v48 is installed and the connected source commit is pushed; the human still needs to publish the saved Editor layout.

## Pending

- Our bridge app is the deployment identity. The Wix plugin is not required. The human approved adding only `SCOPE.DC-MULTILINGUAL.READ_TRANSLATION_CONTENT` and `SCOPE.DC-MULTILINGUAL.WRITE_TRANSLATION_CONTENT`; app v2.0 was released and the Atelier installation updated. Translation query and published-product query succeeded through the bridge. Schema enumeration remains outside these scopes and is not required for the recorded mappings.
- Native translation inventory contained 159 records, including 35 French product records, 5 product-option records and native page/form/app settings. No English product records were present in that inventory. Sitemap URLs are not an authoritative product count.
- Completed through our bridge: 156 English records / 423 text fields created, then marked for publication without changing language visibility. Both bulk operations returned 100 + 56 successes and zero failures. English product publication query returned 35 records. Existing 3 English records were preserved. Receipts and original/source working copies are private, never committed.
- Runtime reader uses official `@wix/multilingual.translationPublishedContents` with a fixed native catalog schema, English locale and explicit product IDs. Canonical French names still drive category rules; translated display names and descriptions come from Wix. Generic option labels translate visually; cart choice keys/values remain canonical. Actual published Velo execution remains to inspect after human publication.
- Native form/page/category/cookie/checkout text present in the Wix translation inventory is translated. Gift-card app strings and full native blog article bodies were not exposed in that inventory; those remain a coverage check, and custom journal chrome does not translate articles. Do not claim complete native blog translation.
- English route slugs may be configured by Wix. Verify actual locale routes before publication; current prepared link/registry coverage assumes the confirmed subdirectory mode with `/en` and unchanged slugs.
- Connected source `weareheadless/atelier-harmonie` main commit `cae30d2` is pushed. Unrelated `wix.config.json` and the pre-existing untracked lockfile were excluded. Official SDK dependencies are declared in package.json.
- Startup v48 applied through the bridge; all 37 returned receipt hashes match expected source, Head placement and all-pages scope. New packet IDs are recorded in the site manifest. Roll back using private startup-before snapshots; ordinary Wix sources remain fallback. Human publishes current saved Editor layout. Never CLI-publish revision 740.
- Inspect fresh English and French loads and internal navigation, product/cart flows, text wrapping and SEO. Keep English hidden until human authorizes launch.

Current installed startup: v48. This is not evidence of English browser paint. English remains hidden.

Reusable customer translation command: `node sites/atelier-harmonie/scripts/translations.mjs --site atelier-harmonie --operation snapshot` (private snapshot), or `--operation create|update --plan <private-plan.json>` (dry-run; `--apply` only for a reviewed authorized plan). It accepts English text only and never changes locale visibility.
