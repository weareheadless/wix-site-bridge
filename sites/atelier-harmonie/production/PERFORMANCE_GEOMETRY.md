# Atelier performance recovery — 20 October 2026

The owner confirmed performance was **back to normal** after the v53 geometry
release was published. This is owner-reported recovery; no new numeric scores
or independently measured post-release Lighthouse results were supplied.
Do not present the earlier approximate 70 mobile / 90 desktop baseline as a
verified post-fix score.

## Diagnosis

The [pre-fix mobile report](https://pagespeed.web.dev/analysis/https-www-atelier-harmonie-com/4sr3wq1waa?form_factor=mobile)
scored 43: FCP 5.3s, LCP 6.0s, CLS 0.594 and only 20ms total blocking time.
The footer contributed 0.583 CLS; the heading/font changes contributed about
0.012. Image/payload optimization and the earlier header correction had not
resolved this remaining layout problem.

With JavaScript disabled in the published mobile layout, the homepage custom
element reserved only 125px and its section 165px. The footer started at y=266.
After rendering, the homepage grew beyond 8,000px. Automatic resizing after
render was already present; the missing protection was geometry **before**
render. A plain tag minimum lost to Wix's saved sizing rule. A scoped minimum
with sufficient CSS priority propagated through the actual wrapper and section:
the host/wrapper became 639px and the footer moved to y=780 in the test viewport.

## Working correction

Release: `atelier-performance-20261020-v53-geometry`.
Canonical implementation in [weareheadless/atelier-harmonie](https://github.com/weareheadless/atelier-harmonie):

- Source commit: `3869d354c83fa3a99b7043d7e8ff5714cb55643e`.
- Verified public release record commit: `3b1184c` (`startup-release.json`).
- Policy: `scripts/page-geometry.mjs`; build/verification: `scripts/build-startup.mjs`
  and `scripts/verify-startup.mjs`; operational guidance: `STARTUP.md`.

Both synchronized Head controllers emit static geometry CSS before their
registration script. Full-page owned tags reserve `100vh`, with `100svh` as the
supported-browser override. Only the minimum uses `!important`, to override
Wix's saved element minimum. This is a floor, not a fixed full-page height.
Matching shadow `:host` minimums preserve ordinary source fallback behavior.
Rules cover both languages and internal navigation, including legal tags
without re-enabling their disabled early packets.

Gift-card, quote and journal introductions reserve 200px rather than a full
viewport, preserving native widgets/forms/feeds in their existing flow.
Secondary components retain natural sizing. Native-only system pages are
untouched. Existing content ResizeObservers remain responsible for real heights.
Lamp categories previously lacked this observer: they now measure their main,
update host height, emit `atelier-layout`, reconnect after rerender and disconnect
on removal. Text, translations, links and existing design CSS were preserved.

## Verification and limits

All 20 page-leading components rendered at 320px with English content in a local
preview; host and wrapper followed content height without added final blank
space. Desktop preview checked compact intro and lamp-category sizing. A preview
catalog grew lamp-category height from 2210px to 3861px and clearing it restored
2210px, emitting layout events.

JavaScript-disabled live mobile tests verified wrapper propagation on home,
lamps, shop, lamp category, shipping and cookies; the quote intro remained
independent of its native form. Blog/gift-card custom tags were absent from
their initial script-disabled HTML, so their initial live placement was not
established by that test. These were geometry checks, not new Lighthouse scores.
The bridge verified 53 entry updates by readback; both controllers match.
The owner subsequently confirmed recovery. No saved Editor layout was published
by the agent; publication remained with the owner.

## Preserve on future releases

Build from the latest connected repository, preserving both the early CSS and
source fallback minimums. Assign every new component an explicit geometry role;
do not give every stacked section a viewport minimum. Keep real content sizing
and test growth **and shrinkage**, fresh loads, internal navigation, both locales
and mobile/desktop. Verify the containing Wix section follows the owned host.
Do not target generated Wix IDs, pin pages to guessed total heights, or restore
old prototype builders. Keep legal packets disabled and native behaviors intact.
Use revision-checked plans, private recovery state and readback receipts. Compare
published PageSpeed results under matching conditions before claiming scores.
