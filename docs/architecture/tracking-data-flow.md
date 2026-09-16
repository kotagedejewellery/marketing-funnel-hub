# Detailed Tracking Data Flow v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** FINAL / LOCKED / Normalized by ADR-002 through ADR-005  
**Phase:** MVP / P0  
**Owner:** Engineering  
**Last Reviewed:** 2026-09-15  
**Depends on:** Tracking & Conversion Specification v1.0, System Architecture v1.1, Database Design v1.0, API & Data Contract v1.0

---

## 1. Purpose

Dokumen ini menjadi source of truth untuk alur tracking end-to-end pada P0.

Dokumen ini menjelaskan:
- bagaimana session anonymous dibuat,
- bagaimana UTM ditangkap dan dipertahankan,
- bagaimana `PageView`, `ViewContent`, dan `Contact` dibentuk,
- bagaimana event dikirim ke internal event store,
- bagaimana event dikirim ke Meta Pixel,
- bagaimana event dikirim ke Meta Conversions API,
- bagaimana event dikirim ke GA4/GTM,
- bagaimana deduplication dilakukan,
- bagaimana failure tracking diisolasi agar tidak menghambat WhatsApp journey.

---

## 2. Tracking Principles

1. **Application is the canonical source of event state.**
2. **Few events, meaningful context.**
3. **Same logical event = same `event_id`.**
4. **Attribution is preserved, not invented.**
5. **Tracking failure must not block WhatsApp.**
6. **No PII customer is stored in P0.**
7. **Internal event storage is first-party and append-oriented.**

---

## 3. P0 Canonical Events

```text
PageView
ViewContent
Contact
```

Business meaning:

| Event | Meaning |
|---|---|
| PageView | Visitor membuka KGJ Link Bio |
| ViewContent | Visitor menunjukkan product interest |
| Contact | Visitor menekan CTA WhatsApp |

Branch tidak menghasilkan event tersendiri.

---

## 4. Session Initialization

Saat visitor membuka public Link Bio:

```text
Incoming request
      ↓
Check existing anonymous session
      ↓
If none → generate anonymous_session_id
      ↓
Persist first-party session context
      ↓
Read incoming UTM
```

Recommended identifier:

```text
UUID
```

Example:

```text
anonymous_session_id = "d7b0..."
```

Tidak digunakan untuk mengidentifikasi manusia secara nyata.

Canonical session policy:
- random UUID pada first-party `kgj_sid` cookie,
- `Secure` pada production, `SameSite=Lax`, `Path=/`,
- rolling 30-minute inactivity expiry,
- explicit UTM baru yang berbeda memulai journey ID baru,
- tidak ada fingerprinting atau cross-device identity.

---

## 5. Attribution Capture

Read from initial URL:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Example:

```text
?utm_source=instagram
&utm_medium=paid_social
&utm_campaign=wedding_september
&utm_content=video_a
```

Store in a signed first-party session cookie for the current journey.

---

## 6. Attribution Persistence Rule

Attribution should survive:

```text
Landing
→ Product interaction
→ WhatsApp CTA
```

Attribution values must not disappear between events.

If no UTM exists:
- keep null/omitted,
- do not fabricate campaign/source.

Attribution precedence:
1. First non-empty UTM starts journey attribution.
2. Empty/direct visits do not erase it.
3. A later landing with a different explicit UTM set starts a new journey.
4. Internal navigation never changes attribution.

---

## 7. PageView Flow

### Trigger

Valid load of KGJ Link Bio.

### Data Construction

```text
event_name = PageView
event_id = generated UUID
anonymous_session_id = current session
event_time = current timestamp
page_url = current URL
UTM = current attribution if available
```

### Flow

```text
Page Load
   ↓
Build PageView
   ↓
Generate event_id
   ↓
Push consented browser tracking
   ├─ Meta Pixel
   └─ GTM → GA4
   ↓
Best-effort keepalive POST /api/events
   ├─ Persist internally
   └─ Meta CAPI
```

When Meta tracking is enabled by consent, PageView is sent through both Pixel and
CAPI with the same `event_id`.

---

## 8. ViewContent Flow

### Trigger

Visitor opens/selects a product.

Example:

```text
Wedding Ring
```

### Data Construction

```text
event_name = ViewContent
event_id = generated UUID
anonymous_session_id = current session
product_id = selected product
product_category = selected product slug
branch = null
attribution = current session attribution
```

### Flow

```text
Product selected
      ↓
Resolve product context
      ↓
Generate event_id
      ↓
Push consented browser tracking
      ├─ Meta Pixel ViewContent
      └─ GTM → GA4
      ↓
Best-effort keepalive POST /api/events
      ├─ Persist internal ViewContent
      └─ Meta CAPI ViewContent
```

No branch event is emitted.

---

## 9. Contact Flow

### Trigger

Visitor clicks a branch WhatsApp CTA.

Example:

```text
Wedding Ring
→ WhatsApp Surabaya
```

### Data Construction

```text
event_name = Contact
event_id = generated UUID
anonymous_session_id = current session
product_id = Wedding Ring
product_category = wedding_ring
branch_id = Surabaya
branch_name = Surabaya
cta = whatsapp
attribution = current session attribution
```

---

## 10. Contact Critical Sequence

Canonical sequence:

```text
User taps WhatsApp CTA
        ↓
Resolve Product
        ↓
Resolve Branch
        ↓
Resolve Attribution
        ↓
Generate Contact event_id
        ↓
Push consented browser Contact events
        ↓
Best-effort keepalive POST /api/events
        ↓
Normal WhatsApp anchor navigation continues immediately
```

The CTA is a normal anchor containing the final validated `wa.me` URL. JavaScript
must not call `preventDefault`, await tracking, or replace navigation with an
interstitial. The server event request attempts internal persistence first and then
bounded Meta CAPI dispatch, but the browser never waits for either.

---

## 11. WhatsApp Reliability Rule

Critical invariant:

```text
Tracking failure ≠ WhatsApp failure
```

Examples:

- Meta Pixel blocked → WhatsApp still opens
- CAPI timeout → WhatsApp still opens
- GA4 fails → WhatsApp still opens
- Internal event insert fails → WhatsApp still opens

Tracking failures should be logged for technical review.

---

## 12. Contact Persistence Strategy

Recommended:

1. Build one canonical Contact and event ID in the click handler.
2. Push consented Pixel and GTM events synchronously.
3. Issue `POST /api/events` using best-effort `fetch(..., { keepalive: true })`.
4. Let the anchor open WhatsApp normally without waiting.

P0 delivery is explicitly best-effort; it does not introduce a durable queue.

---

## 13. Meta Pixel Flow

Browser event receives canonical application state.

Example Contact payload concept:

```text
event_name = Contact
event_id = EVT123
product_category = wedding_ring
branch = surabaya
cta = whatsapp
campaign = wedding_september
```

Meta Pixel should not independently derive product or branch from DOM text where application state is already available.

---

## 14. Meta CAPI Flow

`POST /api/events` invokes an internal server-only Meta CAPI module after validation.
There is no unrestricted public `/api/meta/capi` endpoint.

```text
Canonical PageView / ViewContent / Contact
      ↓
Validated server handler
      ↓
Map to Meta CAPI
      ↓
Send using server token
      ↓
Log success/failure
```

Meta token remains server-side.

---

## 15. Meta Deduplication

Browser and server pair:

```text
Meta Pixel:
Contact
event_id = EVT123

Meta CAPI:
Contact
event_id = EVT123
```

Deduplication contract:
- same event name,
- same event ID.

Never generate a separate CAPI event ID for the same logical event.

---

## 16. GTM Data Layer

Recommended application push:

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

Recommended event keys:

```text
kgj_page_view
kgj_view_content
kgj_contact
```

---

## 17. GA4 Flow

GTM consumes application data layer and sends GA4 events.

Locked mapping:

| Canonical Event | GA4 |
|---|---|
| PageView | page_view |
| ViewContent | view_item |
| Contact | contact |

GA4 is dispatched through GTM only. Do not send an independent direct `gtag` event.

---

## 18. Internal Event Persistence

Endpoint concept:

```text
POST /api/events
```

Flow:

```text
Canonical event
      ↓
Zod validation
      ↓
Resolve authoritative product/branch context
      ↓
Check event_id idempotency
      ↓
Drizzle
      ↓
PostgreSQL events
```

An equivalent duplicate `event_id` reuses the existing event. The same ID with a
materially different canonical payload returns `409 Conflict` and never overwrites.

---

## 19. Event Snapshot Strategy

At event time store:

```text
product_id
product_category
branch_id
branch_name
```

Reason:
- preserve historical context,
- names may change later.

---

## 20. Page URL Strategy

Store:
- current event page URL.

Recommended:
- exclude unnecessary fragment data if not meaningful,
- avoid storing secrets,
- allow only the configured public origin in production,
- retain only approved attribution query fields when query data is needed.

If URLs can contain sensitive values in future phases, sanitization rules must be added.

---

## 21. Attribution Normalization

Raw fields:

```text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

Optional normalized fields:

```text
source
campaign
```

Example:

```text
utm_source = instagram
source = instagram
```

Do not over-normalize P0.

---

## 22. Organic Traffic Handling

Example:

```text
Instagram Organic
→ no UTM
```

Expected:

```text
campaign = null
utm_campaign = null
```

Still track:
- PageView
- ViewContent
- Contact

with available product/branch context.

---

## 23. Direct Traffic Handling

Direct visit:

```text
source = null
campaign = null
```

No fabricated attribution values.

---

## 24. Event Time

Canonical event time should be generated as close to the user action as possible.

Store:
```text
timestamptz
```

Internal DB timestamp `created_at` is not a replacement for `event_time`.

---

## 25. Idempotency

`event_id` is the canonical idempotency key.

Internal insert:
- equivalent duplicate event ID → reuse existing event,
- conflicting duplicate event ID → `409 Conflict`, no overwrite.

External retry:
- preserve same event ID.

---

## 26. Retry Behavior

### Internal event write
Limited retry allowed.

### Meta CAPI
Retry a transient server/network error at most once within the bounded request
lifetime, preserving the same event ID.

### Browser analytics
No complex retry required in P0.

P0 delivery is best-effort. Do not introduce queue infrastructure unless measured
loss or a new delivery guarantee justifies it.

---

## 27. Timeout Policy

External tracking should use short timeouts.

WhatsApp CTA should not wait several seconds for analytics.

Exact timeout values are implementation configuration.

---

## 28. Error Logging

Log at minimum:

```text
event_id
provider
error_type
timestamp
sanitized context
```

Providers:
- internal
- meta_capi
- ga4/gtm if server-observable

No unnecessary PII.

`_fbp`, `_fbc`, IP, user-agent, cookies, tokens, and full provider payloads are not
written to ordinary logs.

### 28.1 Privacy and Consent

- Meta Pixel, Meta CAPI, GTM, GA4, and internal anonymous events follow approved
  consent state.
- Without applicable consent, those destinations remain disabled and WhatsApp still
  works.
- `_fbp`, `_fbc`, request IP, and user-agent may be forwarded to Meta only when the
  approved consent policy allows it.
- Those matching values are transport-only and are not stored in `events` or logs.

---

## 29. Contact Example — Full Flow

Incoming:

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign=wedding_september
utm_content=video_a
```

Visitor selects:

```text
Wedding Ring
```

System emits:

```text
ViewContent
product_category = wedding_ring
```

Visitor clicks:

```text
WhatsApp Surabaya
```

System constructs:

```json
{
  "eventId": "EVT-CONTACT-001",
  "eventName": "Contact",
  "anonymousSessionId": "SESSION-001",
  "product": {
    "category": "wedding_ring"
  },
  "branch": {
    "name": "Surabaya"
  },
  "cta": "whatsapp",
  "attribution": {
    "source": "instagram",
    "utmSource": "instagram",
    "utmMedium": "paid_social",
    "utmCampaign": "wedding_september",
    "utmContent": "video_a"
  }
}
```

Then:

```text
Internal event stored
+
Meta Pixel Contact
+
Meta CAPI Contact
+
GTM / GA4 Contact
+
WhatsApp opens
```

---

## 30. Test Matrix

### T01 — Paid Campaign PageView
Expected:
- PageView internal
- UTM stored
- Meta browser event visible
- GA4 event visible

### T02 — Product View
Expected:
- ViewContent internal
- product context correct
- campaign preserved

### T03 — WhatsApp Contact
Expected:
- Contact internal
- correct branch
- correct product
- correct UTM
- Meta Pixel + CAPI same event ID
- WhatsApp opens

### T04 — Organic Contact
Expected:
- Contact tracked
- campaign null
- product/branch retained

### T05 — Meta CAPI Failure
Expected:
- WhatsApp still opens
- error logged

### T06 — Internal Event Failure
Expected:
- WhatsApp still opens
- technical error logged

### T07 — Duplicate Event Retry
Expected:
- internal event not duplicated

---

## 31. Tracking Acceptance Criteria

Tracking P0 is ready when:

```text
✓ PageView works
✓ ViewContent works
✓ Contact works
✓ Product context correct
✓ Branch context correct on Contact
✓ UTM persists
✓ Organic traffic remains valid
✓ event_id deduplication works
✓ Meta Pixel works
✓ Meta CAPI works
✓ GA4/GTM works
✓ Internal event storage works
✓ WhatsApp is not blocked by tracking failure
```

---

## 32. Tracking Non-Goals

P0 does not track:
- Lead
- Schedule
- Purchase
- revenue
- customer identity
- cross-device identity
- advanced attribution modeling
- offline conversion outcome

---

## 33. Tracking Status

**Session Model:** LOCKED  
**UTM Capture:** LOCKED  
**Attribution Persistence:** LOCKED  
**PageView Flow:** LOCKED  
**ViewContent Flow:** LOCKED  
**Contact Flow:** LOCKED  
**Meta Deduplication:** LOCKED  
**Internal Event Flow:** LOCKED  
**WhatsApp Failure Isolation:** LOCKED  
**Detailed Tracking Data Flow v1.0:** FINAL
