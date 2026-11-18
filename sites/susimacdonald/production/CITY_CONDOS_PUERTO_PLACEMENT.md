# Puerto Morelos condos — placing the page element

The page is a Wix **Custom Element**, the same mechanism as every other city
page. The early packets and the page code are already in the connected
repository. This is the one editor action Wix exposes no API for.

## What to place

1. Open the page **Condos For Sale In Puerto Morelos** (`/puerto-morelos-condos-sale`)
   in the Wix Editor.
2. Add a full-width section at the top of the page body, below the header.
   Remove its padding and set its background to `#171714`. Name it clearly;
   note its ID if it is not `#section1`.
3. **Add Elements → Embed → Popular Embeds → Custom Element.**
4. Set:
   - tag name: `city-condos-puerto`
   - element ID: `customElement1`
   - width: 100% of the section, no side margins
   - initial height: 7600 px (the page code corrects it from the element's
     `section-resize` event)
5. Delete the old 2024 article sections. They are not used by the element.
6. Save and publish from the editor.

## What is already live

- HEAD early packets: `CrawlSEO early packet — city-condos-puerto — en|es`
  (two chunks per locale), register the element before Wix's loader.
- BODY_END fallback: `CrawlSEO page mount — city-condos-puerto` mounts the
  element as a sibling of `#PAGES_CONTAINER` while the editor element is
  missing. It can be disabled once the editor element renders.
- Page code: `src/pages/Condos For Sale In Puerto Morelos.qu5lr.js` relays the
  height to `#customElement1`.
- Page title and description: written through the SEO API.

## Why it matters

An editor-placed element is in the page's server HTML, so the packet upgrades it
in place. There is no create-after-paint and no second mount, which is what
removes the last visible reload on this page.

## Verify

1. Fresh load: `<city-condos-puerto>` is in the raw HTML, not only after JS.
2. One element, one `<h1>`, no reload between the header and the content.
3. The section grows to the element height; nothing is clipped at 1440 px or
   390 px.
4. Disable the BODY_END mount and repeat; the page must still render.
