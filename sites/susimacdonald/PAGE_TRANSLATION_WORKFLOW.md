# Susi page-by-page Mexican Spanish embeds

The former Codex field queue is retired for mutations. It selected unrelated translation fields and could not review a complete page. The hourly Codex automation is paused. This worker uses OpenRouter from the VPS; it does not call Codex or Wix machine translation.

## Scope and order

`translation-pages.json` is an explicit allowlist for the Susi site and its public routes. The worker starts with the homepage, then city pages, property-type pages, the listings hub and rentals. Each invocation processes **one route**. It reads only that route group's existing Custom Embed packet dictionaries, proposes the complete page's Spanish copy, captures the live English and `?lang=es` views, independently reviews the text and screenshots, corrects flagged phrases once, and holds the page if a second review fails. A packet shared by several routes is released only after every listed route passes. The bridge previews every update, applies it to the same existing all-pages embed and stores its recovery receipt privately. Post-release screenshots are reviewed before proceeding to the next group.

The live Susi site currently returns 404 for `/es/` but renders Spanish embeds at `?lang=es`. The worker uses the latter. It does not alter language visibility, page scope, load-once settings, Editor layout or Wix machine-translation credits.

For listed packets without an existing Spanish dictionary, the worker uses the checked-in Susi phrase bank and a JavaScript parser to wrap rendering writes before building a candidate. It refuses packets without enough matched phrases or safe rendering writes. Page-specific legacy embeds outside the list and dynamic listing-detail routes are deferred; the worker reports this explicitly and does not claim that all embeds or the site are translated. CMS collections are a later phase. The site-specific Git-connected source fallback still needs a separate synchronized production release before the full-site translation is called complete. Follow `docs/GLOBAL_EARLY_REGISTRATION.md` for that release.

## VPS setup

- Clone/pull `weareheadless/wix-site-bridge` to `/home/admin/wix-site-bridge`.
- Keep the approved Susi bridge credentials in `sites/susimacdonald/.wix-bridge-state/app.env` on that VPS, mode `600`. Never commit them.
- Keep the OpenRouter key in `/home/admin/.config/susi-translation/openrouter.env`, mode `600`, with `OPENROUTER_API_KEY=...`. The default translator is `google/gemini-3.1-flash-lite`; independent visual/text reviewer is `google/gemini-3-flash-preview`. These are the two models confirmed available under the installed key's Google-only provider allowlist. The local worker estimates spend from token usage and stops new calls at `OPENROUTER_DAILY_BUDGET_USD` (default USD 5). A provider-side key spending cap gives stronger enforcement.
- Install `deploy/susi-page-translation.service` and `.timer` as user systemd units. The timer runs one route every ten minutes. It stops progressing on any model, quality, render, bridge or read-back failure; inspect the private progress and review files, then fix the cause before resuming.

From the bridge checkout, `bash sites/susimacdonald/scripts/run-page-translation-worker.sh --preview` reports the next route without model or Wix writes. `--apply` processes one reviewed page. Private candidate packets, screenshots, reports, receipts and budget accounting live under `.wix-bridge-state/page-translations/`.

## Recovery and limits

If the worker stops with `releasing` or `post-review-held`, inspect the bridge receipts and their snapshot-based recovery commands before changing `progress.json`. It never widens a snippet's page scope or overwrites a live revision that changed after candidate creation. The page images are reviewed to catch blank/broken layouts and awkward visible Spanish, but the screenshot is one desktop viewport; a later full responsive QA pass remains necessary. The worker does not translate CMS records or native Wix text.
