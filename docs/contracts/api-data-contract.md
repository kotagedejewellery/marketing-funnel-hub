# API & Data Contract v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** FINAL / Normalized by ADR-001 through ADR-005  
**Phase:** MVP / P0  
**Owner:** Engineering  
**Last Reviewed:** 2026-09-15  
**Architecture:** Next.js Modular Monolith  
**Validation:** Zod  
**Database Access:** Drizzle ORM  
**Depends on:** Database Design v1.0 FINAL

---

## 1. API Goals

API P0 harus:

- sederhana,
- server-side validated,
- tidak mengekspos secrets,
- mendukung public content,
- mendukung CMS mutations,
- menerima canonical events,
- mengirim Meta CAPI,
- menjaga WhatsApp flow tetap berjalan jika tracking gagal.

---

## 2. API Style

Use HTTP JSON endpoints where an explicit API boundary is useful.

Recommended:

```text
/api/public/config
/api/events
/api/admin/*
```

Admin CRUD may also use Next.js Server Actions where appropriate.

Important:

> API Contract defines data shape and behavior; implementation may use Route Handlers or Server Actions as long as the contract remains consistent.

---

## 3. Public Configuration Endpoint

### GET `/api/public/config`

Purpose:
- provide active public Link Bio configuration if client-side fetch is required.

Recommended response:

```json
{
  "site": {
    "siteName": "Kotagede Jewellery",
    "headline": "string",
    "introduction": "string",
    "logoUrl": "string|null"
  },
  "campaign": {
    "id": "uuid",
    "title": "string",
    "description": "string|null",
    "bannerUrl": "string|null",
    "targetUrl": "string|null"
  },
  "products": [
    {
      "id": "uuid",
      "name": "Wedding Ring",
      "slug": "wedding-ring",
      "description": "string|null",
      "imageUrl": "string|null",
      "branches": [
        {
          "id": "uuid",
          "name": "Surabaya",
          "slug": "surabaya",
          "ctaLabel": "Konsultasi Surabaya",
          "whatsappUrl": "https://wa.me/..."
        }
      ]
    }
  ],
  "links": [],
  "sections": []
}
```

Note:
- Server-rendered public page may not need this endpoint at runtime.
- Contract remains useful as an internal DTO boundary.
- `campaign` is `null` when no campaign is eligible.
- At most one eligible campaign is returned using Database Design ordering.
- Only active products, active assignments, active branches, links, and sections are
  returned in deterministic sort order.

---

## 4. Canonical Event Contract

All tracking consumers should derive from one canonical event shape.

```json
{
  "eventId": "string",
  "eventName": "PageView | ViewContent | Contact",
  "eventTime": "ISO-8601 timestamp",
  "anonymousSessionId": "string",
  "pageUrl": "string|null",
  "product": {
    "id": "uuid|null",
    "category": "string|null"
  },
  "branch": {
    "id": "uuid|null",
    "name": "string|null"
  },
  "cta": "string|null",
  "attribution": {
    "source": "string|null",
    "campaign": "string|null",
    "utmSource": "string|null",
    "utmMedium": "string|null",
    "utmCampaign": "string|null",
    "utmContent": "string|null",
    "utmTerm": "string|null"
  },
  "metadata": {}
}
```

Rules:
- `eventId` required
- `eventName` required
- `eventTime` required
- `anonymousSessionId` required
- unknown attribution fields must be null/omitted, never fabricated

Event-specific discriminated-union rules:
- PageView: product, branch, and CTA are null.
- ViewContent: product ID/category required; branch and CTA are null.
- Contact: product ID/category, branch ID/name, and `cta = whatsapp` required.

---

## 5. Event Ingestion Endpoint

### POST `/api/events`

Purpose:
- validate canonical event,
- persist first-party event,
- trigger consented downstream Meta CAPI processing through an internal module.

Boundary rules:
- maximum request body = 32 KiB,
- `metadata` maximum serialized size = 4 KiB,
- validate UUIDs, timestamp skew, field lengths, and page URL origin,
- resolve product slug/name and branch name from submitted IDs,
- validate Contact against an active Product-Branch assignment,
- never allow client display values to override server-resolved context.

Request:

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

Success:

```json
{
  "ok": true,
  "eventId": "EVT123"
}
```

Idempotency behavior:
- duplicate `eventId` should not create a second canonical internal event.
- equivalent duplicate payload returns success with `duplicate: true`.
- materially conflicting duplicate payload returns `409 Conflict`.

Recommended response for duplicate:

```json
{
  "ok": true,
  "eventId": "EVT123",
  "duplicate": true
}
```

---

## 6. PageView Contract

Required:

```text
eventId
eventName = PageView
eventTime
anonymousSessionId
```

Optional:
- pageUrl
- attribution

Product and branch normally null.

---

## 7. ViewContent Contract

Required:

```text
eventId
eventName = ViewContent
eventTime
anonymousSessionId
product.id or product.category
```

Branch must not be required.

Canonical P0 meaning:
- product interest.

---

## 8. Contact Contract

Required:

```text
eventId
eventName = Contact
eventTime
anonymousSessionId
cta = whatsapp
branch.id or branch.name
product.id or product.category
```

Recommended:
- attribution context if available

Contact means:
- WhatsApp CTA click / contact intent.

---

## 9. Meta CAPI Internal Module

Meta CAPI is a server-only module invoked by `POST /api/events`; it is not an
unrestricted public HTTP endpoint in P0.

Purpose:
- map canonical event → Meta CAPI payload.

Should not accept unrestricted arbitrary public payload without validation.

Internal input:
- canonical event

Output:

```json
{
  "ok": true,
  "eventId": "EVT123",
  "provider": "meta"
}
```

Failure:

```json
{
  "ok": false,
  "eventId": "EVT123",
  "provider": "meta",
  "errorCode": "META_CAPI_ERROR"
}
```

Critical:
- Meta failure must not block WhatsApp redirect.

---

## 10. Meta Mapping

Canonical:

```text
PageView    → Meta PageView
ViewContent → Meta ViewContent
Contact     → Meta Contact
```

Browser + server duplicate pair:

```text
same eventName
same eventId
```

for Meta deduplication.

---

## 11. GA4 Mapping

Locked GA4 event names:

```text
page_view
view_item
contact
```

Important:
- canonical business event remains the application source of truth.
- GA4 naming may differ from Meta naming.
- GA4 dispatch occurs through GTM only; do not send a second direct `gtag` event.

---

## 12. GTM Data Layer Contract

Recommended:

```javascript
{
  event: "kgj_contact",
  event_id: "EVT123",
  anonymous_session_id: "SESSION123",
  product_category: "wedding_ring",
  branch: "surabaya",
  cta: "whatsapp",
  utm_source: "instagram",
  utm_medium: "paid_social",
  utm_campaign: "wedding_september",
  utm_content: "video_a"
}
```

Equivalent patterns:

```text
kgj_page_view
kgj_view_content
kgj_contact
```

GTM consumes canonical application state; it should not invent product/branch values independently.

---

## 13. WhatsApp Link Contract

Canonical URL:

```text
https://wa.me/{normalized_number}?text={url_encoded_message}
```

Number must be normalized.

Example:

```text
628123456789
```

Message resolution priority:

```text
product_branches.whatsapp_message_template
→ site_settings.default_whatsapp_message
```

Supported variables:

```text
{product}
{branch}
```

---

## 14. Admin Authentication Contract

Admin APIs/actions require authenticated Supabase session.

Unauthorized behavior:

```http
401 Unauthorized
```

Inactive admin:

```http
403 Forbidden
```

Role permissions:
- `admin`: content, campaign, product, branch, assignment, link, settings, media,
  and internal tracking-validation access.
- `technical_admin`: all admin permissions plus admin-profile provisioning/
  deactivation and technical diagnostics.

Provider secrets remain environment-only and are never returned to either role.

---

## 15. Product Admin Contract

Conceptual operations:

```text
Create Product
Update Product
Activate/Deactivate Product
Reorder Products
Assign Branches
```

Example create payload:

```json
{
  "name": "Wedding Ring",
  "slug": "wedding-ring",
  "description": "string|null",
  "imagePath": "string|null",
  "isActive": true,
  "sortOrder": 0
}
```

---

## 16. Branch Admin Contract

Example payload:

```json
{
  "name": "Surabaya",
  "slug": "surabaya",
  "whatsappNumber": "628123456789",
  "ctaLabel": "Konsultasi Surabaya",
  "isActive": true,
  "sortOrder": 0
}
```

Validation:
- normalized WhatsApp number required when active.

---

## 17. Product-Branch Assignment Contract

Example payload:

```json
{
  "productId": "uuid",
  "branchId": "uuid",
  "ctaLabel": "Konsultasi Surabaya",
  "whatsappMessageTemplate": "Halo Kotagede Jewellery, saya tertarik dengan {product} melalui cabang {branch}.",
  "isActive": true,
  "sortOrder": 0
}
```

Uniqueness:

```text
productId + branchId
```

---

## 18. Campaign Contract

Example:

```json
{
  "name": "Wedding September",
  "title": "Wedding Ring September",
  "description": "string|null",
  "bannerPath": "string|null",
  "targetUrl": "string|null",
  "activeFrom": "ISO timestamp|null",
  "activeUntil": "ISO timestamp|null",
  "isActive": true,
  "sortOrder": 0
}
```

Validation:
- `activeUntil > activeFrom` when both exist.

---

## 19. Link Contract

```json
{
  "label": "Instagram",
  "url": "https://...",
  "linkType": "social",
  "platform": "instagram",
  "iconKey": "instagram",
  "isActive": true,
  "sortOrder": 0
}
```

Allowed `linkType`:

```text
secondary
social
```

---

## 20. Site Settings Contract

Example:

```json
{
  "siteName": "Kotagede Jewellery",
  "headline": "string",
  "introduction": "string",
  "logoPath": "string|null",
  "defaultWhatsappMessage": "Halo Kotagede Jewellery, saya tertarik dengan {product}.",
  "defaultCtaLabel": "Konsultasi via WhatsApp",
  "privacyUrl": "string|null"
}
```

Social and secondary destinations use the Link Contract only.

---

## 21. Error Contract

Standard error response:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "fields": {}
  }
}
```

Recommended codes:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
META_CAPI_ERROR
```

HTTP mapping:
- 400 malformed JSON,
- 401 unauthenticated,
- 403 unauthorized/inactive profile,
- 404 not found,
- 409 state or idempotency conflict,
- 422 domain validation,
- 429 rate limited,
- 500 sanitized internal failure.

---

## 22. Idempotency

Canonical event ingestion uses `eventId` as idempotency key.

Equivalent retry returns the existing event. A retry with the same ID and materially
different canonical payload returns `409 Conflict` and never overwrites the event.

Admin writes use normal database constraints and authenticated mutation semantics.

---

## 23. Rate Limiting

Recommended for public mutation endpoints:

```text
/api/events
```

Purpose:
- prevent spam,
- reduce event DB abuse.

Exact limits depend on expected traffic and are implementation configuration, not locked here.

Apply per-IP and global burst limiting at the deployment edge. Validation and the
database unique constraint remain mandatory. Do not add Redis solely for this P0
control.

---

## 24. Input Validation

Use Zod for:

- event payloads,
- product payloads,
- branch payloads,
- campaign payloads,
- settings,
- URLs,
- WhatsApp number normalization.

---

## 25. URL Validation

Admin-provided URLs must:
- use allowed web protocols,
- reject unsafe malformed values.

Recommended accepted protocols:
- `https` in production,
- `http` only for explicit localhost development.

---

## 26. API Security

Never send to client:
- Meta CAPI access token,
- Supabase service-role key,
- privileged DB secrets.

Public analytics IDs may be exposed where technically required.

External Meta/GA4 and internal anonymous tracking follow approved consent state.
`_fbp`, `_fbc`, IP, and user-agent may be forwarded to Meta only when allowed; they
are transport-only and must not be stored in events or ordinary logs.

---

## 27. Audit Contract

Admin mutations to important entities should write `audit_logs`.

Recommended actions:

```text
create
update
activate
deactivate
assign
unassign
```

Store sanitized change diff only.

---

## 28. Retention Contract

Internal event records are retained for:

```text
24 months
```

An authenticated scheduled server job removes expired rows in bounded batches and
logs only counts/status. It is staging-tested before production activation.

Implementation scheduling is defined in implementation plan.

---

## 29. API Non-Goals

P0 API does not expose:

```text
customers
leads
appointments
sales
orders
payments
revenue
```

These belong to future phases.

---

## 30. API Contract Status

**Public Config DTO:** LOCKED  
**Canonical Event Shape:** LOCKED  
**PageView Contract:** LOCKED  
**ViewContent Contract:** LOCKED  
**Contact Contract:** LOCKED  
**WhatsApp Contract:** LOCKED  
**Admin Domain Contracts:** LOCKED  
**Meta CAPI Boundary:** LOCKED  
**Error Shape:** LOCKED  
**Retention:** LOCKED at 24 months

---

## 31. Next Stage

Detailed Tracking Data Flow and the delivery roadmap are complete and normalized.
Runtime versions and the minimal application shell are also complete. Next:

1. Configure the styling foundation under T0-04 after explicit authorization.
2. Define the environment contract and test harnesses under T0-05 and T0-06.
3. Assign environment and provider owners before external-service work begins.
4. Implement API behavior only in the sprint that owns the relevant domain feature.
