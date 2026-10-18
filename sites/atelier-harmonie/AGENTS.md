# Atelier de l’harmonie

- Exact target: `--site atelier-harmonie`, site ID `376faa89-fe6c-4ae8-8feb-10520e813a89`, manifest `sites/atelier-harmonie/site.manifest.json`.
- Follow the root `AGENTS.md` and `docs/GLOBAL_EARLY_REGISTRATION.md`. The mandatory global startup gate applies before production promotion.
- Preserve the approved new design, Atelier's original logo and copy, handwritten wordmark and Saint-Pierre-en-Port / Normandie signature, white/cream backgrounds, muted rose/blue details, six category illustrations, fixed-height hero slider and compact collection/product carousels. Prefer “tissus”, not “étoffes”.
- The live hidden test route is `/copy-of-accueil`; prototype snippets remain exact-route guarded. Production promotion to `/` and shared navbar replacement are authorized, but must satisfy the startup/placement/behavior gate before publication and removal of legacy content.
- Read `production/PLACEMENT.md` and `production/build-manifest.json` for current staging status. Files being generated does not mean they were installed or published.
- One real custom navbar element belongs in Wix's shared header; one homepage content element goes below. Remove replaced legacy visual children after preserving original navigation destinations, cart, mobile behavior, forms, SEO, and dependencies. Never ship the prototype's hidden duplicate shell or broad document observers as production architecture.
- `weareheadless/atelier-harmonie-headless` is a separate Next.js/Payload project. Do not alter or deploy it for this Wix migration.
- Existing historical receipts/snapshots remain in the root private `.wix-bridge-state/`; preserve their recovery path. New prototype releases explicitly use `sites/atelier-harmonie/.wix-bridge-state/`; local assembly files go in ignored `.build/`. Keep all credentials and state out of Git.
- Run customer scripts from the repository root. Build commands require explicit `--site atelier-harmonie`; release helpers must reject any different alias/site ID. Review dry-runs and receipts.
