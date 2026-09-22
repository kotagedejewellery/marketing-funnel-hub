# AGENTS.md

## KGJ Custom Link Bio + Meta Tracking Hub

This repository contains the MVP/P0 implementation of the **KGJ Custom Link Bio + Meta Tracking Hub** for Kotagede Jewellery.

The product replaces Taplink with an owned, mobile-first link bio that captures product interest, routes visitors to the correct branch WhatsApp, preserves campaign attribution, sends meaningful events to Meta/GA4, and stores anonymous first-party tracking data internally.

This file defines the working rules for AI coding agents and human developers.

---

## 1. Project North Star

The product supports this funnel:

```text
VISITOR → INTEREST → CONTACT → LEAD
```

P0 is intentionally limited to:

```text
VISITOR → INTEREST → CONTACT / WHATSAPP
```

Do not implement Lead, Appointment, Qualified Lead, Closing, Purchase, Revenue, CRM, data warehouse, or advanced attribution in P0 unless the project scope is explicitly updated.

---

## 2. Core Business Flow

```text
Meta Ads / Instagram / Organic
            ↓
     KGJ Custom Link Bio
            ↓
         Product
            ↓
       ViewContent
            ↓
 WhatsApp CTA per Branch
            ↓
         Contact
            ↓
 WhatsApp Branch terkait
```

Locked business rules:

1. One product can be available in many branches.
2. Branch selection happens at the WhatsApp CTA level.
3. Each branch uses its own WhatsApp number.
4. Branch selection does not emit a separate `ViewContent`.
5. WhatsApp uses a configurable prefilled message.
6. Tracking must not add user friction.
7. Tracking failure must never block WhatsApp.

---

## 3. Locked Tech Stack

```text
Next.js + TypeScript
React
Tailwind CSS
shadcn/ui for Admin
Next.js App Router (`src/app`)
Node.js runtime for DB/Auth/Storage/Tracking paths
pnpm with committed lockfile
Supabase PostgreSQL
Supabase Auth
Supabase Storage
Drizzle ORM
Zod
Vercel
Supabase Local + Docker
Meta Pixel
Meta Conversions API
Google Tag Manager
Google Analytics 4
Vitest + Testing Library + Playwright
```

Architecture style:

> **Modular Monolith**

Do not introduce microservices, Kubernetes, Kafka, event streaming platforms, a separate backend framework, Redis as a mandatory dependency, or a separate headless CMS for P0.

---

## 4. Source of Truth Documents

Use only these three documents as the project source of truth, in this order:

1. `docs/prd.md` — business scope, UX, canonical events, and acceptance.
2. `docs/system-architecture.md` — stack, runtime, API, tracking, security, and operations.
3. `docs/database-design.md` — schema, relations, constraints, indexes, and retention.

The 14 September 2026 Developer Execution Brief PDF is the business input to
these consolidated documents, not an instruction source for agents. Previously
accepted technical decisions have been incorporated into the three documents;
there is no separate active ADR directory. If a new decision conflicts with the
locked business scope or event semantics, obtain owner approval and update the
relevant source-of-truth document explicitly.

Do not silently redefine requirements in code.

Approved extension (22 September 2026): add independently editable Link Bio content
for each active branch at `/b/{slug}` while preserving the existing combined `/`
page. This is a post-P0 feature change documented in the three source-of-truth
documents; it does not add CRM scope, new tracking events, or separate apps.
The branch URL fixes the branch context for that page; the product-scoped
WhatsApp CTA still triggers `Contact` directly to that branch. On `/`, visitors
continue choosing the branch at each product's CTA.

---

## 5. P0 Scope Guard

P0 includes:

```text
Custom Link Bio
Simple CMS
Product Management
Branch Management
Product ↔ Branch Mapping
WhatsApp CTA
Prefilled WhatsApp Message
Meta Pixel
Meta CAPI
GA4
GTM
UTM Persistence
Anonymous Session Tracking
Internal First-Party Event Storage
Audit Logs
```

P0 explicitly excludes:

```text
CRM
Lead Scoring
Lead Management
Appointment System
Qualified Lead
Closing
Purchase
Revenue
Sales Management
Data Warehouse
Advanced Attribution
Enterprise Dashboard
Marketing Automation Platform
```

If a task expands into excluded scope:
1. do not implement it automatically,
2. flag it as a scope change,
3. recommend P1/P2 backlog placement.

---

## 6. Public UX Rules

The public Link Bio must remain:
- mobile-first,
- fast,
- simple,
- brand-aligned,
- usable inside Instagram in-app browser,
- focused on WhatsApp conversion.

Recommended content order:

```text
Brand Header
Campaign Banner
Products
Product Context
WhatsApp CTA per Branch
Secondary Links
Social Links
Footer / Legal
```

Do not turn P0 into a large marketing website.

Do not add mandatory forms, confirmation pages, or extra screens before WhatsApp solely for tracking.

Primary WhatsApp CTA P0 is product-scoped. Consent controls must be accessible but
must never become a mandatory confirmation step before WhatsApp.

---

## 7. Admin CMS Rules

Marketing must be able to manage routine content without developer deployment.
Design the Admin CMS primarily for desktop dashboard workflows, while keeping it
responsive and usable on smaller screens. The public Link Bio's mobile-first rule
does not apply to the Admin CMS.

Admin capabilities include:

```text
Headline
Introduction
Campaign Banner
Products
Branches
Product ↔ Branch Assignment
WhatsApp Numbers
CTA Labels
Prefilled Message Template
Section Order
Active / Inactive Status
Social Links
Additional Links
```

Routine Marketing actions should use activate/deactivate rather than destructive delete.

---

## 8. Product ↔ Branch Rule

Canonical relationship:

```text
Product M:N Branch
```

Use the `product_branches` junction table.

A CTA is visible only when:

```text
products.is_active = true
AND product_branches.is_active = true
AND branches.is_active = true
```

WhatsApp number resolves from:

```text
branches.whatsapp_number
```

Message template priority:

```text
product_branches.whatsapp_message_template
→ site_settings.default_whatsapp_message
```

CTA label priority:

```text
product_branches.cta_label
→ branches.cta_label
→ site_settings.default_cta_label
```

---

## 9. WhatsApp Rules

Canonical WhatsApp URL:

```text
https://wa.me/{normalized_number}?text={url_encoded_message}
```

Store WhatsApp number in normalized country-code form, for example:

```text
628123456789
```

Supported message variables:

```text
{product}
{branch}
```

Do not expose technical tracking identifiers in customer-visible messages.

---

## 10. Canonical Tracking Events

P0 has exactly three business events:

```text
PageView
ViewContent
Contact
```

| Event | Meaning |
|---|---|
| PageView | Visitor opens the Link Bio |
| ViewContent | Visitor shows product interest |
| Contact | Visitor clicks a WhatsApp CTA |

Do not create event names per button, branch, or product.

Bad:

```text
ClickWeddingRingSurabaya
ClickWhatsAppJakarta
ClickPromoSeptember
```

Good:

```text
Contact
```

with contextual parameters.

---

## 11. ViewContent Rule

`ViewContent` is for product interest only.

Example:

```text
event_name = ViewContent
product_category = wedding_ring
```

Do not emit a second `ViewContent` for branch selection.

---

## 12. Contact Rule

Canonical Contact context:

```text
event_name = Contact
product_category = wedding_ring
branch = surabaya
cta = whatsapp
source = instagram
campaign = wedding_september
```

Contact is triggered when the visitor clicks the WhatsApp CTA.

---

## 13. Tracking Reliability Invariant

Mandatory rule:

```text
Tracking failure ≠ WhatsApp failure
```

If Meta, GA4, GTM, or internal event persistence fails:

```text
WhatsApp must still open.
```

Never make WhatsApp depend on a slow external analytics response.

Every CTA is a normal anchor with its final validated `wa.me` URL. Tracking uses a
best-effort `keepalive` event request and must not call `preventDefault`, await the
request, or show an interstitial.

---

## 14. Canonical Event Ownership

The application is the source of truth for:

```text
event_name
event_id
anonymous_session_id
product context
branch context
attribution context
```

Meta Pixel, Meta CAPI, and GTM → GA4 consume application state. GA4 is dispatched
through GTM only; do not add an independent direct `gtag` event path.

---

## 15. event_id Rule

Every logical event gets one unique `event_id`.

If the same event is sent through Meta Pixel and Meta CAPI, both must use the same:

```text
event_name
event_id
```

Example:

```text
Browser:
Contact / EVT123

Server:
Contact / EVT123
```

---

## 16. Attribution Rules

Capture and preserve:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Attribution must survive:

```text
Landing
→ Product
→ Contact
```

Do not fabricate missing attribution.

First non-empty UTM starts journey attribution. Direct/empty visits do not erase it.
A different explicit UTM set starts a new journey; internal navigation does not
change attribution.

---

## 17. Anonymous Session Rules

P0 does not use a dedicated `sessions` table.

Use:

```text
anonymous_session_id
```

to correlate:

```text
PageView
→ ViewContent
→ Contact
```

Do not use fingerprinting.

Use a random UUID in the first-party `kgj_sid` cookie with `Secure` in production,
`SameSite=Lax`, `Path=/`, and rolling 30-minute inactivity expiry. Store attribution
in a signed first-party session cookie. Do not implement cross-device identity.

---

## 18. Privacy Rules

P0 internal tracking is anonymous/pseudonymous.

Meta Pixel, Meta CAPI, GTM, GA4, and internal anonymous events follow approved
consent state. Without applicable consent they remain disabled and WhatsApp still
works. `_fbp`, `_fbc`, IP, and user-agent may be forwarded to Meta only when allowed;
they are transport-only and must not be stored in events or ordinary logs.

Allowed:

```text
anonymous_session_id
event_id
event_name
event_time
page_url
product_id
product_category
branch_id
branch_name
cta
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Do not store:

```text
customer name
customer WhatsApp number
customer email
customer address
personal lead data
```

Event retention:

```text
24 months
```

---

## 19. Database Tables

Required P0 tables:

```text
admin_profiles
site_settings
content_sections
campaigns
products
branches
product_branches
links
events
audit_logs
```

Do not add P0 tables such as:

```text
customers
leads
contacts
orders
sales
transactions
```

unless scope is formally changed.

---

## 20. Database Conventions

Use:

```text
PostgreSQL
Drizzle ORM
UUID primary keys
timestamptz
snake_case DB naming
```

Use migrations for schema changes.

Never silently modify production schema outside the migration workflow.

Normalized P0 data rules:
- `products` represents customer-facing product categories/needs, not SKUs,
- `products.slug` is the canonical `product_category`,
- `site_settings` uses fixed ID `00000000-0000-0000-0000-000000000001`,
- social and secondary destinations live only in `links`,
- the public page returns at most one eligible campaign using Database Design order,
- Contact requires Product, Branch, and `cta = whatsapp`,
- event Product/Branch foreign keys use `ON DELETE RESTRICT`.

---

## 21. Event Storage Rules

The `events` table is append-oriented.

A retry with the same `event_id` must not create a duplicate canonical event row.

An equivalent retry reuses the existing event. The same ID with a materially
different payload returns `409 Conflict` and never overwrites the canonical row.

Store historical snapshots:

```text
product_category
branch_name
```

in addition to:

```text
product_id
branch_id
```

---

## 22. Audit Log Rules

P0 includes `audit_logs`.

Recommended actions:

```text
create
update
activate
deactivate
assign
unassign
```

Store sanitized change diffs.

Do not place secrets in audit logs.

---

## 23. API Rules

Canonical endpoint boundaries may include:

```text
/api/public/config
/api/events
/api/admin/*
```

`/api/events` is the only public tracking mutation boundary. Meta CAPI is an internal
server module invoked from event ingestion, not a public endpoint.

Admin CRUD may use Server Actions.

Use Zod for all untrusted input.

---

## 24. Canonical Event Payload

Construct one canonical event before provider-specific mapping.

Example:

```json
{
  "eventId": "EVT123",
  "eventName": "Contact",
  "eventTime": "2026-09-15T03:00:00Z",
  "anonymousSessionId": "SESSION123",
  "pageUrl": "https://example.com/",
  "product": {
    "id": "uuid",
    "category": "wedding_ring"
  },
  "branch": {
    "id": "uuid",
    "name": "Surabaya"
  },
  "cta": "whatsapp",
  "attribution": {
    "source": "instagram",
    "campaign": "wedding_september",
    "utmSource": "instagram",
    "utmMedium": "paid_social",
    "utmCampaign": "wedding_september",
    "utmContent": "video_a",
    "utmTerm": null
  },
  "metadata": {}
}
```

---

## 25. Validation Rules

Use Zod for:

```text
event payloads
product forms
branch forms
campaign forms
site settings
URLs
WhatsApp numbers
environment variables
```

Validate server-side even if UI validation exists.

`POST /api/events` has a 32 KiB body limit and 4 KiB serialized `metadata` limit.
Resolve authoritative Product/Branch context server-side and validate Contact against
an active assignment. Apply deployment-edge rate limiting without adding Redis solely
for P0.

---

## 26. Authentication Rules

Use Supabase Auth.

Public Link Bio is unauthenticated.

Admin CMS is authenticated.

P0 roles:

```text
admin
technical_admin
```

Do not build enterprise RBAC unless explicitly requested.

Capabilities:
- `admin`: content, campaign, product, branch, assignment, link, settings, media,
  and internal tracking validation.
- `technical_admin`: all admin capabilities plus admin-profile provisioning/
  deactivation and technical diagnostics.

Every admin request requires an active `admin_profiles` row. Provider secrets remain
environment-only and are not editable in CMS.

---

## 27. Security Rules

Never expose to the browser:

```text
Meta CAPI access token
Supabase service-role key
privileged database credentials
other server secrets
```

Use environment variables.

Do not commit secrets.

---

## 28. Supabase Rules

Supabase responsibilities:

```text
PostgreSQL
Auth
Storage
```

Drizzle remains the canonical application schema/query layer.

Prefer server-side domain logic for business mutations.

Browser clients do not access application domain tables directly. Server domain
modules use Drizzle with a dedicated least-privilege application role. Enable RLS on
tables exposed through Supabase APIs and deny `anon`/`authenticated` direct domain
access by default. Browser Supabase usage is limited to Auth and approved Storage.

---

## 29. Storage Rules

Use Supabase Storage for:

```text
product images
campaign banners
brand assets
```

Store references/paths in PostgreSQL.

Do not store binary images in relational tables.

---

## 30. Rendering and Performance Rules

Public page has higher performance priority than Admin CMS.

Prefer:
- Server Components by default,
- minimal client JavaScript,
- optimized images,
- cacheable public content,
- non-blocking third-party scripts,
- minimal animation.

Do not add heavy client state management unless there is a concrete need.

Launch targets on representative mobile throttling: p75 LCP <= 2.5s, p75 INP <=
200ms, p75 CLS <= 0.1, and WCAG 2.2 AA.

---

## 31. Environment Separation

Environments (approved local/live decision):

```text
Local
Production
```

Local development and CI use Supabase Local in Docker. The released application
uses a separate hosted Supabase live/production project. Staging Supabase and
Vercel Preview validation are not required for P0. Do not use live credentials
for ordinary local development or CI tests, and do not expose the local stack
to public traffic.

Local:

```text
Next.js Local
Supabase Local
Docker
```

Do not use production DB as normal local development DB.

---

## 32. Migration Workflow

```text
Update Drizzle schema
→ Generate migration
→ Apply local
→ Test
→ Review and approve live change
→ Apply production explicitly
→ Focused live smoke check
```

Do not apply production migrations implicitly during Vercel build. The owner runs
reviewed migrations as a separate approved operation. Prefer backward-compatible
expand/contract changes.

---

## 33. Recommended Code Organization

```text
src/
 ├─ app/
 │   ├─ (public)/
 │   ├─ admin/
 │   └─ api/
 ├─ components/
 │   ├─ public/
 │   └─ admin/
 ├─ modules/
 │   ├─ products/
 │   ├─ branches/
 │   ├─ campaigns/
 │   ├─ tracking/
 │   ├─ attribution/
 │   └─ settings/
 ├─ lib/
 │   ├─ db/
 │   ├─ supabase/
 │   ├─ tracking/
 │   ├─ validation/
 │   └─ utils/
 └─ types/
```

Avoid one giant `utils.ts`, `services.ts`, or `actions.ts`.

---

## 34. TypeScript Rules

Use strict TypeScript.

Avoid `any` unless there is a documented integration reason.

Prefer inferred types from:
- Drizzle,
- Zod,
- domain types.

Do not duplicate the same domain type manually across multiple files.

---

## 35. Error Handling

Differentiate:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Conflict
Provider Error
Internal Error
```

Do not expose internal stack traces to public users.

---

## 36. Logging

Log enough to debug:

```text
event_id
provider
error category
timestamp
sanitized route/context
```

Do not log:
- secrets,
- access tokens,
- unnecessary user data.

---

## 37. Testing Expectations

The cases below describe risk-based coverage for completed features and the P0
launch gate, not a requirement to run every test after every small edit. Before
running tests, tell the owner exactly which checks you propose and why, then wait
for confirmation. For a small documentation, copy, or isolated configuration
change, a direct inspection may be sufficient. Do not claim unrun tests passed.

Relevant coverage may include:

Use Vitest for unit/module tests, Testing Library for React interaction, Playwright
for browser/E2E, and clean local Supabase/PostgreSQL migrations for DB integration.

### Domain
- Product ↔ Branch resolution
- active/inactive filtering
- CTA fallback logic
- WhatsApp message rendering
- campaign active period logic

### Tracking
- UTM persistence
- PageView payload
- ViewContent payload
- Contact payload
- event_id idempotency
- Meta browser/server same event ID
- equivalent and conflicting duplicate event IDs
- consent-allowed and consent-denied behavior
- WhatsApp navigation with blocked/failed tracking

### Admin
- auth protection
- role capability enforcement
- RLS/direct domain-access denial
- form validation
- CRUD behavior

### Public
- active product display
- branch CTA display
- WhatsApp URL generation
- single deterministic campaign selection
- WCAG 2.2 AA baseline and mobile performance targets

---

## 38. Canonical Launch Test

```text
Meta/Instagram Campaign
        ↓
KGJ Link Bio
        ↓
Wedding Ring
        ↓
ViewContent
        ↓
WhatsApp Surabaya
        ↓
Contact
        ↓
Prefilled WhatsApp
```

Expected:

```text
Source = Instagram
Campaign = wedding_september
Content = video_a
Product = Wedding Ring
Branch = Surabaya
CTA = WhatsApp
```

Validate:

```text
Internal event
Meta Pixel
Meta CAPI
GA4/GTM
No duplicate Contact
Correct WhatsApp destination
```

---

## 39. Sprint Order

```text
Sprint 0 — Foundation & Environment
Sprint 1 — Database & Core Domain
Sprint 2 — Public Link Bio
Sprint 3 — Admin CMS
Sprint 4 — Product ↔ Branch + WhatsApp
Sprint 5 — Tracking & Attribution
Sprint 6 — GA4, GTM & Validation
Sprint 7 — Hardening, QA & Launch
```

Do not begin P1/P2 while P0 launch gate is failing.

---

## 40. Agent Working Procedure

Before coding:
1. Read `AGENTS.md`.
2. Read the three source-of-truth documents in `docs/` relevant to the task.
3. Identify the relevant source-of-truth document.
4. Inspect existing code before creating abstractions.
5. Confirm the task fits P0 and an approved task plan.
6. Identify affected module(s), schema, API, tracking, and tests.

During coding:
1. Make the smallest coherent change.
2. Follow existing conventions.
3. Preserve module boundaries.
4. Add/update validation.
5. Add/update only the tests justified by changed behavior and risk.
6. Avoid unrelated refactors.

After coding:
1. State the proposed verification scope (specific tests/checks and reason) and
   obtain owner confirmation before running any tests.
2. Run only the approved, relevant checks; defer feature-level testing until the
   feature is complete when appropriate.
3. Review migration changes if any.
4. Update Graphify once after the completed change set.
5. Summarize changes, checks actually run, deferred checks, and known limitations.

---

## 41. Change Discipline

Do not:
- rename canonical events casually,
- change event semantics casually,
- change DB schema without migration,
- add a tracking provider without approval,
- change Product ↔ Branch relation,
- collect PII in P0,
- add a mandatory step before WhatsApp,
- move P1/P2 features into P0 without approval.

If a required change conflicts with a locked document, flag the conflict before implementing it.

---

## 42. Dependency Discipline

Before adding a dependency:
1. verify the existing stack cannot solve the problem cleanly,
2. prefer native Next.js/React/Supabase/Drizzle/Zod capabilities,
3. avoid dependencies for trivial helpers,
4. document why the dependency is necessary.

---

## 43. Database Change Checklist

```text
[ ] Update Drizzle schema
[ ] Add migration
[ ] Review constraints
[ ] Review indexes
[ ] Review RLS/access impact
[ ] Update seed if needed
[ ] Update API/data contract if shape changed
[ ] Add tests
```

---

## 44. Tracking Change Checklist

```text
[ ] Preserve canonical event semantics
[ ] Preserve event_id
[ ] Preserve anonymous_session_id
[ ] Preserve UTM context
[ ] Verify internal event write
[ ] Verify Meta Pixel
[ ] Verify Meta CAPI
[ ] Verify GTM/GA4
[ ] Verify no duplicate event
[ ] Verify WhatsApp still opens on provider failure
```

---

## 45. Admin Feature Checklist

```text
[ ] Authenticated route
[ ] Server-side validation
[ ] Audit log if state changes
[ ] Active/inactive handling if relevant
[ ] No secret exposed to Marketing UI
[ ] Public content updates without redeploy
```

---

## 46. Public Feature Checklist

```text
[ ] Mobile-first
[ ] Instagram in-app browser compatible
[ ] Accessible semantics
[ ] Minimal JS
[ ] No unnecessary user step
[ ] Does not break primary WhatsApp CTA
[ ] Handles inactive/missing data safely
```

---

## 47. Definition of Done for Agent Tasks

A coding task is complete when:

```text
Implementation works
+
Validation exists
+
No scope violation
+
No security regression
+
No tracking regression
+
Documentation updated if contract changed
```

For completed features, perform the owner-approved risk-based verification before
claiming the feature is verified. If approval is pending, report the work as
implemented but unverified; never imply that deferred tests passed.

---

## 48. Graphify and Scope Discipline

- Keep the project Graphify index current. After each completed change set to
  source, tests, configuration, or documentation, update Graphify once. Use
  `graphify update .` for code-only changes and incremental `graphify extract .`
  when documentation or other supported content changes. Do not rebuild after
  every keystroke or index generated output; report files Graphify skipped.
- Make only the changes the owner requested or explicitly approved. Do not add
  unsolicited improvements, refactors, dependencies, abstractions, or test
  infrastructure. If a necessary change would expand scope, explain it and ask
  first.
- Prefer the smallest clear solution. Testing must be proportionate to the
  changed behavior and risk; do not overengineer implementation or verification.
- Git add, commit, push, and pull remain owner-managed.

---

## 49. Final Principle

When uncertain, prefer the simplest implementation that preserves the locked business rules.

> **KEEP IT SIMPLE. BUILD THE SIGNAL FIRST.**

Do not optimize for hypothetical enterprise requirements outside P0.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
