# Sprint & Implementation Plan v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Normalized Execution Plan / ADR-001 through ADR-005 Accepted  
**Phase:** MVP / P0  
**Owner:** Product / Engineering  
**Last Reviewed:** 2026-09-15  
**Architecture:** Next.js + Supabase + Drizzle + Vercel  
**Objective:** Deliver production-ready P0 without scope creep.

---

## 1. Delivery Strategy

Development should proceed vertically and incrementally.

Priority order:

```text
Foundation
→ Data Model
→ Public Link Bio
→ CMS
→ Product-Branch Routing
→ Tracking
→ QA
→ Launch
```

Do not start P1/P2 before P0 launch gate is passed.

---

## 2. Recommended Sprint Structure

Recommended:

```text
Sprint 0 — Foundation & Environment
Sprint 1 — Database & Core Domain
Sprint 2 — Public Link Bio
Sprint 3 — Admin CMS
Sprint 4 — Product ↔ Branch + WhatsApp
Sprint 5 — Tracking & Attribution
Sprint 6 — Analytics & Validation
Sprint 7 — Hardening, QA & Launch
```

---

## 3. Sprint 0 — Foundation & Environment

### Goal
Create stable development foundation.

### Tasks

#### Repository
- create Git repository,
- setup branch strategy,
- add README,
- add environment example.

#### Application
- initialize Next.js + TypeScript,
- use App Router under `src/app`,
- use Node.js runtime for DB/Auth/Storage/Tracking paths,
- setup Tailwind CSS,
- setup shadcn/ui for admin.

#### Toolchain
- use pnpm and commit the lockfile,
- select and pin the current Vercel-supported Active LTS Node.js major,
- pin exact compatible dependency versions,
- record versions in repository configuration.

#### Local Backend
- setup Supabase Local,
- Docker configuration,
- verify local PostgreSQL/Auth/Storage.

#### ORM
- setup Drizzle,
- configure migration workflow.

#### Validation
- setup Zod.

#### Testing and CI
- setup Vitest,
- setup Testing Library,
- setup Playwright,
- add formatting, lint, strict typecheck, unit, integration, smoke, and build gates.

#### Environment
Create:

```text
.local
preview/staging
production
```

Assign explicit owners for every environment, provider account, migration promotion,
and production approval.

#### Hosting
- connect GitHub → Vercel,
- configure preview deployment.

### Definition of Done
- app runs locally,
- Supabase Local works,
- Drizzle connects,
- preview deployment works,
- secrets not committed.
- exact runtime/dependency versions recorded,
- CI quality gates pass.

---

## 4. Sprint 1 — Database & Core Domain

### Goal
Implement locked P0 database schema.

### Tables

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

### Tasks
- create Drizzle schema,
- generate migration,
- apply local,
- add constraints,
- add indexes,
- create seed data,
- configure storage buckets,
- baseline RLS/access policies,
- dedicated least-privilege Drizzle application role,
- deny direct `anon`/`authenticated` domain-table access,
- fixed `site_settings` singleton constraint,
- event-specific context constraints and restrictive event foreign keys,
- verify migrations.

### Seed
- site settings,
- content sections,
- initial admin role reference.

Production Auth users and credentials are not seed data. Provision the first
`technical_admin` using the approved deployment runbook.

### Definition of Done
- clean local DB can be created from migrations,
- Product M:N Branch works,
- event table supports P0 schema,
- audit log schema available.

---

## 5. Sprint 2 — Public Link Bio

### Goal
Build customer-facing mobile-first Link Bio.

### Sections
- Brand Header
- Campaign Banner
- Product List
- Product Context
- Secondary Links
- Social Links
- Footer

### Tasks
- public layout,
- responsive design,
- product cards,
- product detail interaction,
- active/inactive filtering,
- image optimization,
- basic public data loader,
- Server Components by default with minimal Client Components,
- deterministic single-campaign selection,
- consent control that never blocks WhatsApp,
- empty states.

### Definition of Done
- public page works on mobile,
- active content displays correctly,
- inactive content hidden,
- no tracking dependency required yet.

---

## 6. Sprint 3 — Admin CMS

### Goal
Enable Marketing self-service.

### Modules
- Login
- Dashboard
- Content
- Campaigns
- Products
- Branches
- Product-Branch Mapping
- Links
- Settings

### Tasks
- Supabase Auth integration,
- protected admin routes,
- CRUD products,
- CRUD branches,
- campaign management,
- links management,
- settings update,
- active/inactive controls,
- sort order,
- media upload,
- audit log writes.
- role capability enforcement,
- cache invalidation after successful public-content mutations,
- paginated admin collections.

### Definition of Done
Marketing can update routine content without code deployment.

---

## 7. Sprint 4 — Product ↔ Branch + WhatsApp

### Goal
Complete conversion routing.

### Tasks
- product-branch assignment,
- CTA generation,
- branch-specific WhatsApp destination,
- prefilled message template,
- fallback message rules,
- fallback CTA rules,
- URL encoding,
- invalid destination validation.
- normal anchor navigation without `preventDefault`, interstitial, or tracking wait.

### Test

```text
Wedding Ring
→ WhatsApp Surabaya
→ correct WA destination
→ correct prefilled message
```

### Definition of Done
Every active Product-Branch CTA routes correctly.

---

## 8. Sprint 5 — Tracking & Attribution

### Goal
Implement canonical event system.

### Tasks

#### Session
- generate `kgj_sid` UUID,
- persist rolling 30-minute first-party session cookie,
- persist signed attribution cookie,
- start a new journey for a different explicit UTM set.

#### UTM
- read UTM on entry,
- preserve attribution through journey.

#### Canonical Events
- PageView
- ViewContent
- Contact

#### Internal Event API
- `/api/events`,
- Zod validation,
- server-authoritative Product/Branch resolution,
- request and metadata size limits,
- equivalent-retry idempotency and conflicting-retry 409,
- deployment-edge rate limiting.

#### Meta
- Meta Pixel integration,
- Meta CAPI implementation,
- PageView/ViewContent/Contact CAPI dispatch when consent permits,
- event_id deduplication,
- browser `keepalive` dispatch without awaiting WhatsApp navigation.

### Definition of Done
Canonical events are internally stored and Meta browser/server events deduplicate correctly.

---

## 9. Sprint 6 — GA4, GTM & Tracking Validation

### Goal
Complete analytics stack and operational validation.

### Tasks
- GTM data layer,
- GA4 event mapping through GTM only,
- GTM container setup,
- GA4 validation,
- basic Admin tracking validation view,
- verify source/campaign,
- verify product/branch context.

### Definition of Done
Meta + GA4 + internal event logs show expected P0 events.

---

## 10. Sprint 7 — Hardening, QA & Launch

### Goal
Pass launch gate.

### Functional QA
- public page,
- products,
- campaigns,
- branch CTA,
- CMS,
- media.

### Tracking QA
- PageView,
- ViewContent,
- Contact,
- UTM persistence,
- event_id deduplication,
- Meta Events Manager,
- GA4 DebugView / validation,
- internal event logs.

### Device QA
- Android browser,
- iOS browser,
- Instagram in-app browser,
- desktop responsive check.

### Failure QA
- Meta unavailable,
- CAPI error,
- internal event failure,
- broken media,
- inactive branch/product.

### Security QA
- admin route protection,
- no server secret in browser,
- input validation,
- safe URLs.
- RLS/direct-access denial,
- role capability matrix,
- public event endpoint limits and abuse controls,
- consent-denied behavior.

### Performance QA
- optimize images,
- reduce client JS,
- verify CTA responsiveness.
- verify p75 LCP <= 2.5s, INP <= 200ms, and CLS <= 0.1 on representative mobile,
- verify WCAG 2.2 AA public/admin baseline.

### Deployment and Operations QA
- apply migrations through the separately approved deployment job,
- verify application rollback against compatible schema,
- test the authenticated 24-month retention job in staging,
- verify sanitized logs and production alert routes.

### Definition of Done
Canonical paid campaign flow passes end-to-end.

---

## 11. Canonical Launch Test

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

Expected tracking:

```text
Source = Instagram
Campaign = wedding_september
Content = video_a
Product = Wedding Ring
Branch = Surabaya
CTA = WhatsApp
```

Required validation:
- internal event exists,
- Meta Contact visible,
- no duplicate conversion,
- GA4 event visible,
- WhatsApp destination correct.

---

## 12. Sprint Dependencies

```text
Sprint 0
  ↓
Sprint 1
  ↓
Sprint 2 ─────┐
  ↓           │
Sprint 3      │
  ↓           │
Sprint 4 ◄────┘
  ↓
Sprint 5
  ↓
Sprint 6
  ↓
Sprint 7
```

Tracking should not begin before Product/Branch context is stable.

---

## 13. Parallel Work Opportunities

Possible parallelization:

### Sprint 2 / Sprint 3
- Public UI and Admin CMS can partly run in parallel after database schema is stable.

#### Sprint 5 / GTM preparation
- GTM container setup can start while server event implementation proceeds.

Avoid excessive parallelization before domain model stabilizes.

---

## 14. Developer Workstreams

Recommended workstreams:

### Workstream A — Public Frontend
- public page,
- product UI,
- responsive/mobile.

### Workstream B — Admin CMS
- auth,
- CRUD,
- settings,
- media.

### Workstream C — Data & API
- Drizzle,
- migrations,
- endpoints,
- event persistence.

### Workstream D — Tracking
- UTM,
- Meta,
- GTM,
- GA4.

### Workstream E — QA / Release
- functional,
- analytics,
- security,
- performance.

Small team can merge these roles.

---

## 15. Suggested Milestones

### M1 — Technical Foundation Ready
After Sprint 1.

### M2 — Link Bio Functional
After Sprint 2.

### M3 — Marketing Self-Service Ready
After Sprint 3.

### M4 — WhatsApp Conversion Flow Ready
After Sprint 4.

### M5 — Tracking Stack Ready
After Sprint 6.

### M6 — Production Launch
After Sprint 7.

---

## 16. P0 Launch Gate

Launch only if:

```text
✓ Link Bio works
✓ CMS works
✓ Product ↔ Branch works
✓ WhatsApp destination correct
✓ Prefilled message correct
✓ PageView works
✓ ViewContent works
✓ Contact works
✓ UTM persists
✓ Meta Pixel works
✓ Meta CAPI works
✓ Deduplication works
✓ GA4/GTM works
✓ Internal event storage works
✓ Tracking failure does not block WhatsApp
```

---

## 17. Scope Control

Any request outside P0 goes to backlog.

Examples:

```text
CRM
Lead scoring
Appointment
Lead Form
Revenue
Closing
Advanced dashboard
```

Do not insert into active sprint unless formally approved as scope change.

---

## 18. Risk Register

### R1 — Tracking Duplication
Mitigation:
- canonical event_id,
- single event source,
- QA Meta Events Manager.

### R2 — WhatsApp Blocked by Tracking
Mitigation:
- failure isolation,
- short timeout,
- non-blocking external calls.

### R3 — CMS Misconfiguration
Mitigation:
- validation,
- active/inactive status,
- admin warnings,
- audit logs.

### R4 — Production Data Used in Dev
Mitigation:
- Supabase Local,
- environment separation.

### R5 — UTM Lost During Journey
Mitigation:
- first-party attribution persistence,
- test campaign URL.

### R6 — Broken Product-Branch Mapping
Mitigation:
- DB uniqueness,
- admin validation,
- end-to-end CTA tests.

---

## 19. QA Ownership

Every sprint must include local QA before marking complete.

Sprint 7 is not the first time testing occurs; it is final integration/hardening.

---

## 20. Documentation Deliverables

Before production launch:

```text
README
Environment Setup
Database Migration Guide
CMS User Guide
Tracking Event Map
UTM Naming Guide
QA Checklist
Known Limitations
Rollback / Recovery Notes
```

---

## 21. Deployment Checklist

Before production:

- production env vars configured,
- Supabase production schema migrated,
- storage configured,
- admin user available,
- Meta Pixel ID configured,
- Meta CAPI credential configured,
- GTM container published,
- GA4 property configured,
- domain connected,
- HTTPS active,
- QA URL checked.
- consent policy and production tracking defaults configured,
- deployment-edge event rate limits configured,
- migration promotion and rollback runbooks approved,
- retention job and operational alerts staging-tested.

---

## 22. Post-Launch Validation

Immediately after launch:

- test real public domain,
- test one paid-style UTM URL,
- test each active WhatsApp branch,
- inspect Meta Events Manager,
- inspect GA4,
- inspect internal event store,
- verify no duplicate Contacts.

---

## 23. First 7 Days After Launch

Recommended monitoring:

- broken CTA,
- tracking failure rate,
- CAPI errors,
- internal event counts,
- suspicious duplicate events,
- mobile UX issues,
- CMS operational feedback.

Do not introduce new features during stabilization unless critical.

---

## 24. P1 Entry Criteria

Only begin P1 once:

```text
P0 stable
+
tracking validated
+
Marketing CMS usable
+
no critical production bug
```

Potential P1:
- Lead Form
- Appointment
- Lead event
- Schedule event
- extended analytics

---

## 25. Sprint Plan Status

**Sprint Structure:** LOCKED BASELINE  
**P0 Milestones:** DEFINED  
**Launch Gate:** DEFINED  
**Risk Controls:** DEFINED  
**Parallelization:** DEFINED  
**Developer Task Breakdown:** DEFINED in `tasks/plan.md` and `tasks/todo.md`  
**Implementation Plan v1.0:** IN PROGRESS; T0-02 AND T0-03 COMPLETE; T0-01
USER-MANAGED; T0-04 ONWARD PLANNED
