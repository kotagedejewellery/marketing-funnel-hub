---
name: Kotagede Jewellery Link Bio and Admin CMS
description: Shared boutique visual language for the public Link Bio and CMS.
colors:
  canvas-ivory: "#f7f2e9"
  card-ivory: "#fffdf9"
  ink-charcoal: "#28211c"
  dark-cocoa: "#352720"
  on-dark-cream: "#fffaf1"
  on-dark-muted: "#f0e7db"
  bronze: "#845422"
  bronze-soft: "#f3dfb9"
  secondary-sand: "#eee5d8"
  muted-ink: "#675c51"
  border-sand: "#ded2c1"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.75
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
rounded:
  media: "0.75rem"
  card: "1rem"
  pill: "9999px"
components:
  whatsapp-action:
    backgroundColor: "{colors.ink-charcoal}"
    textColor: "{colors.on-dark-cream}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1.25rem"
  hero-action:
    backgroundColor: "{colors.bronze-soft}"
    textColor: "{colors.dark-cocoa}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
  surface-card:
    backgroundColor: "{colors.card-ivory}"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  featured-card:
    backgroundColor: "{colors.bronze-soft}"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
  dark-summary:
    backgroundColor: "{colors.dark-cocoa}"
    textColor: "{colors.on-dark-cream}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
---

# Design System: Kotagede Jewellery Link Bio and Admin CMS

## Overview

**Creative North Star: "Boutique Choice Board / Working Studio"**

The public Link Bio is a compact boutique choice board; the CMS is a clear working studio. Both use the owner-approved Playful SaaS direction through warm ivory, charcoal, and bronze, expressive headings, calm fields of color, and rounded modular panels. The public surface keeps products and direct branch WhatsApp actions prominent; the admin surface prioritizes scannable content state and editing routes.

**Key Characteristics:**

- Shared warm palette across public and admin surfaces.
- Unequal bento panels, softly rounded cards, and pill-shaped actions.
- Product and campaign imagery appears only when an asset is available.
- State motion is light, with reduced-motion fallbacks.

## Colors

Charcoal anchors the hierarchy, warm ivory keeps the canvas quiet, and bronze marks emphasis and focus. The same scoped colors are defined for `.kgj-public` and `.kgj-admin` in `src/app/globals.css`.

### Primary

- **Ink Charcoal** (`colors.ink-charcoal`): main text and primary WhatsApp action.
- **Dark Cocoa** (`colors.dark-cocoa`): brand hero, admin rail, and dark summary tile.
- **Bronze** (`colors.bronze`): focus outline, hover emphasis, and action text.
- **Soft Bronze** (`colors.bronze-soft`): featured product, campaign/quick-access panels, and light hero action.

### Neutral

- **Canvas Ivory** (`colors.canvas-ivory`): page background.
- **Card Ivory** (`colors.card-ivory`): standard cards, campaign panel, account panel, and secondary links.
- **Secondary Sand** (`colors.secondary-sand`): muted supporting surface, including image fallback ground.
- **Muted Ink** (`colors.muted-ink`): supporting text.
- **Border Sand** (`colors.border-sand`): quiet dividers in product branches, activity, and footer.
- **On-Dark Cream / Muted** (`colors.on-dark-cream`, `colors.on-dark-muted`): type on dark panels.

## Typography

**Display and heading font:** Bricolage Grotesque, provided by `next/font/google`; **body and label font:** Manrope. Both fall back to the system sans stack. The pairing makes short headings expressive while operational labels and longer text stay plain to scan.

- **Display** (`typography.display`): balanced hero headline with the observed fluid size, tight leading, and negative tracking.
- **Headline** (`typography.headline`): section and dashboard headings; responsive headings enlarge at the `sm` breakpoint.
- **Title** (`typography.title`): product, campaign, and panel headings.
- **Body** (`typography.body`): introduction, descriptions, and explanatory text; muted when subordinate.
- **Label** (`typography.label`): actions and card labels; bold without all-caps styling.

## Layout

The public page is mobile-first within a centered `max-w-6xl` container. It uses 1rem side padding, increasing at `sm` and `lg`. Hero and campaign panels become two-column compositions at `md` when their asset exists; product cards become a two-column grid, with the first product spanning both columns. Branch choices expand in place inside the product card.

The admin shell is desktop-oriented: a narrow floating icon rail appears at `lg` beside full-width content, spans the viewport from top to bottom, and uses centered concave cuts instead of capsule ends. There is no persistent desktop header card, and account access sits at the foot of the rail. Its dashboard uses an unequal six-column summary grid at `md`, then an activity/quick-access split at `xl`. On smaller screens, a slim brand/account bar stays above a horizontal icon rail in normal flow and cards stack. Observed card gaps are 1rem, rising to 1.25rem in the public product grid at `sm`.

## Elevation & Depth

Most surfaces are flat and distinguished by color or a thin border. The public header action has a small diffuse shadow; the floating admin rail has a deeper diffuse shadow. Action links and summary tiles lift slightly on hover. These are accents to the otherwise flat card system, not a universal card shadow.

## Shapes

Cards and large panels have soft 1rem corners (`rounded.card`); product image wells use 0.75rem (`rounded.media`). Primary actions use full pill ends (`rounded.pill`). On desktop the admin navigation rail has straight vertical sides with centered concave cuts at the viewport edges; its active icon sits in a self-contained ivory rounded square without extending outside the rail. Thin sand-colored borders separate branch rows, activity rows, quick links, and the footer. Public image panels clip to their card silhouette.

## Components

### Actions

- **Primary WhatsApp:** a normal, final `wa.me` anchor inside each eligible branch row; charcoal fill, cream text, bold Manrope, 3rem minimum height, and pill corners. Hover lifts by 0.125rem; keyboard focus receives an offset outline. Reduced-motion removes the transition.
- **Hero action:** soft-bronze pill on the dark hero, with the same restrained lift and a matching visible focus outline.
- **Secondary links:** full-width ivory cards with bold labels; the background becomes soft bronze on hover.

### Cards and containers

- **Product cards:** standard ivory, except the first card in the list, which uses soft bronze and spans the desktop grid. If an image exists, it occupies a clipped 4:3 well; otherwise the text layout remains usable.
- **Admin summary tiles:** dark cocoa for site identity, soft bronze for campaign state, ivory for active product and branch counts. All remain direct navigation links and lift on hover.
- **Recent changes and quick access:** separate ivory and soft-bronze panels, with border-separated rows rather than floating subcards.

### Navigation and disclosure

The public header stays compact and exposes a product jump link only when products are present. Product branches use native `details`/`summary` disclosure with a rotating chevron and visible focus treatment. The admin rail follows the owner-provided narrow dark reference: inset from the left edge, full viewport height on desktop, icon-only, and finished with concave cuts at the top and bottom. The active destination is an ivory rounded square contained fully inside the rail, while hover/focus tooltips reveal labels. An account icon at the rail foot opens a small panel showing the signed-in name, role, and sign-out action, separate from navigation links. On smaller screens, the rail scrolls horizontally below a slim bar with visible account access.

### Admin forms

Create and edit forms open in a native modal dialog from their list or summary. The dialog has a visible title, close control, keyboard Escape behavior, and scrollable content; validation remains on the form and server. A successful save closes the dialog and shows a brief toast; a failed save shows a dismissible toast while keeping the dialog and its inputs open.

## Do's and Don'ts

### Do:

- **Do** reuse the shared ivory, charcoal, and bronze roles across public and admin surfaces.
- **Do** keep product imagery conditional and retain useful text when it is absent.
- **Do** keep WhatsApp actions visibly primary and directly navigable.
- **Do** retain visible focus and reduced-motion treatments on interactive elements.

### Don't:

- **Don't** add a competing generic SaaS accent color or decorative treatment that outranks product choice.
- **Don't** turn the public surface into a multi-step funnel before WhatsApp.
- **Don't** imply every card is elevated; most observed panels are flat.
