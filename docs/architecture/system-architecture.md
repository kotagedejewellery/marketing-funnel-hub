# System Architecture v1.1
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Final / Normalized by ADR-001 through ADR-005  
**Phase:** MVP / P0  
**Owner:** Engineering  
**Last Reviewed:** 2026-09-16  
**Architecture Pattern:** Modular Monolith  
**Purpose:** Menjadi source of truth untuk komponen teknis, runtime flow, data flow, integration, infrastructure, security boundary, reliability, dan deployment.  
**Does NOT define:** Layout halaman, visual hierarchy, UX copy, atau detail interaksi UI.

---

## 1. Architecture Goals

System architecture harus:

- sederhana,
- mudah dirawat,
- cepat untuk public Link Bio,
- menjaga secret tetap server-side,
- mendukung CMS Marketing,
- mendukung Product M:N Branch,
- mendukung Meta Pixel + CAPI,
- mendukung GA4/GTM,
- menyimpan first-party event internal,
- memisahkan failure analytics dari WhatsApp journey,
- siap untuk P1/P2 tanpa over-engineering.

---

## 2. Locked Technical Stack

```text
Next.js + TypeScript
Supabase PostgreSQL
Drizzle ORM
Supabase Auth
Supabase Storage
Vercel
Supabase Local + Docker
Meta Pixel
Meta CAPI
Google Tag Manager
Google Analytics 4
Zod
```

---

## 3. Architecture Pattern

P0 menggunakan:

> **Modular Monolith**

Satu aplikasi Next.js dengan logical modules:

```text
Public Content
Admin CMS
Products
Branches
Campaigns
Links
Tracking
Attribution
Internal Events
Meta CAPI
```

Tidak digunakan microservices pada P0.

Runtime boundary:
- Next.js App Router under `src/app`,
- Server Components by default for public rendering,
- Node.js runtime for PostgreSQL, Auth, Storage administration, internal events,
  and Meta CAPI,
- Server Actions for authenticated admin mutations,
- Route Handlers for explicit HTTP boundaries.

---

## 4. High-Level Architecture

```text
               Traffic Sources
       Meta / Instagram / Organic
                   │
                   ▼
            Visitor Browser
                   │
                   ▼
        ┌─────────────────────┐
        │ Vercel / Next.js    │
        │ Modular Monolith    │
        └───────┬─────────────┘
                │
       ┌────────┼───────────┐
       ▼        ▼           ▼
   Supabase   Tracking    WhatsApp
   Platform    Layer      Destination
       │
       ├─ PostgreSQL
       ├─ Auth
       └─ Storage
```

External tracking layer:

```text
Meta Pixel
Meta CAPI
GTM → GA4
```

---

## 5. Core Modules

### 5.1 Public Content Module

Responsibilities:

- load active public content,
- load campaign,
- load products,
- load branch assignments,
- provide data required by public Link Bio.

Does not define visual layout; that belongs to UX & Information Architecture.

---

### 5.2 Product Module

Responsibilities:

- product persistence,
- active/inactive status,
- ordering,
- product metadata,
- relationships to branch.

---

### 5.3 Branch Module

Responsibilities:

- branch persistence,
- WhatsApp destination,
- active/inactive status,
- branch ordering.

---

### 5.4 Product-Branch Module

Responsibility:

Maintain M:N relationship:

```text
Product
  M:N
Branch
```

via junction entity conceptually named:

```text
product_branches
```

Exact columns are defined in Database Design.

---

### 5.5 Campaign Module

Responsibilities:

- campaign content persistence,
- active period,
- active/inactive state,
- public campaign configuration.

Campaign CMS entity must not be confused automatically with incoming `utm_campaign`.

---

### 5.6 Admin CMS Module

Responsibilities:

- authenticated administration,
- content mutation,
- product management,
- branch management,
- mapping management,
- settings update,
- validation.

UI hierarchy itself belongs to UX & Information Architecture.

---

### 5.7 Attribution Module

Responsibilities:

- capture incoming UTM,
- preserve session attribution,
- expose attribution context to canonical events.

Minimum context:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

---

### 5.8 Tracking Module

Responsibilities:

- canonical event construction,
- event_id generation,
- event validation,
- browser tracking payload preparation,
- server tracking payload preparation.

P0 canonical events:

```text
PageView
ViewContent
Contact
```

---

### 5.9 Internal Event Module

Responsibilities:

- validate internal event payload,
- persist event records,
- support operational QA and future reporting.

P0 event data remains anonymous/pseudonymous.

---

### 5.10 Meta CAPI Module

Responsibilities:

- receive canonical server event,
- map payload to Meta CAPI,
- use server-side token,
- handle Meta response/error,
- preserve event_id for deduplication.

Module ini internal server-only dan tidak diekspos sebagai unrestricted public API.

---

## 6. Public Request Runtime Flow

```text
Browser Request
      ↓
Next.js
      ↓
Load public configuration
      ↓
Query PostgreSQL via Drizzle
      ↓
Resolve active content/product/branch/campaign
      ↓
Return/render public page
```

Rendering method may combine server rendering and client interaction where appropriate.

Initial public render membaca data langsung melalui server domain modules. Public
configuration DTO tidak memerlukan second client-side fetch.

---

## 7. Session & Attribution Flow

```text
Visitor enters
      ↓
Read incoming UTM
      ↓
Resolve/create anonymous session_id
      ↓
Persist active attribution context
      ↓
Attach context to canonical events
```

No customer identity is created.

No fingerprinting.

Session menggunakan random UUID pada first-party `kgj_sid` cookie dengan rolling
30-minute inactivity expiry. Attribution berada pada signed first-party session
cookie. Direct/empty visit tidak menghapus attribution; explicit UTM baru yang
berbeda memulai journey baru.

---

## 8. PageView Event Flow

```text
Valid public page visit
      ↓
Build canonical PageView
      ↓
Generate event_id
      ↓
Persist internal event
      ↓
Dispatch consented browser analytics and Meta CAPI as configured
```

Exact browser transport implementation belongs to API / Tracking Data Contract stage.

---

## 9. ViewContent Event Flow

```text
Product interaction
      ↓
Resolve product context
      ↓
Generate event_id
      ↓
Build canonical ViewContent
      ↓
Persist internal event
      ↓
Dispatch consented browser analytics and Meta CAPI
```

Branch is not a separate ViewContent event.

---

## 10. Contact Event Flow

```text
WhatsApp CTA click
      ↓
Resolve product
      ↓
Resolve selected branch
      ↓
Resolve session attribution
      ↓
Generate event_id
      ↓
Build canonical Contact
      ↓
Push consented browser tracking
      ↓
Best-effort keepalive POST /api/events
      ↓
Normal WhatsApp anchor navigation continues immediately
```

Critical invariant:

> Analytics failure must not block WhatsApp.

---

## 11. Canonical Event Ownership

Application owns:

- event_name,
- event_id,
- anonymous_session_id,
- product context,
- branch context,
- attribution context.

Meta/GTM/GA4 are consumers.

They must not become separate independent sources of business state.

---

## 12. Browser Tracking Architecture

Browser consumers:

```text
Meta Pixel
GTM → GA4
```

Application should publish one canonical event payload or data-layer representation.

Avoid duplicate event generation from multiple independent scripts.

Do not initialize an independent direct GA4/`gtag` event path.

---

## 13. Server Tracking Architecture

Meta CAPI runs server-side only as an internal module behind `POST /api/events`.

```text
Canonical Event
      ↓
Server Endpoint / Handler
      ↓
Meta CAPI Mapping
      ↓
Meta Graph Endpoint
```

Meta access token stays server-side.

---

## 14. Meta Deduplication

For browser/server pair:

```text
Browser:
Contact / event_id = EVT123

Server:
Contact / event_id = EVT123
```

Same logical event must share:

- event_name,
- event_id.

---

## 15. Internal Event Storage

Flow:

```text
Canonical Event
      ↓
Zod Validation
      ↓
Drizzle
      ↓
PostgreSQL
```

Store only data required for:

- data ownership,
- QA,
- attribution analysis,
- future reporting.

No PII in P0.

---

## 16. Data Platform Architecture

Supabase provides:

```text
PostgreSQL
Auth
Storage
```

Drizzle remains canonical DB access/migration layer for application domain data.

Supabase is infrastructure, not application business logic.

---

## 17. Authentication Architecture

Public routes:

```text
Unauthenticated
```

Admin routes:

```text
Authenticated via Supabase Auth
```

P0 does not require customer authentication.

Complex RBAC is not required.

Role matrix:
- `admin`: content, campaign, product, branch, assignment, link, settings, media,
  and internal tracking-validation access.
- `technical_admin`: all admin permissions plus admin-profile provisioning/
  deactivation and technical diagnostics.

Every admin request requires an active `admin_profiles` row. Provider secrets remain
environment-only.

---

## 18. Storage Architecture

Supabase Storage stores:

- product images,
- campaign banners,
- brand assets where applicable.

PostgreSQL stores references/paths.

Binary files are not stored directly inside domain tables.

---

## 19. Admin Mutation Flow

```text
Authenticated Admin
      ↓
Next.js Admin Action
      ↓
Zod Validation
      ↓
Authorization Check
      ↓
Drizzle Mutation
      ↓
PostgreSQL
      ↓
Cache/content invalidation if applicable
```

Routine updates do not require code deployment.

---

## 20. Media Upload Flow

```text
Admin Upload
      ↓
Validate file
      ↓
Supabase Storage
      ↓
Persist storage reference
      ↓
Public content reads reference
```

---

## 21. Application Route Domains

Conceptual technical domains:

```text
Public
Admin
Events
Meta CAPI
```

Candidate routes may include:

```text
/
/admin/*
/api/events
```

`/api/events` is the only public tracking mutation boundary. Meta CAPI dispatch is an
internal module, not a public endpoint.

---

## 22. Rendering Strategy

### Public

Prefer:

- server rendering or cacheable server output where appropriate,
- minimal client JavaScript,
- client interaction only where needed.

### Admin

Interactive client-side components are acceptable.

Goal:

> Public page remains lighter than CMS.

---

## 23. Cache Boundaries

Potentially cacheable:

- public content,
- active campaign,
- products,
- branch mappings,
- secondary links.

Never cache as shared content:

- event writes,
- per-session attribution,
- admin mutations,
- sensitive authenticated state.

Exact cache mechanism remains implementation detail.

Every successful admin content mutation invalidates its relevant shared public cache.

---

## 24. Failure Isolation

### External Analytics Failure

If Meta Pixel / CAPI / GA4 / GTM fails:

```text
WhatsApp flow continues.
```

### Internal Event Persistence Failure

Log error and continue WhatsApp flow.

### Content Read Failure

Do not render unsafe/broken CTA.

### Media Failure

Text and actionable CTA should remain usable when possible.

---

## 25. Security Boundaries

### Client-safe

May include:

- public site content,
- public product/branch data,
- public analytics IDs.

### Server-only

Must include:

- Meta CAPI token,
- Supabase privileged/service credentials,
- privileged DB credentials,
- other secrets.

---

## 26. Database Access Principles

Domain writes:

```text
Authenticated/validated server layer
      ↓
Drizzle
      ↓
PostgreSQL
```

Public reads may use safe server/query paths.

Browser clients do not access application domain tables directly. Server domain
modules use Drizzle with a dedicated least-privilege application database role.
Enable RLS on tables exposed through Supabase APIs and deny `anon`/`authenticated`
direct domain-table access by default. Browser Supabase usage is limited to Auth and
approved Storage operations.

---

## 27. Privacy Architecture

P0 internal event storage may contain:

- anonymous_session_id,
- event_id,
- event_name,
- product,
- branch,
- page_url,
- UTM values,
- timestamp.

P0 does not intentionally collect internal:

- customer name,
- phone,
- email,
- address.

External and internal anonymous tracking follow approved consent state. `_fbp`,
`_fbc`, IP, and user-agent may be forwarded to Meta only when allowed and are never
stored in events or ordinary logs.

---

## 28. Observability

Minimum technical logging:

- server errors,
- event persistence failures,
- Meta CAPI failures,
- admin mutation failures.

Logs should use sanitized context.

Avoid unnecessary personal data.

---

## 29. Performance Architecture

Public page priorities:

- optimized assets,
- minimal blocking scripts,
- minimal JS,
- safe caching,
- fast first interaction,
- tracking that does not block primary CTA.

Launch targets on representative mobile throttling: p75 LCP <= 2.5 seconds, p75 INP
<= 200 milliseconds, p75 CLS <= 0.1, and WCAG 2.2 AA for public/admin interactions.

---

## 30. Environment Architecture

### Local

```text
Next.js Local
Supabase Local
Docker
```

### Preview / Staging

```text
Vercel Preview
Non-production data environment
Test analytics configuration
```

### Production

```text
Vercel Production
Supabase Production
Production tracking configuration
```

Production database is not the default development database.

The executable environment contract is maintained in `.env.example` and validated
through `src/lib/env`. Only allowlisted `NEXT_PUBLIC_*` identifiers may cross the
browser boundary. Database credentials, the Supabase secret key, Meta CAPI access,
rate-limit configuration, and the retention-job secret remain server-only. Staging
and production URLs require HTTPS, and a build fails with variable names only when
required configuration is absent or malformed.

---

## 31. Deployment Flow

Application:

```text
Git Push
   ↓
GitHub
   ↓
Vercel Build
   ↓
Preview
   ↓
QA
   ↓
Production
```

Database:

```text
Drizzle Migration
   ↓
Local Validation
   ↓
Non-production Validation
   ↓
Production Migration
```

Production migrations run in a separately approved deployment job, never implicitly
during Vercel build. Prefer backward-compatible expand/contract changes; application
rollback is allowed only while schema compatibility is preserved.

---

## 32. Architecture Non-Goals

P0 does not introduce:

- microservices,
- Kubernetes,
- Kafka,
- mandatory Redis,
- Elasticsearch,
- separate backend framework,
- event streaming platform,
- data warehouse,
- dedicated BI platform.

---

## 33. Future Extension Points

P1 may add:

- Lead entity,
- lead form,
- appointment,
- Schedule event.

P2 may add:

- Qualified Lead,
- CS integration,
- Purchase,
- Revenue,
- offline conversions,
- advanced reporting.

P0 architecture must not prematurely implement those features.

---

## 34. Source of Truth Boundaries

### UX & Information Architecture owns:

- visible user journey,
- page hierarchy,
- admin information hierarchy,
- user-facing behavior.

### System Architecture owns:

- runtime components,
- data flow,
- integration flow,
- security boundaries,
- reliability,
- infrastructure,
- deployment.

### Database Design owns:

- tables,
- columns,
- relations,
- indexes,
- constraints.

### API & Data Contract owns:

- endpoints,
- request/response schema,
- event payload contract.

This separation is intentional to avoid duplication.

---

## 35. Architecture Decision Summary

| Area | Decision |
|---|---|
| Architecture | Modular Monolith |
| App | Next.js + TypeScript |
| Hosting | Vercel |
| DB | Supabase PostgreSQL |
| ORM | Drizzle ORM |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Local Dev | Supabase Local + Docker |
| Browser Tracking | Meta Pixel + GTM → GA4 |
| Server Tracking | Meta CAPI |
| Internal Tracking | PostgreSQL |
| Product ↔ Branch | M:N |
| Session | Anonymous UUID cookie, rolling 30-minute journey |

---

## 36. Architecture Status

**Architecture Pattern:** LOCKED  
**Technology Boundaries:** LOCKED  
**Tracking Ownership:** LOCKED  
**Failure Isolation Principle:** LOCKED  
**Security Boundary:** LOCKED via ADR-002 and ADR-003  
**Database Schema:** LOCKED / NORMALIZED  
**API Contract:** LOCKED / NORMALIZED  
**Testing and Deployment Boundary:** LOCKED via ADR-005
