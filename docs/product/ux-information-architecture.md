# UX & Information Architecture v1.1
**Project:** KGJ Custom Link Bio + Meta Tracking Hub  

**Status:** Final / Normalized by ADR-003 and ADR-004  
**Phase:** MVP / P0  
**Owner:** Product / Marketing  
**Last Reviewed:** 2026-09-15  
**Purpose:** Menjadi source of truth untuk pengalaman user, struktur informasi, navigasi, dan struktur CMS.  
**Does NOT define:** Infrastruktur, database, server flow, deployment, security boundary, atau implementasi tracking backend.

---

## 1. Document Scope

Dokumen ini hanya membahas:

- apa yang dilihat visitor,
- urutan informasi,
- interaksi user,
- struktur halaman public,
- struktur admin CMS,
- empty state,
- error state yang terlihat user,
- acceptance criteria UX.

Detail teknis seperti event transport, Meta CAPI, database, API, cache, deployment, dan secret management berada di **System Architecture** dan dokumen teknis berikutnya.

---

## 2. UX Objective

Membuat customer journey sesingkat mungkin dari traffic source menuju WhatsApp tanpa friction tambahan.

Canonical customer journey:

```text
Meta Ads / Instagram / Organic
            ↓
     KGJ Custom Link Bio
            ↓
         Product
            ↓
 WhatsApp CTA per Branch
            ↓
        WhatsApp
```

Tracking berjalan di belakang layar dan tidak boleh menambah langkah customer.

---

## 3. User Types

### 3.1 Visitor / Customer

Primary goals:

- mengenali KGJ,
- memahami campaign/promo aktif,
- menemukan product yang relevan,
- memilih branch,
- memulai percakapan WhatsApp.

---

### 3.2 Marketing / Admin

Primary goals:

- mengelola konten,
- mengelola product,
- mengelola branch,
- mengelola product ↔ branch assignment,
- mengelola campaign,
- mengatur CTA WhatsApp,
- mengatur urutan dan status konten.

---

### 3.3 Technical Admin

Dalam UX P0, Technical Admin menggunakan CMS yang sama apabila diperlukan.

Detail privilege teknis berada di System Architecture / Security Design.

---

## 4. Public Information Architecture

Primary public route:

```text
/
```

Recommended content order:

```text
01. Brand Header
02. Active Campaign / Promo Banner
03. Product / Choose Your Need
04. Product Context
05. WhatsApp CTA per Branch
06. Secondary Links
07. Social Media
08. Footer / Legal
```

P0 tidak dibangun sebagai website marketing besar.

---

## 5. Public Page Structure

### 5.1 Brand Header

Content:

- KGJ logo,
- short introduction,
- optional short value statement.

Objective:

> Visitor langsung memahami bahwa halaman tersebut adalah halaman resmi Kotagede Jewellery.

---

### 5.2 Campaign Banner

Content:

- campaign image,
- title / short copy,
- optional target link.

Rules:

- maksimal satu campaign banner yang ditampilkan,
- hanya campaign eligible berdasarkan status dan periode yang ditampilkan,
- campaign dapat memiliki periode aktif,
- banner tidak boleh menghalangi product discovery.

---

### 5.3 Product / Choose Your Need

Product card minimal:

- product image,
- product name,
- short description,
- action untuk membuka product context.

Example:

```text
[Product Image]

Wedding Ring
Cincin pernikahan custom KGJ

[Lihat Pilihan]
```

---

### 5.4 Product Context

Product detail P0 tetap berada dalam pengalaman single-page.

Recommended UI patterns:

1. expandable card,
2. bottom sheet,
3. drawer,
4. anchored expanded section.

#### Preferred P0 Pattern

**Bottom sheet / expandable section pada mobile.**

Reason:

- tidak menambah page transition,
- tetap cepat,
- cocok untuk Instagram in-app browser,
- menjaga visitor tetap berada pada satu journey.

---

### 5.5 WhatsApp CTA per Branch

Satu product dapat memiliki banyak branch.

Primary WhatsApp CTA P0 selalu muncul di dalam product context. Generic branch-only
WhatsApp CTA bukan bagian dari P0.

Example:

```text
Wedding Ring

Pilih cabang untuk konsultasi:

[WhatsApp Kotagede]
[WhatsApp Surabaya]
[WhatsApp Jakarta]
```

Rules:

- hanya branch aktif dan assigned yang tampil,
- setiap CTA memiliki WhatsApp destination sendiri,
- visitor tidak perlu melalui form atau confirmation page,
- CTA harus mudah ditekan pada mobile.

---

## 6. Product Interaction Flow

```text
Product List
    ↓
Select Product
    ↓
Product Context
    ↓
Available Branch CTA
    ↓
Select WhatsApp Branch
    ↓
WhatsApp Opens
```

Tidak ada mandatory branch selector page terpisah.

---

## 7. WhatsApp UX

Visitor experience harus sesederhana:

```text
Tap WhatsApp
     ↓
WhatsApp Opens
```

Tidak boleh ada:

```text
Tap WhatsApp
↓
Confirmation Page
↓
Form
↓
Loading Page
↓
WhatsApp
```

hanya demi tracking.

---

## 8. Prefilled WhatsApp Message UX

Default template:

```text
Halo Kotagede Jewellery,
saya tertarik dengan {product}.
Mohon informasi lebih lanjut.
```

Optional template:

```text
Halo Kotagede Jewellery,
saya tertarik dengan {product} melalui cabang {branch}.
Mohon informasi lebih lanjut.
```

Supported variables P0:

- `{product}`
- `{branch}`

Tracking identifiers tidak boleh terlihat di pesan customer.

---

## 9. Secondary Links

Optional:

- katalog,
- promo,
- FAQ,
- social links,
- appointment link jika nanti masuk P1,
- additional links.

Primary conversion tetap WhatsApp.

Secondary links tidak boleh lebih dominan daripada primary CTA.

---

## 10. Social Media

Support minimal sesuai kebutuhan bisnis:

- Instagram,
- TikTok,
- YouTube,
- Facebook,
- platform lain jika dibutuhkan.

---

## 11. Footer / Legal

Recommended:

- copyright,
- privacy notice,
- optional terms.

Karena sistem melakukan tracking, privacy notice disarankan tersedia sejak P0.

### 11.1 Consent UX

External analytics/marketing tracking dan internal anonymous events mengikuti
approved consent state. Consent control harus:

- accessible dan mudah dipahami,
- tidak menjadi mandatory confirmation sebelum WhatsApp,
- menyimpan pilihan secara first-party,
- menyediakan cara untuk mengubah pilihan,
- tidak membuat CTA WhatsApp gagal ketika consent ditolak atau belum tersedia.

---

## 12. Public Navigation Model

P0 menggunakan **single-page navigation**.

```text
Brand
 ↓
Campaign
 ↓
Products
 ↓
Product Context
 ↓
WhatsApp CTA
 ↓
Secondary Links
```

Tidak dibutuhkan complex navigation menu.

---

## 13. Mobile-First Rules

Primary environment:

- mobile browser,
- Instagram in-app browser.

Rules:

- CTA memiliki tap target yang nyaman,
- layout vertikal,
- copy singkat,
- image proporsional,
- tidak ada horizontal scroll,
- primary CTA jelas,
- hindari animation berlebihan,
- tidak ada mandatory form sebelum WhatsApp.

---

## 14. Desktop Behavior

Desktop merupakan responsive adaptation.

Recommended:

- centered content,
- limited content width,
- optional multi-column product cards,
- CTA behavior sama dengan mobile.

Desktop tidak berubah menjadi website terpisah.

---

## 15. Admin Information Architecture

Recommended admin structure:

```text
/admin
 ├─ Dashboard
 ├─ Content
 ├─ Campaigns
 ├─ Products
 ├─ Branches
 ├─ Product-Branch Mapping
 ├─ Links
 ├─ Settings
 └─ Tracking Validation
```

Ini adalah **information architecture**, bukan definisi route teknis final.

---

## 16. Admin Dashboard

Minimum information:

- public link bio status,
- active campaign,
- active products count,
- active branches count,
- recent configuration changes,
- optional basic tracking validation summary.

P0 tidak membutuhkan enterprise dashboard.

---

## 17. Admin — Content

Marketing dapat mengelola:

- headline,
- short introduction,
- section visibility,
- section order,
- social links,
- additional links.

---

## 18. Admin — Campaigns

Fields secara UX:

- campaign name,
- banner,
- target,
- start date,
- end date,
- status.

Recommended UX:

- list campaign,
- create/edit,
- activate/deactivate,
- preview.

---

## 19. Admin — Products

Marketing dapat:

- create,
- edit,
- activate/deactivate,
- reorder,
- assign branch.

Product editor minimal menampilkan:

- name,
- image,
- description,
- status,
- ordering,
- assigned branch.

---

## 20. Admin — Branches

Marketing dapat:

- create,
- edit,
- activate/deactivate,
- reorder.

Fields yang perlu terlihat:

- branch name,
- WhatsApp destination,
- CTA label bila digunakan,
- status.

---

## 21. Admin — Product ↔ Branch Mapping

Recommended UX:

```text
Wedding Ring

[x] Kotagede
[x] Surabaya
[x] Jakarta
[ ] Bandung
```

P0 preferred:

- product-centric checkbox/multi-select.

Jika jumlah branch besar di masa depan, dapat berubah menjadi matrix view.

---

## 22. Admin — Settings

Marketing-facing settings:

- default WhatsApp message template,
- default CTA label,
- brand content,
- social links.

Secret credentials tidak termasuk ordinary Marketing settings.

---

## 23. Admin — Tracking Validation

P0 dapat menyediakan basic operational view:

- latest PageView,
- latest ViewContent,
- latest Contact,
- event timestamp,
- product,
- branch,
- source/campaign.

Tujuannya hanya verifikasi operasional, bukan analytics dashboard.

View ini menampilkan canonical internal events. Status delivery Meta/GA4 diverifikasi
melalui sanitized application logs dan provider diagnostic tools, bukan diklaim dari
internal event row.

---

## 24. Active / Inactive State UX

Entity utama harus mendukung:

```text
Active
Inactive
```

Prefer deactivate dibanding delete untuk penggunaan rutin Marketing.

Applies to:

- product,
- branch,
- campaign,
- links,
- banner jika dipisah.

---

## 25. Ordering UX

Marketing dapat mengatur ordering untuk:

- products,
- sections,
- optional links.

Recommended interaction:

- drag-and-drop, atau
- numeric/simple move up-down control.

Implementation choice tidak ditentukan dalam dokumen UX ini.

---

## 26. Empty States

### 26.1 No Active Campaign

Campaign section disembunyikan.

### 26.2 Product Without Active Branch

Public:

- product dapat tetap tampil,
- tidak menampilkan broken WhatsApp CTA.

Admin:

- tampilkan warning bahwa product tidak memiliki active branch.

### 26.3 No Product

Public:

- brand/campaign/secondary links tetap dapat tampil.

Admin:

- tampilkan warning bahwa tidak ada product aktif.

---

## 27. Visitor-Facing Error State

### Broken / Invalid WhatsApp Destination

CTA tidak ditampilkan jika konfigurasi dapat divalidasi sebelumnya.

#### Image Error

Text dan CTA tetap dapat digunakan.

#### Tracking Failure

Tidak ditampilkan sebagai error kepada visitor.

#### Temporary Application Failure

Tampilkan simple branded error/fallback page jika halaman sama sekali tidak dapat dimuat.

---

## 28. Admin Validation UX

Admin harus menerima error yang actionable.

Examples:

```text
Nomor WhatsApp wajib diisi.
```

```text
Product ini belum memiliki branch aktif.
```

```text
Tanggal akhir campaign harus setelah tanggal mulai.
```

---

## 29. Accessibility Baseline

P0 minimum:

- text contrast yang layak,
- keyboard-accessible admin controls,
- label form jelas,
- semantic button/link,
- alt text untuk image penting,
- visible focus state.

---

## 30. UX Acceptance Criteria

### Public

- visitor dapat menemukan product dengan mudah,
- visitor dapat mencapai WhatsApp dengan sedikit interaksi,
- tidak ada mandatory form sebelum WhatsApp,
- branch CTA mudah dipahami,
- mobile flow berjalan di Instagram in-app browser,
- inactive content tidak tampil,
- broken CTA tidak terekspos jika dapat dicegah.

### Admin

- Marketing dapat melakukan routine update tanpa developer,
- product ↔ branch mapping mudah dipahami,
- WhatsApp destination mudah dikelola,
- active/inactive state jelas,
- ordering dapat diubah,
- validation message jelas.

---

## 31. UX Source of Truth

Dokumen ini menjadi source of truth untuk:

- public journey,
- content hierarchy,
- information architecture,
- admin menu structure,
- visible UI behavior.

Dokumen ini **bukan** source of truth untuk:

- database schema,
- API endpoints,
- event transport,
- Meta CAPI implementation,
- caching,
- infrastructure,
- deployment,
- security secrets.

Hal-hal tersebut berada di dokumen teknis masing-masing.

---

## 32. UX Status

**Public Journey:** LOCKED  
**Product → Branch CTA Model:** LOCKED  
**Single-Page P0 Model:** LOCKED  
**Admin IA:** LOCKED  
**Detailed Visual Wireframe / UI Design:** NEXT DESIGN ARTIFACT
