# Riset: Meta Advanced Matching untuk Link Bio KGJ

**Tanggal:** 21 Oktober 2026  
**Status:** brief riset; belum merupakan keputusan implementasi.

## Rekomendasi singkat

**Jangan aktifkan atau membangun Advanced Matching berbasis PII pada Link Bio P0.**
Halaman ini tidak memiliki form, akun pelanggan, checkout, maupun CRM. Sistem sudah
dapat mengirim sinyal teknis yang relevan bila tersedia (`_fbp`, `_fbc`, IP, dan
user-agent) bersama Pixel/CAPI tanpa mengumpulkan email atau nomor telepon. Keputusan
produk selanjutnya menambahkan UUID first-party pseudonim terpisah (`kgj_eid`) sebagai
`external_id`; ia bukan data identitas, tidak disimpan di event internal, dan tidak
pernah menggunakan ID sesi atau ID event.

Menambah input email/telepon hanya untuk menaikkan Event Match Quality akan mengubah
P0 menjadi pengumpulan lead/identitas pelanggan. Itu adalah perubahan scope, privacy
notice, dasar hukum, retensi, keamanan, dan UX; bukan optimasi tracking kecil.

## Temuan dari dokumentasi Meta

### Mekanisme

Advanced Matching memperkaya event web dengan informasi pelanggan agar Meta dapat
mencocokkan event dengan akun Meta. Meta menyediakan mode automatic (mendeteksi data
yang pengguna masukkan pada form) dan manual (developer meneruskan data yang benar-
benar diperoleh). Tanpa form atau data identitas, Link Bio tidak memiliki data yang
bermanfaat untuk mekanisme ini. [Advanced Matching Meta](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching/)

Advanced Matching Pixel/browser dan CAPI bukan hal yang sama: Pixel mengirim dari
browser, CAPI dari server. Keduanya dapat mengirim event yang sama dengan `event_id`
yang sama untuk deduplikasi; `event_id` bukan customer identifier dan bukan
Advanced Matching. [Panduan CAPI Meta](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api/)

### Parameter dan perlakuannya

| Kelompok                  | Contoh                                                                         | Perlakuan                                                                                                                          | Relevansi P0                                                   |
| ------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Identifier pelanggan      | `em`, `ph`, `fn`, `ln`, `db`, `ge`, `ct`, `st`, `zp`, `country`, `external_id` | Identifier identitas perlu normalisasi/hash sesuai ketentuan Meta; UUID pseudonim first-party `external_id` diteruskan apa adanya. | **Jangan kirim PII**: P0 tidak memperoleh identitas pelanggan. |
| Sinyal teknis/attribution | `client_ip_address`, `client_user_agent`, `fbp`, `fbc`                         | Dikirim apa adanya, bukan di-hash. `fbc` hanya saat nilai click identifier tersedia.                                               | **Pertahankan** bila tersedia; jangan direkayasa.              |
| Event web CAPI            | `action_source=website`, `event_source_url`, `client_user_agent`               | Parameter web event yang Meta dokumentasikan.                                                                                      | **Pertahankan dan verifikasi** pada setiap event CAPI.         |

Referensi parameter customer information adalah [dokumen Meta CAPI](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters/).

## Privasi dan kepatuhan

- SHA-256 adalah transformasi keamanan, bukan anonimisasi. Email, telepon, atau ID
  stabil yang di-hash tetap berasal dari data pribadi dan perlu diperlakukan demikian.
- [Meta Business Tools Terms](https://www.facebook.com/legal/terms/businesstools)
  membebankan pemberitahuan yang jelas, privacy policy/opt-out yang diperlukan, serta
  consent bila diwajibkan hukum setempat kepada bisnis.
- Jangan mengirim data sensitif, isi pesan WhatsApp, atau klaim sensitif ke Meta.
- Jangan mengubah `anonymous_session_id`, UUID event, slug cabang, atau nilai teknis
  lain menjadi `external_id`. Bila dipakai tanpa PII, `external_id` harus berupa UUID
  first-party khusus yang stabil, terpisah, dan memiliki lifecycle sah.

## Kesesuaian dengan sistem KGJ sekarang

| Area            | Keputusan yang sesuai                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Pixel + CAPI    | Gunakan `event_id` yang sama per aksi logis untuk deduplikasi; Advanced Matching tidak menggantikannya.                    |
| PageView        | Tetap anonim/pseudonim. Tidak perlu PII.                                                                                   |
| CTA WhatsApp    | Event Meta cabang dan event internal `Contact` tetap terpisah; Advanced Matching tidak mengubah semantik event.            |
| Sinyal yang ada | Teruskan IP, user-agent, `_fbp`, `_fbc`, dan `external_id` UUID pseudonim hanya bila tersedia. Nilai kosong tidak dikirim. |
| CMS             | Jangan sediakan field email, telepon, atau input `external_id` pada Link Bio P0.                                           |

Test Event Code CAPI hanya membantu validasi di Events Manager; ia tidak mengaktifkan
Advanced Matching dan tidak memperbaiki customer matching.

## Risiko bila dipaksakan

1. Form tanpa tujuan bisnis nyata menambah friction dan cenderung menghasilkan data
   minim/tidak valid.
2. PII memperluas P0 menjadi lead/identity processing, bertentangan dengan batas
   produk yang disetujui sekarang.
3. Hash tidak menghapus kebutuhan transparansi, dasar hukum, akses minimal, retensi,
   maupun penghapusan.
4. Identifier palsu atau event yang tidak mencerminkan tindakan nyata dapat merusak
   optimasi dan pelaporan Meta.

## Cakupan yang direkomendasikan

### Sekarang - P0

1. Pertahankan CAPI dengan `client_ip_address`, `client_user_agent`, `fbp`, dan `fbc`
   bila tersedia, serta nama/waktu event, `event_source_url`, `action_source=website`,
   dan `event_id` untuk deduplikasi.
2. Jangan tambahkan form, email, telepon, ataupun `external_id`.
3. Periksa Test Events/Event Match Quality untuk kesalahan parameter teknis, bukan
   dengan membuat data identitas baru.
4. Jangan pernah mengirim placeholder atau mengubah sesi anonim menjadi identitas.

### Hanya bila P1 menyetujui form konsultasi nyata

Owner perlu terlebih dahulu menyetujui perubahan scope dan sumber-dokumentasi produk.
Baru kemudian desain perubahan terpisah untuk tujuan bisnis/event yang nyata, data
minimum, privacy notice dan consent yang relevan, normalisasi + SHA-256 server-side,
retensi/penghapusan, serta tes bahwa PII tidak masuk URL, event internal, browser
bundle, atau log.

## Referensi resmi

1. [Meta Pixel - Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching/)
2. [Conversions API - Customer Information Parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters/)
3. [Conversions API - Using the API](https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api/)
4. [Meta Business Tools Terms](https://www.facebook.com/legal/terms/businesstools)
5. [Meta Data Processing Options](https://developers.facebook.com/docs/marketing-apis/data-processing-options/)

> Catatan riset: halaman developer Meta membatasi akses otomatis saat riset ini
> (respons 429), sehingga brief ini memakai tautan primer resmi dan klaim konservatif.
> Konfigurasi produksi perlu tetap divalidasi di Meta Events Manager/Test Events.
