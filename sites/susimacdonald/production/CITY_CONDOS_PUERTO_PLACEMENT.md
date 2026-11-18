# Puerto Morelos condos — page element placement (done)

The page is a Wix **Custom Element** placed in the page, the same mechanism as
every other city page. It is live. This file records what was placed and the
mistake that made the placement look ineffective.

## What is on the page

| Thing | Value |
| --- | --- |
| Wix element id (wrapper) | `comp-mwmg963v` |
| Wix section id | `comp-mwmb8lz3` |
| Tag name | `city-condos-puerto` |
| Page | `/puerto-morelos-condos-sale`, `/es/puerto-morelos-condos-sale` (page id `qu5lr`) |

The element sits inside `#SITE_PAGES > … > section#comp-mwmb8lz3 >
div#comp-mwmg963v`, so it is part of the delivered HTML. Its hero image is the
LCP element and the section holds the page height while the element upgrades.

## What is live

- Four HEAD packet chunks (`CrawlSEO early packet — city-condos-puerto — en|es`,
  two per locale), page-scoped to `qu5lr`, `loadOnce=false`, route-guarded. They
  register the element and emit `<link rel=preload>` for the hero. They do not
  hide the page, paint a placeholder or set a height.
- Page code `src/pages/Condos For Sale In Puerto Morelos.qu5lr.js`, binding
  `#comp-mwmg963v` and relaying `section-resize`.
- Page title and description through the SEO API (English); the Spanish ones are
  the editor's.

## The retired mount

`CrawlSEO page mount — city-condos-puerto` (`a7d40ed1-…`) is **disabled**.

It has to stay disabled. While it was live it ran
`document.querySelector('city-condos-puerto')` and then inserted that node as a
sibling of `#PAGES_CONTAINER`, i.e. it moved the placed element out of
`comp-mwmb8lz3`, while the packet kept `#SITE_PAGES` at `display:none`. The page
looked the same, so the placement appeared to change nothing: the page was still
a runtime mount, with the visible reload and CLS 0.709 that come with it.

## Verified after the fix

- Served HTML: one `<city-condos-puerto>`, the hero preload, no mount script, no
  `cc-pm-` style.
- Rendered: one element inside `#SITE_PAGES`, 10,559 px tall at 412 px wide with
  10,570 px reserved by its section, footer below it, one `<h1>`.
- CLS 0 in repeated runs (was 0.709).
- First-load images 91 KiB (was 2,363 KiB); page transfer 2,782 KiB (PSI had
  4,961 KiB and an "improve image delivery" saving of 1,920 KiB).
- Desktop and `/es/` checked on a fresh load.

## If this page is ever rebuilt

Place the element and size the element **and its section** for desktop and
mobile before measuring. Do not add a BODY_END mount. The sequence and the
gates are in the site's `AGENTS.md` and `DEPLOYMENT.md`; the contract is
`wix-site-bridge/docs/PAGE_DELIVERY.md`.
