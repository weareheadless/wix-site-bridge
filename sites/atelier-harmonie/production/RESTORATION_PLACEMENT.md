# Tapisserie & restauration — placement

Target `--site atelier-harmonie`, `/tapisserie-restauration`. Source repo `weareheadless/atelier-harmonie`, source commit `dbaba03`. Startup release `atelier-production-20261018-v17`.

## Human Editor setup

1. Keep shared header/footer and the **real existing Wix contact form** with its fields, submissions, confirmation message, notifications and consent/spam configuration. Do not delete the native form when removing old body sections.
2. Replace old editorial body sections with one full-width section and real Custom Element. Velo file: `public/custom-elements/atelier-restoration-v1.js`; tag: `atelier-restoration-v1`; requested ID: `customElement10`. Tell the agent if Wix assigns a different ID.
3. Put the retained contact form directly below the new element's contact ending. Remove duplicate old contact text/images already reproduced by the component, preserving actual form behavior.
4. Zero section padding/no restrictive max-width. Start around **4,000 px desktop / 6,000 px mobile** for element AND section, then fit actual content in Preview, including expanded cushion details. Estimates are not verified saved geometry. Component observes its own content height; it cannot resize saved parent Wix section geometry.
5. Native form design: white background, espresso `#42170a` text, thin beige `#e5dace` field outlines, muted rose `#87475b` submit button with white text. Apply through human Editor design controls, preserving labels and focus/error states. No DOM selectors or code overriding Wix internals.
6. Preview desktop/mobile, fresh loads and internal navigation: hero, all original photos/copy, intact before/after, all three service shortcuts, accordion opening/closing, `/devis` links, email/phone and retained form visibility. No form submission performed by the agent.
7. Publish the current saved Editor layout once ready; never publish the checkout’s stale local UI snapshot.

## Redesign

- Mathilde at work is the hero, with original “Votre projet, mon savoir-faire”, subtitle and full introduction.
- Three service choices scroll within the component to seats, lampshades and cushions, with keyboard focus and reduced-motion support.
- Restoration centres the original combined before/after asset (no fake comparison slider); original process text becomes three steps.
- Lampshade section keeps original copy and three project scenarios; original pagode photo retained.
- Cushions section keeps all original text, including materials and meditation content. Déco details open initially; meditation details expand on demand. Native details works without custom script; SEO markup includes full content.
- Contact ending reuses the original stitching photograph and original contact details. No replacement form, parallel submission backend or third-party CRM.
- Original distinct photographs reused once (the original page duplicated the zafu image); widths/heights reserve representative aspect ratios, no fixed frame cropping. Human still owns actual container geometry.
- Static text renders immediately; route-specific hero preload matches visible URL. Shared header/footer and source fallback preserved. Startup controllers/packets synchronized, within size limits.
- Placement, final saved geometry, publication and live content/interaction verification remain pending human setup. No speed scores claimed.
- Private receipts/snapshots under customer state directory. Recovery restores prior startup HTML or disables the affected entries, synchronizing normal Wix sources and packets.

## Integrated contact form — prepared, NOT activated

Human authorized custom fields mapped to Wix. Source `497026d` (component prepared in `ce12951`), startup `atelier-production-20261018-v18`.

Compatibility check: existing generated Wix CLI types expose the original contact form as legacy `$w.Form` (`#form2`), with separate TextInput/TextBox controls. Official Wix docs say old forms only work with old APIs; the programmatic `setFieldValues` / `submit` flow is `WixFormsV2`. Do not invoke undocumented legacy submission endpoints or click internal submit buttons.

Required human step (Editor workflow): add a NEW Wix Form with **Nom, Email, Objet, Message**, leave the old form temporarily, and provide its element ID. Confirm exact field keys using the new form's Advanced settings; do not infer keys from labels. Existing old form history remains untouched. New form notifications/automations must be configured to match intended recipients; they are not automatically inherited or claimed verified.

Prepared source:
- Custom fields live inside `atelier-restoration-v1` and remain hidden until `contact-state` reports a correctly configured new native adapter.
- `public/atelier-restoration-form-config.js` is intentionally `enabled:false`, `elementId:null`, null field mappings. It must remain inactive until exact mapping is confirmed.
- Page binding copies only bounded name/email/subject/message values to exact configured keys and calls documented native `form.submit()`. No direct CMS insert, arbitrary backend form ID, private endpoints or replacement CRM.
- Wix validates and performs the submission. Thank-you shown only on native successful completion; failure preserves custom draft and expands/scrolls to the native form so any validation/challenge can be completed. No personal values logged or stored in browser storage.
- `collapseNative:false` initially retains native widget for setup. Enable collapse only after confirming successful submission/notification behavior; failure always re-expands it. Do not remove the new native adapter widget. Remove old legacy visual form only after migration is confirmed.
- No real enquiry, test email or form submission has been sent. Native schema/field mapping, notification configuration and end-to-end verification remain outstanding. Agent must not claim this integration is active.

Official references:
- https://dev.wix.com/docs/velo/velo-only-apis/$w/wix-forms/migrate-from-wix-forms
- https://dev.wix.com/docs/velo/velo-only-apis/$w/wix-forms-v2/set-field-values
- https://dev.wix.com/docs/velo/velo-only-apis/$w/wix-forms-v2/submit
