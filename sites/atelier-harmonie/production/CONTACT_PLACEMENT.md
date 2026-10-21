# Standalone contact introduction

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Target `--site atelier-harmonie`, `/tapisserie-restauration`. Source `weareheadless/atelier-harmonie` commit `4dfcbc8`; startup `atelier-production-20261018-v20`.

Place one full-width Custom Element in a separate section directly above the native Wix form:
- Velo file `public/custom-elements/atelier-contact-v1.js`
- Tag `atelier-contact-v1`
- Requested ID `customElement11`

Zero outer section padding and no restrictive maximum width. Keep the native form below, with cream `#faf6ee` section background if desired. Remove only duplicated native contact heading/photo/email/phone, preserving real form inputs, submit, success/error messages and bindings.

Component is presentational: original stitching photograph, contact heading, email/phone links and invitation to use the form below. No fields, form adapter, backend submission logic or dependencies on the main restoration embed. Shared header/footer remain separate. Hero preload stays on the main restoration image; contact photograph is lazy loaded.

Human handles placement, saved sizing and current-layout publication. Preview desktop/mobile, contact links, native form visibility and fresh/internal navigation before publication. No form submissions sent or tests run; live placement/behavior pending human setup. Never CLI-publish stale UI snapshot. Other routes require explicit startup coverage before reuse in production.

Startup receipts and before-snapshots remain private under customer state directory. Restore prior HTML or disable matching startup entries for recovery, keeping source fallback synchronized.
