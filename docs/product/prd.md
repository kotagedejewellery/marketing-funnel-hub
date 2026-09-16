# Product Requirement Document (PRD) v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Baseline Final / Normalized by ADR-001 through ADR-005  
**Phase:** MVP / P0  
**Owner:** Product / Marketing  
**Last Reviewed:** 2026-09-15  
**Product:** Kotagede Jewellery

---

## 1. Product Overview

KGJ Custom Link Bio + Meta Tracking Hub adalah owned marketing conversion layer milik Kotagede Jewellery yang menggantikan fungsi utama Taplink, menangkap product interest, mengarahkan visitor ke WhatsApp branch yang relevan, mempertahankan campaign attribution, mengirim signal ke Meta/GA4, dan menyimpan first-party event internal.

**North Star:**  
`VISITOR → INTEREST → CONTACT → LEAD`

**P0 Scope:**  
`VISITOR → INTEREST → CONTACT / WHATSAPP`

---

## 2. Problem Statement

Current flow:

`Meta Ads / Instagram → Instagram Profile → Taplink → WhatsApp / CS → Closing Internal`

Gap:
- source/campaign context tidak selalu terbawa,
- product interest belum terstruktur,
- branch context belum menjadi bagian tracking yang konsisten,
- WhatsApp click belum menjadi signal bisnis yang kaya,
- Meta belum mendapatkan signal yang optimal.

---

## 3. Product Vision

Membangun:

> Owned first-party marketing conversion layer yang menghubungkan traffic source, product interest, branch, dan WhatsApp Contact.

Concept:

```text
Traffic
  ↓
KGJ Link Bio
  ↓
Product Interest
  ↓
WhatsApp Branch CTA
  ↓
Contact
```

Tracking layer:

```text
Meta Pixel
Meta CAPI
GA4
GTM
UTM Persistence
Internal Event Storage
```

---

## 4. Product Objectives

1. Replace Taplink.
2. Capture product intent.
3. Capture WhatsApp contact intent.
4. Preserve campaign attribution.
5. Improve Meta signal.
6. Build first-party data foundation.
7. Enable Marketing self-service.

---

## 5. Non-Goals P0

P0 bukan:
- CRM,
- lead scoring platform,
- marketing automation platform,
- data warehouse,
- enterprise dashboard,
- advanced attribution platform,
- sales management system,
- revenue tracking system.

---

## 6. User Roles

### Visitor / Customer
- membuka link bio,
- melihat product,
- memilih WhatsApp branch,
- memulai percakapan.

### Marketing / Admin
- mengelola content,
- product,
- branch,
- campaign,
- CTA,
- WhatsApp destination,
- mapping product-branch.

### Technical Admin / Developer
- setup,
- integration,
- maintenance.

---

## 7. Final Customer Journey

```text
Meta Ads / Instagram / Organic
              ↓
       Custom Link Bio KGJ
              ↓
        Browse Product
              ↓
          Product
              ↓
        ViewContent
              ↓
   WhatsApp CTA per Branch
              ↓
           Contact
              ↓
      WhatsApp Branch
```

---

## 8. Functional Requirements

### FR-01 — Public Link Bio
Harus:
- mobile-first,
- responsive,
- fast,
- branded,
- campaign banner,
- product listing,
- CTA WhatsApp per branch,
- social/secondary links.

### FR-02 — Product Management
Product minimum:
- id,
- name,
- slug,
- description,
- image,
- status,
- sort_order.

### FR-03 — Branch Management
Branch minimum:
- id,
- name,
- WhatsApp destination,
- status,
- sort_order.

### FR-04 — Product-Branch Assignment
Satu product dapat tersedia di banyak branch.

Relationship:
`Product M:N Branch`

### FR-05 — WhatsApp CTA
Setiap product menampilkan CTA hanya untuk branch yang aktif dan assigned.

Primary Contact P0 selalu memiliki product dan branch context. Generic branch-only
WhatsApp CTA tidak termasuk P0 tanpa perubahan schema/API yang disetujui.

Example:

```text
Wedding Ring

[Konsultasi Kotagede]
[Konsultasi Surabaya]
[Konsultasi Jakarta]
```

### FR-06 — Prefilled WhatsApp
Template configurable.

Default:

```text
Halo Kotagede Jewellery,
saya tertarik dengan {product}.
Mohon informasi lebih lanjut.
```

### FR-07 — Contact Tracking Without Blocking Navigation
Saat CTA WhatsApp diklik:
1. resolve product,
2. resolve branch,
3. resolve attribution,
4. generate event_id,
5. dispatch browser tracking sesuai consent,
6. kirim canonical Contact ke `/api/events` secara best-effort dengan `keepalive`,
7. biarkan normal WhatsApp anchor navigation berjalan tanpa menunggu tracking.

Tracking failure tidak boleh menghentikan WhatsApp.

### FR-08 — CMS
Marketing dapat mengelola:
- headline,
- banner,
- banner URL,
- product,
- product image,
- branch,
- WhatsApp number,
- product-branch mapping,
- CTA,
- prefilled message,
- campaign/promo,
- section order,
- active/inactive state,
- social links,
- additional links.

### FR-09 — Campaign Content
Minimum:
- campaign_name,
- banner,
- target_url,
- active_from,
- active_until,
- status.

CMS campaign tidak otomatis sama dengan `utm_campaign`.

Public page menampilkan maksimal satu eligible campaign banner. Jika periode campaign
overlap, pemilihan dilakukan secara deterministic sesuai Database Design.

### FR-10 — UTM Capture
Capture:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term

### FR-11 — Internal Event Storage
Store anonymous/pseudonymous event data.

### FR-12 — Anonymous Session
Session identifier menghubungkan journey PageView → ViewContent → Contact.

### FR-13 — Event ID
Unique `event_id` per logical event.

### FR-14 — GA4
GA4 termasuk P0.

### FR-15 — GTM
GTM termasuk P0.

### FR-16 — Meta
Meta Pixel + Meta CAPI termasuk P0.

---

## 9. Event Taxonomy

### PageView
Trigger: visitor opens Link Bio.

### ViewContent
Trigger: visitor opens/selects product.

### Contact
Trigger: visitor clicks WhatsApp CTA.

Branch bukan event terpisah.

---

## 10. Tracking Example

Incoming:

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign=wedding_september
utm_content=video_a
```

PageView:

```text
event_name = PageView
source = instagram
campaign = wedding_september
```

ViewContent:

```text
event_name = ViewContent
product_category = wedding_ring
campaign = wedding_september
```

Contact:

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

## 11. Privacy Model P0

Internal tracking hanya anonymous/pseudonymous.

External Meta/GA4 tracking dan internal anonymous events mengikuti approved consent
state. Tanpa consent yang sesuai, tracking terkait tetap nonaktif dan WhatsApp tetap
berfungsi.

### Store
- anonymous_session_id
- event_id
- event_name
- event_time
- page_url
- product_id/product_category
- branch_id
- CTA
- UTM context

### Do not store
- name
- customer WhatsApp
- email
- address
- lead personal data

---

## 12. CMS Authentication

CMS harus authenticated.

Tidak dibutuhkan pada P0:
- advanced RBAC,
- organization management,
- approval workflow,
- enterprise access control.

---

## 13. Content State

Minimum status:
- active
- inactive

Untuk:
- product,
- branch,
- banner,
- campaign,
- additional link.

---

## 14. Ordering

Marketing dapat mengatur `sort_order` untuk:
- product,
- sections,
- links bila relevan.

---

## 15. Performance Requirements

P0 harus:
- fast loading,
- optimized images,
- minimal blocking scripts,
- responsive WhatsApp interaction,
- analytics tidak mengganggu core journey.

Target launch pada representative mobile throttling:
- p75 LCP <= 2.5 detik,
- p75 INP <= 200 milidetik,
- p75 CLS <= 0.1.

Accessibility target: WCAG 2.2 AA untuk public journey dan admin forms.

---

## 16. Reliability Requirements

Jika:
- Meta unavailable,
- GA4 unavailable,
- internal analytics unavailable,

maka public site dan WhatsApp journey tetap berfungsi.

---

## 17. Security Baseline

Minimum:
- CMS authentication,
- CAPI token server-side only,
- secrets melalui environment configuration,
- no sensitive token in browser,
- CMS input validation,
- safe URL handling.

Detail security architecture ditentukan setelah stack dipilih.

---

## 18. Reporting / Measurement

P0 harus dapat menjawab:
- total visitors,
- traffic source,
- campaign,
- product interest,
- WhatsApp contacts,
- branch receiving contact,
- contact by campaign,
- contact by source.

---

## 19. Initial KPI

### Traffic
- Visitors
- PageViews

### Interest
- ViewContent
- Product Interest

### Conversion
- Contacts

### Derived
`Contact Rate = Contacts / Visitors`

Target numeric belum dikunci karena belum ada baseline historis yang disepakati.

---

## 20. Public Site Acceptance Criteria

- accessible from Instagram browser,
- mobile responsive,
- correct campaign content,
- active products visible,
- inactive products hidden,
- correct branch CTA,
- correct WhatsApp destination,
- correct prefilled message.

---

## 21. Tracking Acceptance Criteria

- PageView visible,
- ViewContent visible,
- Contact visible,
- product readable,
- branch readable pada Contact,
- source/campaign preserved,
- event_id consistent Pixel/CAPI,
- no unintended duplicate,
- internal event recorded,
- GA4 event recorded.

---

## 22. Canonical End-to-End Test

```text
Instagram Paid Campaign
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

Expected Contact context:

```text
Source = Instagram
Campaign = wedding_september
Content = video_a
Product = Wedding Ring
Branch = Surabaya
CTA = WhatsApp
```

---

## 23. Organic Test

```text
Instagram Organic
↓
KGJ Link Bio
↓
Wedding Ring
↓
WhatsApp Kotagede
```

Expected:
- PageView = yes
- ViewContent = yes
- Contact = yes
- Product = Wedding Ring
- Branch = Kotagede
- Campaign = null

---

## 24. Failure Scenarios

### Meta unavailable
WhatsApp tetap terbuka.

### GA4 unavailable
WhatsApp tetap terbuka.

### Internal analytics unavailable
WhatsApp tetap terbuka.

### Inactive branch
CTA tidak ditampilkan.

### Inactive product
Product tidak ditampilkan.

---

## 25. P0 Scope Summary

### Public
- KGJ Link Bio
- Campaign Banner
- Products
- WhatsApp Branch CTA
- Social / Secondary Links

### Admin
- Content
- Campaign
- Products
- Branches
- Product-Branch Mapping
- WhatsApp
- Prefilled Message
- Ordering
- Status

### Tracking
- Meta Pixel
- Meta CAPI
- GA4
- GTM
- Internal Events
- UTM Persistence
- Anonymous Session
- event_id Deduplication

---

## 26. P1 Backlog

- Lead Form
- Lead event
- Appointment
- Schedule event
- extended analytics/reporting

---

## 27. P2 Backlog

- Qualified Lead
- CS Integration
- Closing
- Purchase
- Revenue
- Offline Conversion
- Advanced Attribution
- Advanced Dashboard

---

## 28. Definition of Done

P0 selesai jika:

`Customer Journey + CMS + Tracking + Attribution + WhatsApp Routing + Meta Validation + GA4 Validation + Internal Event Validation`

semuanya lulus.

---

## 29. PRD Status

**Business Scope:** LOCKED  
**Customer Journey:** LOCKED  
**P0 Event Taxonomy:** LOCKED  
**WhatsApp Flow:** LOCKED  
**Product ↔ Branch Model:** LOCKED  
**Internal Tracking Policy:** LOCKED  
**Privacy Baseline:** LOCKED  
**P0/P1/P2 Boundary:** LOCKED

---

## 30. Implementation Readiness

UX/IA, Tech Stack, System Architecture, Database Design, API Contract, Detailed
Tracking Flow, Sprint Plan, dan ADR-001 sampai ADR-005 telah selesai dan diterima.

Current execution status is maintained exclusively in [`tasks/plan.md`](../../tasks/plan.md)
and [`tasks/todo.md`](../../tasks/todo.md); this product contract does not duplicate
the active task checklist.

Environment and provider owners must be assigned before work reaches local platform,
staging, production, migration, or provider-account operations.
