# Database Design — KGJ Marketing Funnel Hub

**Status:** PostgreSQL mandiri disetujui untuk target VPS 1. Source schema:
`src/lib/db/schema.ts`. Baseline target baru:
`drizzle-standalone/0000_standalone_baseline.sql`.

Dokumen ini menjelaskan schema target saat ini. Folder `drizzle/` dan `supabase/`
adalah arsip migrasi lama; keduanya tidak boleh diterapkan pada PostgreSQL
mandiri.

## Prinsip data

- PostgreSQL 17 adalah satu-satunya database aplikasi.
- Browser tidak memiliki kredensial database. Modul server menggunakan role
  runtime minimum `kgj_app` dengan RLS pada semua tabel aplikasi.
- UUID adalah primary key. Timestamp memakai `timestamptz` UTC.
- Perubahan rutin memakai `is_active`, bukan penghapusan permanen.
- Media tidak disimpan sebagai binary database. Kolom `*_path` menyimpan path
  relatif ke volume media aplikasi.
- Migrasi selalu forward-only. Tidak ada reset, truncate, atau seed destruktif
  dalam build, startup, Docker Compose, maupun workflow deploy.

## Tabel aplikasi

| Tabel | Tujuan dan aturan utama |
| --- | --- |
| `admin_profiles` | Akun CMS: UUID, email unik, hash password `scrypt`, nama tampilan, role `admin`/`technical_admin`, serta status aktif. |
| `admin_sessions` | Sesi opaque: hash token unik, expiry, dan FK cascade ke profil. Token plaintext hanya di cookie `HttpOnly`. |
| `site_settings` | Satu baris pengaturan/template KGJ, termasuk cabang Link Bio utama. |
| `content_sections` | Susunan section bersama atau per cabang, visibilitas, jarak, divider, dan judul publik. |
| `branches` | Nama, slug unik, nomor WhatsApp, profil override, logo, status, dan urutan cabang. |
| `products` | Kategori produk bersama; slug adalah kategori tracking yang stabil. |
| `product_branches` | Assignment produk–cabang yang unik, override CTA/pesan, status, dan urutan. |
| `campaigns` | Kampanye scope cabang, gambar banner, periode, URL, status, dan urutan. |
| `links` | Tautan sekunder/sosial per cabang dengan status dan urutan. |
| `faqs` | FAQ bersama atau per cabang, dengan fallback template pada pembacaan publik. |
| `gallery_items` | Gambar galeri wajib milik satu cabang; tidak memiliki CTA atau hubungan produk. |
| `branch_review_sources` | Satu konfigurasi sumber ulasan Google/Firecrawl per cabang. |
| `branch_google_reviews` | Ulasan hasil import, terjemahan, status tampilan, pilihan manual, dan urutan. |
| `branch_meta_tracking_configs` | Konfigurasi Meta per cabang. Token CAPI dan Test Event Code terenkripsi. |
| `events` | Event internal anonim/pseudonim `PageView`, `Contact`, dan `LinkClick`, termasuk attribution dan snapshot historis. |
| `audit_logs` | Audit mutation tersanitasi tanpa credential, token, atau data customer. |

`site_settings.id` memakai UUID singleton
`00000000-0000-0000-0000-000000000001`. FK konten memakai `RESTRICT` untuk
menjaga histori, kecuali sesi admin yang cascade bila profil dihapus.

## Integritas dan pembacaan

- `branches.slug`, `products.slug`, email admin, token sesi, dan `events.event_id`
  unik.
- Assignment (`product_id`, `branch_id`) unik. Section unik per scope cabang.
- CTA publik hanya muncul bila cabang, produk, dan assignment semuanya aktif.
- Root Link Bio membaca `site_settings.default_link_bio_branch_id`; cabang
  tidak aktif tidak boleh dipilih sebagai root atau dirender publik.
- Event memakai snapshot nama/kategori agar histori tetap terbaca ketika konten
  dinonaktifkan. Event tidak menyimpan PII customer.
- Konfigurasi Meta mode `custom` harus lengkap; mode `disabled` menghapus
  credential khusus. Page load provider selalu `PageView`; event CTA tersimpan
  terpisah dan harus berasal dari daftar standar yang disetujui.

Index pada schema mendukung daftar aktif/urut per cabang, scope/urut section,
serta akses event berdasarkan waktu, nama event, sesi, produk, cabang, tautan,
UTM, device, dan negara. Index baru hanya ditambahkan berdasarkan access pattern
yang terbukti.

## Role dan RLS

Baseline membuat role `kgj_app` dan policy `kgj_app_access` pada 16 tabel.
Container PostgreSQL membuat login role itu dari `POSTGRES_APP_PASSWORD` saat
volume baru pertama kali diinisialisasi. Runtime memakai `DATABASE_URL` dengan
role tersebut; URL owner PostgreSQL hanya untuk migrasi yang disetujui.

Semua query domain tetap berasal dari modul server Drizzle. Tidak ada grant
browser role, direct REST database, atau public database port.

## Media

Unggahan melalui CMS divalidasi untuk ukuran, MIME, dan isi JPEG/PNG/WebP.
Nama file UUID baru mencegah penimpaan file lama. File disimpan pada volume
`media-data` di production atau `.media` lokal; route `/media/*` hanya melayani
ekstensi gambar tersebut dengan cache publik. Database menyimpan path relatif,
misalnya `gallery/<branch-id>/<uuid>.webp`.

Sebelum cutover, setiap object sumber harus disalin ke volume media target pada
path relatif yang sama. Data database tidak diubah hanya untuk mengganti lokasi
penyimpanan file.

## Migrasi dan cutover

`drizzle-standalone/0000_standalone_baseline.sql` hanya untuk target PostgreSQL
baru dan kosong. Jangan menerapkannya di database yang sudah berisi schema atau
data aplikasi.

Cutover dari Supabase self-hosted adalah operasi pemilik terpisah:

1. Buat dan verifikasi backup PostgreSQL sumber, target, serta semua file media.
2. Ekspor schema/data sumber dan impor ke target dengan mapping yang telah
   ditinjau pada [runbook cutover](runbooks/standalone-vps-cutover.md); jangan
   reset atau truncate sumber maupun target berisi data.
3. Salin media dengan path yang sama, lalu bandingkan jumlah data, FK, aset,
   cabang root, serta konfigurasi Meta sebelum cutover.
4. Buat ulang kata sandi admin CMS karena hash Supabase Auth tidak digunakan.
5. Pertahankan backup sampai smoke check Link Bio, CMS, upload media, Meta, dan
   CTA WhatsApp berhasil; cleanup hanya atas persetujuan pemilik setelah periode
   rollback.

Migrasi live selalu dijalankan manual dan eksplisit sebelum deploy kode yang
membutuhkannya, menggunakan service Compose profile `migration` dengan URL
owner terpisah. GitHub Actions, Dockerfile runtime, dan startup aplikasi tidak
pernah menjalankannya. Deploy memeriksa keberadaan schema minimum dan gagal
aman bila target belum dimigrasikan.

## Retensi

Event internal disimpan maksimal 24 bulan. Endpoint retention terautentikasi
menghapus batch terbatas hanya setelah pemilik menjadwalkannya dan memverifikasi
perilakunya di lokal. Audit log mencatat jumlah/status, tidak pernah memuat event
atau rahasia mentah.
