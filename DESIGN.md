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
- Branch gallery imagery is independent from product WhatsApp actions.
- State motion is light, with reduced-motion fallbacks.

## Colors

Charcoal anchors the hierarchy, warm ivory keeps the canvas quiet, and bronze marks emphasis and focus. The same scoped colors are defined for `.kgj-public` and `.kgj-admin` in `src/app/globals.css`.

### Primary

- **Ink Charcoal** (`colors.ink-charcoal`): main text and primary WhatsApp action.
- **Dark Cocoa** (`colors.dark-cocoa`): product CTA blocks, admin rail, and dark summary tile.
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

- **Display** (`typography.display`): reserved for prominent editorial headings; the compact public profile uses the smaller headline scale.
- **Headline** (`typography.headline`): section and dashboard headings; responsive headings enlarge at the `sm` breakpoint.
- **Title** (`typography.title`): product, campaign, and panel headings.
- **Body** (`typography.body`): introduction, descriptions, and explanatory text; muted when subordinate.
- **Label** (`typography.label`): actions and card labels; bold without all-caps styling.

## Layout

The public page is mobile-first within a centered `max-w-3xl` container. It uses 1rem side padding, increasing at `sm`, with 1.5rem/2rem top padding and a consistent 2.5rem/3.5rem rhythm between rendered sections. The profile logo has its own visible-state control but remains pinned above the ordered profile and content sections. The flow is deliberately linear: logo, compact centered profile, single featured content block, branch-owned product gallery, full-width product WhatsApp list, FAQ, optional links, and footer. A single gallery image is centered; two or more images become an automatic horizontal scroll-snap carousel on mobile with a visible next-card edge and a concise interaction hint. It advances every three seconds, pauses for pointer, focus, hidden-page, and reduced-motion states, and returns to a static grid at `sm`. Additional images appear through the native **Lihat semua koleksi** disclosure and follow the same responsive rule. Gallery content is independent from the ordered CTA products.

The admin shell is desktop-oriented: a narrow floating icon rail appears at `lg` beside full-width content, spans the viewport from top to bottom, and uses centered concave cuts instead of capsule ends. There is no persistent desktop header card, and account access sits at the foot of the rail. Its dashboard uses an unequal six-column summary grid at `md`, then an activity/quick-access split at `xl`. Analytics is a separate operational surface: its restrained funnel summary, daily event bars, ranked data tables, and event-detail filters show stored PageView, ViewContent, Contact, and LinkClick facts. Comparison copy sits inside each metric rather than creating decorative indicators; technical and geo rankings are flat list panels. Event attribution presents source, campaign, and—only when the saved UTM contains them—Ad Set and Ad in one readable cell. Provider data is visually isolated and carries explicit not-connected/error states. On smaller screens, a slim brand/account bar stays above a horizontal icon rail in normal flow and cards stack. Observed card gaps are 1rem, rising to 1.25rem in the public product grid at `sm`.

## Elevation & Depth

Most surfaces are flat and distinguished by color or a thin border. The public header action has a small diffuse shadow; the floating admin rail has a deeper diffuse shadow. Action links and summary tiles lift slightly on hover. These are accents to the otherwise flat card system, not a universal card shadow.

## Shapes

Cards and large panels have soft 1rem corners (`rounded.card`); gallery image wells use 0.75rem (`rounded.media`). Primary actions use full pill ends (`rounded.pill`). On desktop the admin navigation rail has straight vertical sides with centered concave cuts at the viewport edges; its active icon sits in a self-contained ivory rounded square without extending outside the rail. Thin sand-colored borders separate branch rows, activity rows, quick links, and the footer. Public image panels clip to their card silhouette.

## Components

### Actions

- **Primary WhatsApp:** a normal, final `wa.me` anchor directly visible for each eligible product; charcoal fill, cream text, WhatsApp icon, product name, supporting description, and CTA label in one full-width rounded block. Hover lifts by 0.125rem; keyboard focus receives an offset outline. Reduced-motion removes the transition.
- **Profile action:** a compact charcoal pill below the branch profile, scrolling directly to products when products exist.
- **Secondary links:** full-width ivory cards with bold labels; the background becomes soft bronze on hover.

### Cards and containers

- **Featured campaign:** a single 4:5 banner image with its own optional public title and description beneath it. When a destination exists, the image itself is the accessible link; campaigns without an image do not create an empty panel.
- **Product gallery:** a branch-owned collection of 4:5 images with optional title and description. It has no product assignment, CTA, WhatsApp destination, or tracking behavior. One item is centered; two or more run as an automatic CSS scroll-snap carousel on mobile before returning to a grid at `sm`. Six items appear initially; native disclosure reveals the rest. Autoplay pauses for manual interaction, focus, page invisibility, and reduced motion.
- **Product CTA list:** every eligible assigned product is represented exactly once as a direct WhatsApp action. CTA copy and ordering remain independent from gallery imagery.
- **Google review cards:** a separate optional source-backed section uses warm ivory cards with reviewer avatar, name, review-count detail, amber stars, Indonesian relative time, and Indonesian review text derived at import. The discreet Google Maps source link follows the list; it never competes with WhatsApp actions. Original Google text remains available only in the CMS for verification.
- **Admin summary tiles:** dark cocoa for site identity, soft bronze for campaign state, ivory for active product and branch counts. All remain direct navigation links and lift on hover.
- **Recent changes and quick access:** separate ivory and soft-bronze panels, with border-separated rows rather than floating subcards.

### Navigation and disclosure

The public surface has no separate website-style navigation header. Its first section is the branch profile itself: one logo, branch name, optional title/description, and a product jump action only when products are present. Product contact actions are visible without disclosure; FAQ entries retain native `details`/`summary`. No consent panel or privacy-preference control is rendered; the optional footer privacy link remains the disclosure route. The admin rail follows the owner-provided narrow dark reference: inset from the left edge, full viewport height on desktop, icon-only, and finished with concave cuts at the top and bottom. The active destination is an ivory rounded square contained fully inside the rail, while hover/focus tooltips reveal labels. An account icon at the rail foot opens a small panel showing the signed-in name, role, and sign-out action, separate from navigation links. On smaller screens, the rail scrolls horizontally below a slim bar with visible account access.

### Admin forms

Create and edit forms open in a native modal dialog from their list or summary. The dialog has a visible title, close control, keyboard Escape behavior, and scrollable content; validation remains on the form and server. A successful save closes the dialog and shows a brief toast; a failed save shows a dismissible toast while keeping the dialog and its inputs open.

Numeric order fields are not exposed in CMS forms. New items append to the end, edits retain their position, and compact Naik/Turun controls sit with each list item's actions. Campaign controls say **Naikkan prioritas** and **Turunkan prioritas** because the highest visible item wins when eligible schedules overlap. Shared product types have no independent public order; each branch's WhatsApp-button list controls placement.

Fields that support inheritance name both their scope and fallback source. Branch profile values identify **Standar & Template KGJ** as their source, while branch-product presentation identifies the **jenis produk bersama** or the branch CTA setting. Existing branch-logo overrides provide a deliberate **Gunakan gambar bawaan** action. Gallery and featured-content uploads use a 1080 × 1350 px (4:5) recommendation to match their public frame; logo uploads remain 800 × 800 px (1:1).

The **Halaman Link Bio** list is the single entry point for creating a branch page. Its branch editor owns branch identity, WhatsApp destination, page content, gallery, product placement, and branch-specific CTA presentation. **Galeri Produk** owns visual items and **Tombol WhatsApp** owns product assignment and contact copy; neither repeats the other's controls. Shared product types are selected, created, and secondarily maintained inside the Tombol WhatsApp panel instead of receiving a competing top-level navigation destination. Legacy branch and product-library routes redirect into the Halaman Link Bio flow.

The **Ulasan Google** manager keeps source URL and display settings in a controlled form so saved values immediately remain visible. Imported reviews present compact row controls for manual selection and hiding; one shared save action writes all pending display changes. Separate row-selection checkboxes open a count-aware permanent-delete dialog that names the irreversible result, focuses **Batal** first, and locks while deletion is pending, preventing accidental cleanup of genuine reviews while making dummy imports quick to remove.

Internal navigation receives a thin bronze progress line only while a new route is pending; slow route segments use concise skeletons that preserve the page silhouette. Server actions retain their explicit Indonesian pending labels and add a small inline spinner inside the active button. Motion respects reduced-motion preferences, and external destinations—especially the direct WhatsApp anchor—are never delayed by a custom loading layer.

## Do's and Don'ts

### Do:

- **Do** reuse the shared ivory, charcoal, and bronze roles across public and admin surfaces.
- **Do** keep gallery imagery independent from product CTA eligibility.
- **Do** keep WhatsApp actions visibly primary and directly navigable.
- **Do** retain visible focus and reduced-motion treatments on interactive elements.

### Don't:

- **Don't** add a competing generic SaaS accent color or decorative treatment that outranks product choice.
- **Don't** turn the public surface into a multi-step funnel before WhatsApp.
- **Don't** imply every card is elevated; most observed panels are flat.
- **Don't** add testimonial/review UI until its separate data and integration work is approved.
