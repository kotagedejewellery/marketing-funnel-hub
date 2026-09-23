---
target: Audit keseluruhan CMS terutama modal untuk informasi menyesatkan, duplikasi fungsi, dan ketidaksesuaian
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\FILE KERJA\\PT KotaGede Jewellery\\New System\\marketing-funnel-hub\\src\\app\\admin\\(cms)\\branches\\[id]\\link-bio\\page.tsx"
target_fingerprint: "sha256:14c6f12e4c3d6c14c2e26243976fb1df2b7572d19a19e1ed3143e285ef3d388d"
target_path: "D:\\FILE KERJA\\PT KotaGede Jewellery\\New System\\marketing-funnel-hub\\src\\app\\admin\\(cms)\\branches\\[id]\\link-bio\\page.tsx"
timestamp: 2026-09-23T04-47-26Z
slug: src-app-admin-cms-branches-id-link-bio-page-tsx
---
# Audit CMS dan modal

## Design Health Score

| # | Heuristik | Skor | Temuan utama |
|---|---|---:|---|
| 1 | Status sistem terlihat | 3/4 | Loading, toast, status aktif, dan preview tersimpan sudah jelas. |
| 2 | Sesuai bahasa pengguna | 2/4 | Istilah slug, CTA, kunci ikon, kampanye/banner masih bercampur. |
| 3 | Kontrol dan kebebasan | 2/4 | Override gambar tidak dapat dikembalikan ke bawaan. |
| 4 | Konsistensi | 3/4 | Pola modal konsisten; istilah dan beberapa jalur edit masih berbeda. |
| 5 | Pencegahan kesalahan | 2/4 | Panduan gambar produk salah rasio dan dialog produk nonaktif menyesatkan. |
| 6 | Kenali, bukan mengingat | 2/4 | Hirarki fallback harus diingat karena tidak dijelaskan pada input. |
| 7 | Efisiensi | 2/4 | Pengurutan satu per satu dan dua jalur edit produk menambah langkah. |
| 8 | Minimalisme | 3/4 | Pengelompokan baik, tetapi editor cabang memiliki banyak aksi berbobot sama. |
| 9 | Pemulihan error | 3/4 | Input tidak hilang saat gagal; asosiasi field-error belum lengkap. |
| 10 | Bantuan kontekstual | 2/4 | Cakupan bawaan/cabang/produk belum dijelaskan konsisten. |
| **Total** | | **24/40** | **Layak; penyederhanaan semantik masih diperlukan.** |

## Design Specificity Verdict

CMS sudah khusus untuk alur KGJ: halaman per cabang, Pustaka Produk, fallback bersama, WhatsApp, dan preview tersimpan. Kekurangannya bukan identitas visual, melainkan beberapa kontrol yang menjanjikan hasil berbeda dari perilaku sebenarnya.

## Yang sudah baik

- Modal menggunakan native dialog, judul terhubung, Escape, close, toast sukses, dan mempertahankan input ketika gagal.
- Pemisahan Halaman Link Bio, Pustaka Produk, dan Pengaturan Bersama sesuai arsitektur.
- Preview menggunakan renderer publik yang sama dan tidak mengirim tracking.

## Temuan prioritas

1. **P1 — Panduan gambar produk salah rasio.** Upload menyarankan 4:3 sementara galeri publik memakai 4:5. Gunakan 1080 × 1350 px pada panduan, preview, dan pemeriksaan rasio.
2. **P1 — Override gambar tidak dapat dikembalikan ke bawaan.** Tambahkan aksi sederhana untuk mengosongkan path override branch dan assignment.
3. **P1 — Modal tautan meminta Platform dan Kunci ikon yang tidak memengaruhi renderer publik.** Hapus input sampai keduanya benar-benar digunakan.
4. **P2 — Dialog Tampilkan produk dapat menyimpan assignment tetap nonaktif.** Pakai istilah Atur produk atau pisahkan assignment nonaktif dari produk belum ditambahkan.
5. **P2 — Hirarki CTA/fallback tidak dijelaskan.** Jelaskan scope bersama, cabang, dan produk-cabang pada masing-masing modal.

## Duplikasi dan bagian lama

- Pustaka Produk memiliki jalur Edit dan Kelola yang kembali membuka form edit sama.
- Source route lama content/campaigns/links masih ada, tetapi sudah dialihkan oleh next.config.ts sehingga merupakan dead UI source, bukan UI runtime aktif.
- Istilah kampanye/banner masih muncul pada toast, action, dan media walau UI memakai Konten unggulan.
- Tautan tambahan juga menampung media sosial; judul perlu menyebut keduanya.
- Edit info & WhatsApp juga mengubah status, urutan, dan CTA.

## Persona red flags

- Marketing baru: fallback, slug, CTA, kunci ikon, dan Tampilkan/Atur dapat disalahartikan.
- Marketing berpengalaman: jalur edit ganda dan ordering satu per satu menambah langkah.
- Pengguna screen reader: mayoritas field belum menghubungkan aria-invalid/aria-describedby ke error.

## Pertanyaan arah

- Haruskah setiap kartu editor menunjukkan badge Bawaan bersama atau Khusus cabang?
- Apakah Pustaka Produk cukup mempunyai satu aksi Kelola untuk edit teks dan gambar?
- Apakah metadata tautan yang belum dirender lebih baik disembunyikan seluruhnya?
