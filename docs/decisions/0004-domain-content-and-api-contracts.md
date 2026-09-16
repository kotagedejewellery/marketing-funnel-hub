# ADR-004: Domain semantics, content selection, and API contracts

## Status

Accepted

## Date

2026-09-15

## Context

The baseline uses both “product” and “product category,” permits multiple campaign
rows while returning one public campaign, stores social links in two places, and
allows Contact without a clearly modeled product source. These ambiguities would
produce incompatible database, CMS, API, and analytics behavior.

## Decision

### Product and WhatsApp semantics

1. A P0 `products` row represents a customer-facing product category or need, such
   as Wedding Ring, rather than an individual SKU or inventory item.
2. `products.slug` is the canonical stable `product_category` value used in events
   and provider mappings. `products.name` remains display copy and may change.
3. `events.product_category` stores the product slug snapshot. `events.branch_name`
   stores the human-readable branch name snapshot; `branch_id` remains the stable
   branch identity for internal reporting.
4. Every primary P0 WhatsApp CTA is product-scoped through an active
   `product_branches` assignment. Consequently, Contact requires both product and
   branch context in P0.
5. A generic branch-only WhatsApp CTA is not silently represented as a product or
   secondary link. If Product requires generic consultation, add an explicit
   product-null CTA model through a reviewed schema/API change before implementation.
6. Public CTA visibility and fallback resolution remain exactly:
   active product + active assignment + active branch, assignment message before
   site default, and assignment label before branch label before site default.

### Campaign and content semantics

7. The public Link Bio displays at most one campaign banner. Eligible rows satisfy
   the existing active/date-window rules. Select deterministically by `sort_order`
   ascending, then `active_from` descending with null last, then `created_at`
   descending, then `id` ascending.
8. The CMS warns when active campaign windows overlap but does not reject overlap;
   deterministic selection prevents runtime ambiguity during campaign transitions.
9. The `links` table is the canonical source for both social and secondary links.
   Remove the duplicated Instagram, TikTok, YouTube, and Facebook columns from
   `site_settings` before the first migration. Keep `privacy_url` in site settings
   because it is a site policy destination, not a social link.
10. Enforce the `site_settings` singleton with one fixed row identifier
    `00000000-0000-0000-0000-000000000001` plus a database check constraint. Admin
    behavior updates that row and never creates another.

### Public and event contracts

11. The public configuration DTO returns `campaign: null` when no campaign is
    eligible, followed by all active products with only active branch assignments,
    and active links/sections in deterministic sort order. It is a bounded page DTO,
    not a general collection endpoint, so it is not paginated.
12. Model canonical events as a discriminated union:
    - PageView: product, branch, and CTA are null.
    - ViewContent: product ID and category are required; branch and CTA are null.
    - Contact: product ID/category, branch ID/name, and `cta = whatsapp` are required.
13. Clients submit product and branch IDs with their event context. The server
    resolves authoritative names, slugs, and active assignments from current domain
    data before persistence and provider dispatch. Client-supplied display values
    may be checked for diagnostics but never override server values.
14. Use one JSON error envelope: `{ "ok": false, "error": { "code", "message",
    "fields"? } }`. Use HTTP 400 for malformed JSON, 401 for unauthenticated, 403
    for unauthorized, 404 for missing resources, 409 for state/idempotency conflicts,
    422 for valid JSON that fails domain validation, 429 for rate limits, and 500 for
    sanitized internal failures.
15. Admin collection views use pagination with a default page size of 20 and maximum
    100. Admin mutations use typed Server Action results with the same error codes
    and field-error semantics as HTTP routes.
16. Public URLs accept HTTPS only in production. Local development may explicitly
    allow HTTP localhost URLs. Redirect targets never accept script or data schemes.

## Alternatives considered

### Add a separate product-category table

Rejected because P0 products already function as the selectable categories and no
SKU or inventory behavior exists. A second entity would duplicate the domain model.

### Render every simultaneously active campaign

Rejected because the UX specifies one banner area and multiple banners would require
a new carousel or stacking interaction that has not been designed.

### Keep social links in both site settings and links

Rejected because two writable sources create precedence ambiguity and inconsistent
ordering. The normalized `links` entity already supports the requirement.

## Consequences

- Tracking receives stable category values without expanding the P0 schema.
- The primary Contact contract becomes strict and server-authoritative.
- A generic WhatsApp CTA is a visible scope decision rather than an accidental edge
  case.
- Campaign rendering is deterministic even during overlapping schedules.
- The locked database design and API contract must be updated to remove duplicate
  social columns and make Contact product context required after this ADR is accepted.
