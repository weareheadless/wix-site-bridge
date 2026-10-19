# Navbar language switch

- Shared `customElement1` / `atelier-navbar-v1`: small FR / EN buttons beside utility actions, thin rose active underline, quiet separator, no flags. Mobile switch remains beside the menu without requiring it to open.
- Wordmark link carries `translate="no"`: Atelier de l’harmonie and its brand signature stay French.
- Velo supplies `multilingual.siteLanguages` and `currentLanguage`, validates the requested language, and uses the supported currentLanguage setter to reload the current page in that language. No guessed `/en` routing and no visibility changes. Switch is hidden if Wix exposes fewer than two supported display languages.
- Existing native Wix language selector is separate: if present, the human removes it in Editor after publishing this replacement. Agents do not hide it through generated DOM selectors.
- Connected source commit: `601d7bd`; synchronized startup: `atelier-production-20261018-v49`. All 37 startup receipts match source hashes and manifest assignments; recovery snapshots remain private. Restore previous receipt snapshot HTML through bridge or disable affected startup entries; normal Wix source fallback remains.
- Human must publish current saved Editor layout. No CLI layout publish was performed. Live visual behavior and English switching remain pending that publication; local in-app preview connection was unavailable. English visibility is unchanged.

Official contract: https://dev.wix.com/docs/velo/apis/wix-window-frontend/multilingual/current-language
