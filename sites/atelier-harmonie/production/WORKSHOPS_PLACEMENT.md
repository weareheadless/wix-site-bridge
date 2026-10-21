# Les ateliers landing page

> Current sizing/startup policy: [PERFORMANCE_GEOMETRY.md](PERFORMANCE_GEOMETRY.md). Use synchronized early packets/controllers plus automatic content sizing. Do not manually recreate a Wix-native hero or fix page heights to old estimates as a performance workaround. Retain the native forms, feeds and commerce widgets required below. Verify the containing section follows the component; Editor intervention is needed only if an actual constraint is found. Release/preload statements below describe historical placement work; use the latest connected builder and release record for current assignments.

Selected site `--site atelier-harmonie`, exact route `/les-ateliers` selected by human. Published page identity `ntpl0` observed in public page markup; dedicated page source `src/pages/Les Ateliers.ntpl0.js`. Connected repo `weareheadless/atelier-harmonie`, commit `688ea46`; startup `atelier-production-20261018-v27`.

## Human placement

- On Les Ateliers, use the fresh full-width Custom Element already placed (or add one in a full-width section).
- Velo file `public/custom-elements/atelier-workshops-v1.js`; tag `atelier-workshops-v1`; requested ID `customElement14`. Tell the agent if the default ID differs.
- Keep shared header/footer. Zero section padding/no restrictive maximum width.
- Preview desktop/mobile, workshop tab navigation/keyboard, exact Wecandoo destinations, FAQ, contact links and shared navigation. Publish the current saved Wix layout; never CLI-publish stale UI state.

## Content and booking

Landing page reuses article photographs and workshop descriptions. Three accessible tabs: Abat-jour / Chaise en crin / Chaise vintage, first active initially. Native FAQ details keeps practical information compact. Headline/intro adapted to landing page rather than dated blog announcement; use “tissus”. No invented prices, availability or durations.

Exact external booking links recovered from article's embedded public booking panel, not guessed:
- Abat-jour: https://booking.wecandoo.com/artisans/f575ba96-d7dc-4392-aabf-15f8b69b40f0/workshops/a62fb0f8-76ed-4681-abb1-7f2f9ea97c33/book
- Crin: https://booking.wecandoo.com/artisans/f575ba96-d7dc-4392-aabf-15f8b69b40f0/workshops/7bad7e3b-5a93-4743-915d-13953fdc4e89/book
- Vintage: https://booking.wecandoo.com/artisans/f575ba96-d7dc-4392-aabf-15f8b69b40f0/workshops/9c8a7e49-2f96-477d-8c5f-db90206bef5d/book
- All workshops: https://wecandoo.fr/artisan/le-havre-tapissiere-mathilde#associated-workshops

Booking links open labelled new tabs; Wecandoo owns current dates/prices/checkout, no parallel reservation database or Wix booking system added. Existing blog article stays intact.

Desktop/mobile navbar Les ateliers and homepage workshop links now point to `/les-ateliers`. Prototype builder aligned for future builds; existing hidden prototype snippets not redeployed. The separate promotional bar still belongs to its existing implementation; not modified by this release.

## Release evidence / limits

Component and matching packets built; navbar/home source + SEO synchronized. Route-specific first hero preload matches visible URL; only workshop definitions execute for this route, shared header/footer preserved; ordinary source fallback retained. Startup installed through documented bridge; receipt mapping stored privately.

Local IAB desktop preview visually inspected, all four rendered images loaded at natural dimensions, screenshot `outputs/workshops-preview.png`. This is local evidence, not proof of live placement/publication, mobile behavior or external booking completion. No purchases/reservations submitted. Full live desktop/mobile, fresh/internal-navigation verification remains after human publication.

Recovery uses private before-snapshots/receipts in customer state directory, restoring previous startup HTML or disabling appropriate entries with source fallback kept synchronized.

## Page metadata

Source `2d90370` adds title, description, Open Graph and Twitter sharing tags through documented `wix-seo-frontend` in page onReady. No component source changes, so startup packets unchanged. Canonical/robots/indexing controls and existing structured data left intact. Human publishes saved current Editor layout; live rendered metadata verification pending publication.
