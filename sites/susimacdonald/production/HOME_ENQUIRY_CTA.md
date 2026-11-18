# Homepage enquiry CTA — element, not the HTML embed

The homepage CTA ("Let's find your place in the Riviera Maya" → Tailored List)
is now a custom element registered with the other home elements. The HTML embed
it replaces is still in the page until the human swaps it.

## Why the embed was 3.5 s late

The CTA was a Wix HTML embed, which renders as an `<iframe>` loaded from
`www-susimacdonald-com.filesusr.com`. Measured on a fresh mobile load:

| | mobile | desktop |
| --- | --- | --- |
| FCP | 2.9 s | — |
| the four home custom elements defined | 2.30 s | 2.30 s |
| those elements painted | 2.76 s | 2.76 s |
| **the CTA iframe created by Wix** | **5.99 s** | **6.42 s** |
| its own document loaded | 6.04 s | 6.49 s |

No packet can fix that: the iframe is not in the served HTML, so there is
nothing to register; Wix creates it after bootstrap, and it then fetches a
second document with its own CSS and image. The fix is the same lane the other
home elements already use.

## What is live

| Thing | Value |
| --- | --- |
| tag | `home-enquiry-v1` |
| source | `susimacdonald-wix/src/public/custom-elements/home-enquiry-v1.js` |
| Wix element id | `homeEnquiry` once set in the editor; currently the default `comp-mwmm10oi`, which the page code also binds |
| packet | `Susi early packet — Homepage: About + Testimonials` (`11fe7ffd-…`), homepage-scoped (`h4hzq`), already carried by the shared controller's `/` keys |
| page code | `src/pages/Home.h4hzq.js` — binds `#homeEnquiry`, else the default `#comp-mwmm10oi` |
| opens | `#section1` → `#form22`, Tailored List form `456726ce-f0ed-4172-82b0-2b43b9883e4a` |

There is no page-scoped packet for `/`: `create-snippet` needs a non-root route,
so the element is added to the shared controller's route map
(`['home-property-slider','home-featured-properties-v2','home-about-v1','home-reviews-v1','home-enquiry-v1']`).

Registration is verified live: release `20261118-home-enquiry-v1`,
`customElements.get('home-enquiry-v1')` true, `data-home-enquiry-v1="defined"`
at 2.4 s, next to the other four.

## The form contract

A light-DOM element cannot `postMessage` to Velo. The element dispatches DOM
`CustomEvent`s and the page code listens on the element:

- `home-enquiry` with `detail.open` — the button toggles it, and the page code
  expands (`#section1`) and scrolls to the Tailored List form, or collapses it;
- `home-enquiry-resize` with `detail.height` — the element reports its height
  after paint, one frame later, and at 1.5 s, because Velo's page code binds
  after the element upgrades; the page code sets `homeEnquiry.height`.

The old `#html3` `postMessage` branch is still in `Home.h4hzq.js` for the
transition. Delete it with the embed.

## Remaining: the editor swap (human)

1. In the homepage enquiry section, replace the `#html3` HTML embed with
   **Add Elements → Embed → Popular Embeds → Custom Element**, tag name
   `home-enquiry-v1`.
2. Set the element id to `homeEnquiry` (until then the page code binds the
   default id `comp-mwmm10oi`), and size the element and its section for desktop
   and mobile (the element is 332 px tall at 1440 px wide).
3. Delete the `#html3` embed and the transition branch in `Home.h4hzq.js`.
4. Publish in the editor. Page code from the connected repo does not reach the
   live site on `git push` or on the bridge's `publish-site`: the editor's
   publish is what deploys it. A code fix that "did nothing" is usually this.

After placement, verify: one `<home-enquiry-v1>` in the served HTML inside
`#SITE_PAGES`, the section at least as tall as the element, the button expanding
and scrolling to `#form22`, both locales, and no layout shift where the iframe
used to load.
