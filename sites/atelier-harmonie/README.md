# Atelier de l’harmonie

Current production performance/startup guidance: [PERFORMANCE_GEOMETRY.md](production/PERFORMANCE_GEOMETRY.md) and [GLOBAL_EARLY_REGISTRATION.md](../../docs/GLOBAL_EARLY_REGISTRATION.md). Use the latest Wix-connected source and synchronized packets/controllers.

## Historical homepage prototype — retired deployment approach

The material below is design history only. Do not deploy its root injection, header/footer hiding, remount observers or prototype snippets to production. The production site uses placed custom elements with early registration and automatic sizing.

Target: `atelier-harmonie`, exact route `/copy-of-accueil`. The original homepage is not the deployment target. The page is hidden from the Wix menu and remains public by direct URL.

## Visual specification

Use https://fabuleuse-factory.com/ as inspiration for restrained serif headings, photographic storytelling, compact collection and product carousels, cream split panels, reviews, artisan story, commitments, photo row, and cream footer. Adapt the content to Atelier’s seat restoration, custom lighting, and workshops. The current luxury trial uses a three-slide editorial hero pairing a cream text area with lighting, restoration, and atelier photographs, without an overlaid caption box; previous/next buttons and keyboard arrows switch slides without automatic rotation. It has one primary shop link, larger serif headings, wider section spacing, and three larger carousel cards per desktop view. Three photographic service pathways introduce Atelier’s actual offerings. Use Atelier photographs, real product destinations, and Atelier copy. Interface backgrounds stay white and warm cream, with espresso text; do not introduce green, orange, or purple interface backgrounds.

The reference was inspected in the in-app browser on 17 October 2026. Product names, displayed prices, and image destinations are a presentation snapshot from Atelier’s public Wix shop on that date. This is not a product database or an inventory integration. Product details, availability, checkout, contact forms, and runtime CMS data remain in Wix. Refresh displayed prices before promoting this prototype.

## Independent stack

| Order | Mount | Source |
| --- | --- | --- |
| 5 | navbar | prototype/00-navbar.html |
| 10 | hero | prototype/01-hero.html |
| 15 | introduction | prototype/01b-introduction.html |
| 18 | categories | prototype/01c-categories.html |
| 20 | savoir-faire | prototype/02-savoir-faire.html |
| 23 | collections | prototype/02b-collections.html |
| 25 | sur-mesure | prototype/02c-sur-mesure.html |
| 30 | boutique | prototype/03-boutique.html |
| 35 | inspiration | prototype/03b-inspiration.html |
| 37 | avis | prototype/03c-avis.html |
| 40 | atelier | prototype/04-atelier.html |
| 45 | engagements | prototype/04b-engagements.html |
| 47 | instagram | prototype/04c-instagram.html |
| 50 | contact | prototype/05-contact.html |

Every fragment includes its own scoped CSS and any interaction code it needs. Neither carousel depends on another fragment. The social row uses curated Atelier photographs linked to Instagram; it is not a live Instagram feed. Reviews reuse the existing public SociableKIT widget instead of storing or inventing testimonials.

## One-time Wix UI setup

The original homepage was duplicated as **ACCUEIL — PROTOTYPE**, with `/copy-of-accueil` as its URL, and hidden from the menu. Its copied native body sections were removed through the visible Wix Editor. Wix prevents deleting the final section, so that section is empty. The page was saved and published. These are UI setup steps, not Custom Embeds API operations.

The navbar is an independent embed at mount order 5, immediately before the hero at order 10. On the exact prototype route, its presence hides the native Wix header and promotion bar and collapses their grid rows; it stays in normal document flow rather than overlaying the hero. It includes desktop links and a native expandable mobile menu. The original header remains on every other route. Prototype-only CSS also hides the native footer because the custom footer supplies the page’s legal and contact links. Embed API positions and page scopes are unchanged; each embed uses the exact route guard.

Applied-operation receipts and snapshots are private local recovery artifacts in `.wix-bridge-state` and must not be committed. Review every receipt and manifest mount mapping after an apply.

The six line-drawn category links are an independent `categories` embed at order 18. The hero slider is manual, supports arrow keys while its controls are focused, and announces its slide count. The bridge retains a route-checked observer to remount sections if Wix replaces the page container during hydration; fragments are cloned for repeat mounts.

The hero uses a fixed 680px desktop slide height and a 500px copy / 420px photo mobile layout, so changing slides or loading images cannot resize the surrounding page. Photos fill their reserved frame with object-fit cover. Muted rose (#87475b / #b9808e) and dusty blue (#647b92 / #8296aa) are small accents on navigation, labels, controls, and line art; white and cream remain the section backgrounds.

## Copy sources

Prototype copy now reuses headings and excerpts from Atelier’s public homepage, `/tapisserie-restauration`, and `/shop`, read on 18 October 2026. The hero restores “Tapissière de siège et abat-jouriste”; service, project, boutique, reviews, and founder sections reuse the original voice. Long passages are excerpted, punctuation is normalized, and the DIY description is shortened without the dated booking announcement. “Tissus” remains the preferred term.
