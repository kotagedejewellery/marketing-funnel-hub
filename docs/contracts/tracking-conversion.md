# Tracking & Conversion Specification v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Final / Locked / Normalized by ADR-003 and ADR-004  
**Phase:** MVP / P0  
**Owner:** Product / Marketing and Engineering  
**Last Reviewed:** 2026-09-15

---

## 1. Tracking Philosophy

Gunakan sedikit event, tetapi setiap event harus memiliki arti bisnis yang jelas.

**Principle:**  
`Few events, meaningful context.`

Hindari event seperti:
- ClickWeddingRingSurabaya
- ClickWhatsappJakarta
- ClickPromoSeptember

Gunakan standard event + context parameter.

---

## 2. P0 Event Taxonomy

### 2.1 PageView

**Business Meaning:** Visitor membuka KGJ Custom Link Bio.

**Trigger:** valid initial page load.

**Recommended Parameters:**
- event_id
- event_time
- page_url
- source
- campaign
- UTM values jika tersedia

Pada P0, Product dan Branch context wajib untuk Contact.

---

### 2.2 ViewContent

**Business Meaning:** Visitor menunjukkan interest terhadap product/category.

**Locked Trigger:** visitor membuka atau memilih product.

Branch **tidak menghasilkan ViewContent terpisah**.

**Recommended Parameters:**
- event_id
- event_time
- page_url
- product_category
- source
- campaign
- UTM values jika tersedia

---

### 2.3 Contact

**Business Meaning:** Visitor menunjukkan contact intent melalui CTA WhatsApp.

**Locked Trigger:** click WhatsApp CTA.

**Required Behavior:** event dibentuk saat click dan dikirim secara best-effort tanpa
menunggu atau mengubah normal WhatsApp navigation.

**Recommended Parameters:**
- event_id
- event_time
- page_url
- cta
- branch
- product_category
- source
- campaign
- UTM values jika tersedia

---

## 3. P1 Events

### Lead
Trigger: valid lead form successfully submitted.

### Schedule
Trigger: appointment successfully created.

---

## 4. P2 Event

### Purchase
Trigger: verified closing / transaction / revenue event.

---

## 5. Canonical Parameter Dictionary

| Parameter | Function | P0 |
|---|---|---|
| event_name | Nama event | Required |
| event_time | Timestamp | Required |
| event_id | Deduplication identifier | Required |
| page_url | Event page | Required |
| anonymous_session_id | Session correlation | Required internal |
| cta | CTA context | Contextual |
| branch | Branch context | Contact contextual |
| product_category | Product/category | Contextual |
| campaign | Campaign context | Contextual |
| source | Traffic source | Contextual |
| utm_source | UTM source | If available |
| utm_medium | UTM medium | If available |
| utm_campaign | UTM campaign | If available |
| utm_content | UTM content | If available |
| utm_term | UTM term | If available |

Canonical technical naming menggunakan `product_category`, bukan `product/category`.

---

## 6. Context State

Sepanjang session, sistem mempertahankan context:

- source
- campaign
- content
- product_category
- branch
- cta

Example:

```text
Incoming:
utm_source=instagram
utm_medium=paid_social
utm_campaign=wedding_september
utm_content=video_a

Product:
Wedding Ring

CTA:
WhatsApp Surabaya
```

Final Contact:

```text
event_name = Contact
product_category = wedding_ring
branch = surabaya
cta = whatsapp
source = instagram
campaign = wedding_september
content = video_a
```

---

## 7. UTM Persistence

Minimum fields:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term

Rules:
1. Dibaca saat entry.
2. First non-empty UTM memulai attribution journey.
3. Direct/empty visit tidak menghapus attribution aktif.
4. Explicit UTM baru yang berbeda memulai journey baru.
5. Dipertahankan selama rolling 30-minute anonymous journey.
6. Diteruskan ke relevant events.
7. Tidak dibuat data attribution palsu jika tidak tersedia.

Example:
Jika visitor organic dan `utm_campaign` tidak tersedia, maka field di-omit atau null.

---

## 8. Branch Context Rule

Branch bukan event tersendiri.

Branch diketahui ketika visitor memilih CTA WhatsApp milik branch tertentu.

Example:

```text
Wedding Ring

[WhatsApp Kotagede]
[WhatsApp Surabaya]
```

Jika visitor klik Surabaya:

```text
Contact
product_category = wedding_ring
branch = surabaya
cta = whatsapp
```

---

## 9. Product ↔ Branch Tracking Model

Satu product dapat memiliki banyak branch.

Relationship:
`Product M:N Branch`

Tracking Contact selalu mengambil:
- product context
- selected CTA branch context
- current attribution context

---

## 10. event_id & Meta Deduplication

Setiap logical event menghasilkan satu unique `event_id`.

Jika event yang sama dikirim melalui:
- Meta Pixel/browser
- Meta CAPI/server

maka keduanya harus menggunakan `event_id` yang sama.

Example:

```text
Browser:
event_name = Contact
event_id = EVT123

Server:
event_name = Contact
event_id = EVT123
```

---

## 11. WhatsApp Click Sequence

Canonical flow:

```text
User Click WhatsApp
        ↓
Resolve Product
        ↓
Resolve Branch
        ↓
Resolve Attribution
        ↓
Generate event_id
        ↓
Push consented browser events
        ↓
Best-effort keepalive POST /api/events
        ↓
Normal WhatsApp anchor navigation continues immediately
```

**Critical UX Rule:**  
Tracking failure tidak boleh menjadi customer journey failure.

Jika Meta, GA4, atau internal analytics bermasalah, WhatsApp tetap harus dibuka.

Jangan menggunakan `preventDefault`, interstitial, atau await tracking pada CTA.

---

## 12. Prefilled WhatsApp Message

WhatsApp menggunakan configurable prefilled message.

Default:

```text
Halo Kotagede Jewellery,
saya tertarik dengan {product}.
Mohon informasi lebih lanjut.
```

Allowed variables awal:
- `{product}`
- `{branch}`

Jangan tampilkan raw tracking parameters kepada customer.

---

## 13. Internal First-Party Event Storage

Internal storage diaktifkan pada P0.

Purpose:
- first-party data ownership,
- cross-check analytics,
- future reporting,
- P1/P2 foundation.

Bukan data warehouse.

### Stored
- anonymous_session_id
- event_id
- event_name
- event_time
- page_url
- product_id/product_category
- branch_id
- cta
- UTM context

### Not Stored
- name
- customer WhatsApp
- email
- address
- personal lead data

---

## 14. Anonymous Session

Setiap visitor memiliki anonymous/pseudonymous session identifier.

Purpose:
- menghubungkan PageView → ViewContent → Contact dalam satu journey.

Session ID tidak digunakan sebagai customer identity.

Canonical P0 policy:
- random UUID dalam first-party `kgj_sid` cookie,
- `Secure` pada production, `SameSite=Lax`, `Path=/`,
- rolling expiry 30 menit sejak activity terakhir,
- tidak menggunakan fingerprinting atau cross-device identity.

---

## 15. P0 Event Matrix

| Event | Trigger | Product | Branch | CTA | Attribution |
|---|---|---|---|---|---|
| PageView | Link Bio opened | No | No | No | Yes |
| ViewContent | Product viewed/selected | Yes | No | No | Yes |
| Contact | WhatsApp CTA clicked | Yes | Yes | Yes | Yes |

## 15.1 Consent and Provider Dispatch

- Meta Pixel, Meta CAPI, GTM, dan GA4 mengikuti approved consent state.
- GA4 dikirim melalui GTM saja; tidak ada independent direct `gtag` event path.
- PageView, ViewContent, dan Contact dikirim ke Meta CAPI ketika Meta tracking aktif.
- Browser dan server pair selalu menggunakan event name dan event ID yang sama.
- `_fbp`, `_fbc`, IP, dan user-agent bersifat transport-only jika consent mengizinkan
  dan tidak disimpan di event atau ordinary application logs.

---

## 16. Example Paid Campaign Journey

Incoming:

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign=wedding_september
utm_content=video_a
```

### PageView

```text
event_name = PageView
source = instagram
campaign = wedding_september
```

### ViewContent

```text
event_name = ViewContent
product_category = wedding_ring
campaign = wedding_september
```

### Contact

```text
event_name = Contact
product_category = wedding_ring
branch = surabaya
cta = whatsapp
source = instagram
campaign = wedding_september
content = video_a
```

Then:
`Redirect → WhatsApp Surabaya`

---

## 17. Organic Journey

Jika visitor datang tanpa campaign:

```text
PageView
→ Wedding Ring
→ WhatsApp Kotagede
```

Expected:

```text
PageView = tracked
ViewContent = tracked
Contact = tracked
product_category = wedding_ring
branch = kotagede
campaign = null
```

---

## 18. Conversion Definitions

| Stage | Canonical Definition |
|---|---|
| Visitor | PageView |
| Interest | ViewContent |
| Contact | WhatsApp CTA click |
| Lead | Contact information submitted |
| Schedule | Appointment created |
| Purchase | Verified transaction |

---

## 19. Tracking Stack P0

- Meta Pixel
- Meta Conversions API
- Google Tag Manager
- Google Analytics 4
- Internal First-Party Event Storage

Implementation detail akan ditentukan pada Tech Stack & Architecture.

---

## 20. Tracking Acceptance Criteria

P0 tracking dinyatakan valid jika:
- PageView visible,
- ViewContent visible,
- Contact visible,
- product context readable,
- branch readable pada Contact,
- source/campaign preserved,
- event_id consistent Pixel/CAPI,
- no unintended duplicate,
- internal event stored,
- GA4 event visible,
- WhatsApp redirect tetap berjalan meski analytics failure.

---

## 21. Status

**Event Taxonomy:** LOCKED  
**ViewContent Rule:** LOCKED  
**Branch Context Rule:** LOCKED  
**UTM Persistence:** LOCKED  
**event_id Strategy:** LOCKED  
**Internal Event Storage:** LOCKED  
**Privacy Tracking Model:** LOCKED  
**WhatsApp Tracking Sequence:** LOCKED
