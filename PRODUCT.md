# Product

<!-- impeccable:product-schema 1 -->

This file is design context for the frontend redesign. Business and technical requirements remain governed by `docs/prd.md`, `docs/system-architecture.md`, and `docs/database-design.md`, in that order.

## Platform

web

## Users

- Public visitors arriving from Meta Ads, Instagram, or organic channels use a mobile-first Link Bio to discover a product category and contact the relevant KGJ branch through WhatsApp.
- Marketing administrators maintain routine public content, campaigns, product categories, branches, assignments, links, and site settings through a desktop-oriented CMS that remains usable on smaller screens.
- Technical administrators also manage admin access and technical diagnostics.

## Product Purpose

Replace Taplink with an owned KGJ Link Bio that connects product interest to the correct branch WhatsApp while preserving consent-aware, anonymous campaign attribution. P0 succeeds when visitors can move from the public page to a relevant product and direct WhatsApp contact without tracking adding friction.

## Positioning

The product combines a KGJ-owned public destination, branch-specific product contact, an editable CMS, and first-party event records. It is not a general marketing website or a CRM.

## Operating Context

- Visitors may use an Instagram in-app browser and must reach WhatsApp through a normal, valid link even if analytics fails or JavaScript is unavailable.
- Marketing edits routine content in the CMS without a developer deployment.
- Local development uses Next.js and Supabase Local in Docker; the released application uses a separate hosted Supabase production project.

## Capabilities and Constraints

- P0 covers the Link Bio, CMS, product–branch mapping, branch WhatsApp CTA and message, consent-aware PageView/ViewContent/Contact tracking, UTM persistence, and audit logs.
- One product may belong to several branches; branch selection occurs at the WhatsApp CTA, not as another ViewContent event.
- Public contact remains product-scoped and direct. Tracking or consent controls must not become a mandatory step before WhatsApp.
- The redesign may change presentation and interactions but must preserve P0 behavior, admin permissions, event semantics, and existing business copy unless separately approved.
- CRM, leads, appointments, purchases, revenue, and advanced attribution are outside P0.

## Brand Commitments

- Preserve the Kotagede Jewellery identity and the project's established brand alignment while applying the owner-approved Playful SaaS UI direction to both public and admin surfaces.
- Product imagery, campaign banners, and brand assets are supplied by the owner; interfaces need usable places for them without inventing campaign or product claims.

## Evidence on Hand

- Approved requirements and constraints: `docs/prd.md`, `docs/system-architecture.md`, and `docs/database-design.md`.
- Existing public Link Bio, Admin CMS, and tracking implementation in `src/` provide the current workflows and copy. No unprovided testimonial, metric, or offer should be fabricated for the redesign.

## Product Principles

1. Keep the visitor's path from interest to WhatsApp short and reliable.
2. Make routine Marketing edits understandable without exposing technical secrets.
3. Show only truthful content and data already available in P0.
4. Preserve consent, accessibility, and tracking semantics as presentation changes.

## Accessibility & Inclusion

The public page and CMS target WCAG 2.2 AA. The public page is mobile-first and must remain usable in Instagram's in-app browser; the CMS is desktop-oriented but responsive.
