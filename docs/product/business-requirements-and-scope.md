# Business Requirement & Scope Lock v1.0
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Final / Locked / Normalized by ADR-003 and ADR-004  
**Phase:** MVP / P0  
**Owner:** Product / Marketing  
**Last Reviewed:** 2026-09-15  
**Source:** KGJ Developer Execution Brief v1.0 + business decisions confirmed in discussion

---

## 1. Product Definition

**Product Name:** KGJ Custom Link Bio + Meta Tracking Hub

**Primary Goal:** Menggantikan Taplink dengan link bio milik Kotagede Jewellery yang:
- mobile-first dan cepat,
- dapat dikelola Marketing tanpa deployment developer,
- mampu membaca minat visitor terhadap produk,
- mampu mengarahkan visitor ke WhatsApp branch yang tepat,
- mempertahankan campaign attribution,
- memberikan signal yang lebih baik ke Meta,
- menyimpan first-party behavioral event secara internal.

**North Star:**  
`VISITOR → INTEREST → CONTACT → LEAD`

**Scope P0 dikunci sampai:**  
`VISITOR → INTEREST → CONTACT / WHATSAPP`

---

## 2. Business Problem

### Current Flow
`Meta Ads / Instagram → Instagram Profile → Taplink → WhatsApp / CS → Closing Internal`

Masalah utama:
- source/campaign tidak selalu terbawa dengan baik,
- product interest tidak terstruktur,
- branch context kurang terlihat,
- WhatsApp click belum menjadi signal bisnis yang kaya,
- Meta belum menerima signal yang cukup baik untuk memahami intent visitor.

---

## 3. Business Objectives

### BO-01 — Own the Link Bio
KGJ memiliki link bio sendiri dan tidak bergantung pada Taplink untuk fungsi utama.

### BO-02 — Capture Product Intent
Sistem mengetahui product/category yang diminati visitor.

### BO-03 — Capture Contact Intent
Sistem mengetahui visitor yang melanjutkan ke WhatsApp.

### BO-04 — Preserve Attribution
Source/campaign tetap dapat dikenali sampai event Contact.

### BO-05 — Improve Meta Signal
Event utama dikirim dengan taxonomy yang konsisten.

### BO-06 — Build First-Party Data Foundation
KGJ menyimpan anonymous/pseudonymous event log internal.

### BO-07 — Marketing Self-Service
Marketing dapat mengubah konten rutin tanpa developer deployment.

---

## 4. Primary Users

| Role | Function |
|---|---|
| Visitor / Customer | Membuka link bio, melihat product, memilih WhatsApp branch |
| Marketing / Admin | Mengelola content, product, branch, campaign, CTA |
| Technical Admin / Developer | Setup, integration, maintenance |

CS tidak memerlukan dashboard khusus pada P0.

---

## 5. Final P0 Customer Journey

`Meta Ads / Instagram / Organic → Custom Link Bio KGJ → Product → ViewContent → WhatsApp CTA per Branch → Contact → WhatsApp Branch`

### Locked UX Decision
- Pada P0, primary WhatsApp CTA selalu berada dalam product context.
- Product context terbentuk ketika visitor membuka/memilih product, tanpa form atau
  sequential page wajib sebelum WhatsApp.
- Branch **tidak menjadi step terpisah**.
- Satu product dapat tersedia di banyak branch.
- Pada satu product dapat muncul beberapa CTA WhatsApp branch.
- Setiap branch menggunakan nomor WhatsApp masing-masing.
- CTA WhatsApp menggunakan prefilled message.

Example:

```text
Wedding Ring

[WhatsApp Kotagede]
[WhatsApp Surabaya]
[WhatsApp Jakarta]
```

---

## 6. P0 Mandatory Scope

### 6.1 Public Link Bio
- mobile-first,
- responsive,
- fast loading,
- KGJ branding,
- headline/introduction,
- campaign/promo banner,
- product/category listing,
- WhatsApp CTA per branch,
- social/secondary links.

Public Link Bio menampilkan maksimal satu campaign banner pada satu waktu.

### 6.2 Product Management
Marketing dapat:
- create/edit/deactivate product,
- mengatur sort order,
- mengatur image,
- mengatur description,
- assign product ke satu atau lebih branch.

### 6.3 Branch Management
Marketing dapat:
- create/edit/deactivate branch,
- mengubah WhatsApp destination,
- mengatur urutan,
- mengatur CTA label bila diperlukan.

### 6.4 Product ↔ Branch Mapping
Relationship:
`Product M:N Branch`

### 6.5 WhatsApp CTA
Per product, hanya branch yang aktif dan ter-assign yang ditampilkan.

### 6.6 Prefilled WhatsApp Message
Template configurable dari CMS.

Default example:

```text
Halo Kotagede Jewellery,
saya tertarik dengan {product}.
Mohon informasi lebih lanjut.
```

Supported variable awal:
- `{product}`
- `{branch}`

### 6.7 CMS
Marketing minimal dapat mengelola:
- headline,
- banner,
- URL banner,
- product,
- product image,
- branch,
- branch WhatsApp,
- product-branch mapping,
- CTA,
- WhatsApp message template,
- campaign/promo,
- section order,
- active/inactive state,
- social/additional links.

### 6.8 Tracking P0
- Meta Pixel
- Meta Conversions API
- Google Analytics 4
- Google Tag Manager
- Internal first-party event storage
- UTM persistence
- anonymous session context
- event deduplication
- consent-gated external analytics/marketing tracking

### 6.9 P0 Events
- PageView
- ViewContent
- Contact

---

## 7. P1 Scope

Tidak menjadi launch blocker:
- Lead Form
- Lead event
- Appointment flow
- Schedule event
- extended analytics/reporting

---

## 8. P2 Scope

- Qualified Lead
- CS Integration
- Closing
- Purchase
- Revenue
- Offline / server-side business outcome
- Advanced Attribution
- Advanced Dashboard

---

## 9. Explicit Out of Scope — P0

P0 tidak boleh berkembang menjadi:
- CRM baru,
- customer database kompleks,
- lead scoring,
- marketing automation kompleks,
- data warehouse,
- enterprise dashboard,
- advanced attribution modelling,
- full revenue attribution,
- sales management system,
- omnichannel CS platform.

Semua request baru di luar P0 masuk Change Request / P1 / P2.

---

## 10. Privacy Scope P0

Internal tracking bersifat anonymous/pseudonymous.

Meta Pixel, Meta CAPI, GTM, dan GA4 hanya aktif ketika approved consent state
mengizinkannya. Internal anonymous events juga mengikuti approved consent state.
Tracking tanpa consent tidak boleh menghambat WhatsApp.

### Allowed internal tracking data
- anonymous_session_id
- event_id
- event_name
- event_time
- page_url
- product_id/product_category
- branch_id
- CTA
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term

### Not stored in P0
- customer name
- customer WhatsApp number
- email
- address
- personal lead data

---

## 11. Definition of Done — P0

P0 dianggap selesai apabila:

### Functional
- Link Bio aktif
- mobile responsive
- loading optimized
- product flow works
- CTA WhatsApp per branch works
- correct WhatsApp destination
- prefilled message works
- CMS works without deployment

### Tracking
- Meta Pixel active
- Meta CAPI active sesuai approved architecture
- PageView works
- ViewContent works
- Contact works
- event_id deduplication works
- UTM persists
- product context works
- branch context works pada Contact
- GA4 validated
- internal event storage validated

### End-to-End Launch Gate
`Instagram/Meta Campaign → KGJ Link Bio → Product → WhatsApp Branch → Contact visible with correct context`

---

## 12. Locked Decisions

1. Product context wajib untuk primary WhatsApp Contact P0, tetapi tidak diwajibkan
   melalui sequential form atau page tambahan.
2. Satu product dapat tersedia di banyak branch.
3. Branch dipilih di level CTA WhatsApp.
4. Setiap branch menggunakan WhatsApp masing-masing.
5. ViewContent hanya untuk product, bukan branch.
6. WhatsApp menggunakan prefilled message.
7. Internal first-party event storage diaktifkan.
8. P0 internal tracking anonymous/pseudonymous.
9. GA4 + GTM masuk P0.
10. P0 berhenti di Visitor → Interest → Contact / WhatsApp.
11. Lead, Appointment, Qualified Lead, Closing, Purchase, Revenue berada di P1/P2.
12. Public page menampilkan maksimal satu campaign banner.
13. External tracking dan internal anonymous tracking mengikuti approved consent state.

---

## 13. Status

**Business Scope:** LOCKED  
**P0/P1/P2 Boundary:** LOCKED  
**Customer Journey:** LOCKED  
**Product ↔ Branch Model:** LOCKED  
**WhatsApp Routing Model:** LOCKED  
**Privacy Baseline:** LOCKED
