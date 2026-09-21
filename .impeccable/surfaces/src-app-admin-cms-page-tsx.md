---
version: 1
slug: "src-app-admin-cms-page-tsx"
primary_target: "src/app/admin/(cms)/page.tsx"
related_targets: ["src/app/admin/(cms)/layout.tsx","src/components/admin/navigation.tsx"]
---

# Admin CMS shell and dashboard

Mode: Operate. Marketing scans live content state, reaches frequent editing tasks, and reviews recent changes. Keep all existing destinations, role filtering, data, and sign-out behavior. Desktop-first, responsive on smaller screens.

## Direction contract

THESIS: The CMS feels like a clear working studio, not a conventional full-height sidebar beside uniform metric cards. Its bento layout distinguishes tasks from status without inventing analytics.

OWN-WORLD: Share the KGJ ivory, charcoal, and bronze vocabulary with the public page. Follow the owner-provided narrow dark rail reference: floating from the left edge, full viewport height, icon-only, with centered concave cuts at the top and bottom. Use a contained ivory rounded square for the active icon and hover/focus tooltips for labels. Keep a full-width calm canvas, asymmetric bento panels, rounded controls, restrained depth, and consistently drawn icons.

STORY: An admin sees the current site and campaign, active product and branch counts, recent changes, and direct routes to editing. The interface should make the next legitimate action obvious without a fake KPI.

FIRST VIEWPORT: Desktop places a full-height sculpted vertical icon rail at the left with account access at its foot, then the dashboard heading and two unequal feature panels in full-width content. No persistent header card sits above the content. Counts and recent activity follow in a dense but readable grid. On mobile a slim brand/account bar precedes a horizontally scrollable icon strip and the content; the rail is never a fixed overlay.

FORM: User-pinned full-height sculpted rail and bento dashboard, inheriting public-world seed 5e9e7a90. The active icon is highlighted by a contained rounded square inside the rail; admin create/edit forms open in native dialogs with direct close and keyboard behavior.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
