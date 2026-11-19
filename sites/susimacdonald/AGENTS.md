# Susi Macdonald — site notes

Site `susimacdonald` · site id `878460ca-c98c-402b-8a10-862023f67cce` ·
`https://www.susimacdonald.com` · connected repo `/home/admin/susimacdonald-wix`
(`weareheadless/susimacdonald-wix`).

**The deployment process is `DEPLOYMENT.md` in this folder. It is the only
process.** The general contract for any CrawlSEO site is
`/home/admin/wix-site-bridge/docs/PAGE_DELIVERY.md`. Content, CMS and translation
rules are in `CONTENT_AND_DATA.md`. If a note anywhere contradicts
`DEPLOYMENT.md` for a page delivery, `DEPLOYMENT.md` wins.

## The split, fixed

- **The human** creates the Wix page if it does not exist, places the Custom
  Element on it with the tag name, and reports the Wix element id (`comp-…`) and
  section id. Nothing else.
- **The agent** does everything else: component source and its build, every
  Custom Code / Custom Embed entry, the page's SEO title and description, the
  commit and push, the deploy, the publish, the live verification and the
  performance gates.

A delivery is never handed back for a packet, an embed, a code paste, a publish
or a measurement. If a step would need the Wix editor's code panel, it is not
part of a delivery: make the element do it in its own source.

## Two facts that decide most failures

- **The element sizes its own slot.** Wix gives the placed element a flex slot
  holding the editor-saved height, and `min-height:auto` keeps the element at
  that height. The element therefore sets `align-self:flex-start`,
  `height:auto`, `min-height:0 !important` inline, and writes its measured
  content height onto the slot. Do not close that gap from Velo page code: the
  `section-resize` relay binds but never fires on this site.
- **Speed parity is a gate.** A page slower than its closest delivered sibling
  is missing its HEAD packets: the element then waits for Wix's code bundle
  (~3.2 s instead of ~1.9 s, measured on the Playa type pages). Create the
  packets and deploy; do not investigate the framework.

## Pages delivered as one placed element

The registry (tag, route, content file, Wix element and section ids, deploy
command) is the table in `DEPLOYMENT.md`.
