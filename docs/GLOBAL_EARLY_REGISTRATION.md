# Required production startup architecture

Read before promoting the Atelier prototype or adding/releasing any page.

## Source inspected

Read-only inspection of `/home/admin/susimacdonald-rentals` on the authorized VPS, 18 October 2026, commit `fe66d01a66082b33236b0c8fe8bc65038e113534`:

- `AGENTS.md`
- `docs/GLOBAL_EARLY_REGISTRATION_2026-10-16.md`
- `docs/PERFORMANCE_LISTING_HOME_UNITS_2026-10-16.md`
- `wix/custom-code/early-elements-global.html`
- `scripts/build-early-packets.mjs`

That repository is a reference, not an Atelier deployment target. Never copy its routes, tags, images, analytics, credentials, or site identity into Atelier.

## Mandatory global registration contract

1. Maintain one canonical Head controller source. Install it as Essential Custom Code in two synchronized entries: all pages / load once for initial document startup, and all pages / load on each new page for Wix internal navigation. Use explicit site manifests and supported setup; never pretend the bridge can change read-only placement/page scope.
2. Maintain an explicit route-to-component registry covering **every production page**, including dynamic route families, and the shared header on every route where it belongs. An intentionally native-only route must be recorded as such, with no irrelevant page bundle executed. Coverage is mandatory; do not duplicate controllers per page.
3. Build self-contained inline compressed packets from canonical component sources. Register only matching definitions, guard every `customElements.define` with `customElements.get`, and deduplicate concurrent registration. Preserve the ordinary Wix custom-element source as fallback if decompression or registration fails. Keep packet entries load-once and below 15,000 characters each, matching the reference build guard.
4. Update the corresponding packet **and** Wix component source together whenever a component changes. Update both controller entries whenever controller logic changes. Record source fingerprints, release, route, actual registered tags, and deployment assignments so stale early code cannot override newer source.
5. No private GitHub/CDN loading, credentials in public loaders, `eval`, or new CMS queries. Only matching packets decompress/execute; inspect and minimize globally transferred packet bytes as coverage expands.
6. Discover/preload only the first critical image using the **same responsive URLs, sizes, and crop as the visible hero**. Use high fetch priority; do not preload the entire slider. Dynamic image discovery must use existing page metadata/data with a bounded, scoped observer if needed. Lazy-start below-fold images and review widgets near their viewport without withholding essential text/links.
7. Use global Custom Code for early registration and justified nonvisual startup behavior. Visible production UI belongs in actual Wix custom elements placed in the appropriate shared header or page sections. Do not promote the prototype's delayed root replacement, hidden duplicate header/footer, broad persistent document observers, or generated-selector layout overrides as production architecture.
8. Before releasing each page, inspect the published content on desktop/mobile and fresh document startup **plus internal navigation** to/from the page. Confirm actual component content, all sections, hero image, menu/cart and other changed interactions, original copy/links/SEO, and CMS behavior. Registration markers prove definition only, not visibility, LCP, or successful data loading. Missing or empty elements are release failures.
9. Preserve a central disable switch and a per-document control such as `?earlyElements=off`. Rollback must leave the supported Wix source loader functional; disable packet entries as well when removing their transfer cost. Store rollback evidence privately.

## Evidence limits

Atelier's 20 October 2026 recovery is documented in
[PERFORMANCE_GEOMETRY.md](../sites/atelier-harmonie/production/PERFORMANCE_GEOMETRY.md).
Its key lesson is to verify **pre-render** host and containing-section geometry:
post-render automatic resizing alone can still expose and then displace a footer.
Recovery was confirmed by the owner; no new numeric Lighthouse score was recorded.

The reference demonstrates working registration and some layout fixes, not a universal speed improvement. Its homepage mobile score did not improve; a successful Beachfront pilot does not establish results for all routes. Do not claim faster LCP or scores from registration timings or another site's measurements. Follow the user's verification instructions; run performance audits only when requested, comparing identical published routes/device conditions and recording all repeats.

## Clean Atelier structure

Use the existing Wix shared **header container** as the placement boundary for one custom navigation element. This is a container, not a reason to keep the old menu/logo children rendered or CSS-hidden. Preserve functional shop/cart/mobile behavior, then remove the replaced visual children through supported Wix setup. Keep recoverable source/snapshots rather than duplicate live layers. Header exceptions and checkout/system-page limitations must be inventoried before site-wide rollout.

The homepage body should contain properly placed independent section elements. Retire the prototype injection snippets and CSS shell overrides after replacement placement/content is confirmed. Keep source sections and Wix runtime/store data separate; do not introduce a parallel catalog store.

## Atelier implementation status

Canonical sources and matching startup controllers/packets now exist under `sites/atelier-harmonie/production/`. Release `atelier-production-20261018-v2` installs shared navbar/footer registration on all pages and homepage registration on `/` and `/copy-of-accueil`, with ordinary Wix source fallback. The human reported three real custom-element placements (`customElement1`, `customElement2`, `customElement3`). Source is pushed to the site-specific Wix-connected repository. This is not proof of complete rollout: full route exceptions, saved desktop/mobile container geometry, form preservation, and fresh-load/internal-navigation content inspection remain required before homepage promotion. See customer `production/PLACEMENT.md` and `deployment-record.json`.
