# Runbook Cutover Supabase Self-hosted ke PostgreSQL Mandiri

Dokumen ini adalah prosedur owner-only untuk memindahkan sistem ke VPS 1 tanpa
menghapus atau mengubah data sumber. Jalankan di jendela maintenance yang
disetujui. Tidak ada perintah pada runbook ini yang memakai `DROP`, `TRUNCATE`,
reset database, atau penghapusan volume.

## Batas dan prasyarat

- Backup PostgreSQL sumber, volume/object storage sumber, dan target harus
  selesai serta dapat dibaca sebelum perubahan DNS atau aplikasi.
- Target PostgreSQL harus baru dan kosong. Baseline standalone hanya boleh
  dijalankan satu kali pada target itu.
- Simpan `META_TRACKING_CONFIG_ENCRYPTION_KEY` yang sama dengan sumber. Tanpa
  nilai yang sama, token CAPI dan Test Event Code terenkripsi tidak dapat
  dibaca; hentikan cutover, jangan mengosongkan nilainya.
- Jangan menunjuk aplikasi target ke database sumber. Pastikan URL runtime
  menggunakan `kgj_app@db:5432/kgj`, dan URL migrasi owner hanya ada di
  `.env.migration` yang diabaikan Git.
- Supabase Auth, magic link, OAuth, MFA, dashboard, REST, dan Storage API tidak
  ikut menjadi layanan target. P0 CMS memakai password internal baru dan
  session cookie; verifikasi bahwa tidak ada workflow bisnis yang masih
  bergantung pada fitur tersebut sebelum cutover.

## Inventaris sumber (read-only)

1. Catat jumlah baris seluruh tabel aplikasi, khususnya `branches`, `products`,
   `product_branches`, `campaigns`, `links`, `faqs`, `gallery_items`,
   `branch_review_sources`, `branch_google_reviews`,
   `branch_meta_tracking_configs`, `events`, `audit_logs`, dan
   `admin_profiles`.
2. Catat seluruh `storage.objects` menurut bucket dan nama object. Salin setiap
   object yang direferensikan kolom `logo_path`, `banner_path`, atau
   `image_path` ke manifest terpisah; nama relatif harus dipertahankan persis.
   Bucket `admin-media` juga diarsipkan walau tidak direferensikan agar tidak
   ada aset sumber hilang sebelum periode rollback selesai.
3. Cari URL lama `supabase.kotagedejewellery.tech` pada kolom teks. URL publik
   eksternal tidak otomatis menjadi `/media/*`; daftar tersebut harus memiliki
   keputusan eksplisit (salin/rewrite dengan migrasi yang ditinjau atau
   pertahankan redirect) sebelum DNS sumber dipensiunkan.
4. Simpan hasil count dan manifest bersama backup. Jangan hanya mengandalkan
   dump SQL tanpa daftar asset.

## Pemetaan yang wajib ditinjau

Gunakan `scripts/import-supabase-to-standalone.mjs`; jangan mengimpor schema
`auth`, `storage`, atau `drizzle` Supabase ke target. Script membaca source
dengan koneksi read-only, mempertahankan UUID/kolom aplikasi kompatibel, dan
menulis satu transaksi ke target baseline baru. Ia menolak target yang sudah
berisi data impor, URL media lama, source profil tanpa email, seed section yang
tidak dapat digantikan, atau count akhir yang tidak setara.

| Sumber | Target | Aturan |
| --- | --- | --- |
| `public.*` tabel aplikasi | tabel `public` standalone dengan nama sama | Impor data domain beserta UUID dan timestamp asli. |
| `auth.users.email` | `admin_profiles.email` | Isi email profil dari UUID yang sama; email wajib unik dan tidak boleh kosong. |
| `auth.users` hash/password/session | tidak diimpor | Hash Supabase tidak kompatibel. Buat `technical_admin` dengan bootstrap owner-only; semua session baru. |
| `storage.objects.name` | volume `media-data/<name>` | Copy byte-for-byte, pertahankan path relatif dan bandingkan checksum/ukuran. |
| ciphertext Meta | `branch_meta_tracking_configs` | Pertahankan ciphertext tanpa rewrite dan gunakan encryption key yang sama. |

`admin_sessions` target dimulai kosong. Jangan membuat credential atau session
dummy dalam dump. Jika profil lama belum mempunyai email yang dapat dipetakan,
hentikan dan koreksi mapping sebelum import, bukan dengan data placeholder.

## Eksekusi terkontrol

1. Siapkan `.env.production` target dan `.env.migration` dari template dengan
   permission 600. Pastikan `POSTGRES_APP_PASSWORD` berbeda dari password
   owner PostgreSQL dan URL runtime memakai password app yang sama.
2. Terapkan baseline/migrasi melalui service profile `migration` secara manual
   hanya pada target kosong. GitHub Actions dan aplikasi tidak menjalankannya.
3. Salin media ke volume target dan cocokkan manifest/checksum. Baru setelah
   itu tetapkan `MEDIA_COPY_VERIFIED=true`, `SOURCE_DATABASE_URL`, dan
   `CUTOVER_CONFIRMATION=IMPORT_SOURCE_DATA_WITHOUT_DELETION` di environment
   satu kali. Jalankan importer melalui service `migration`; importer tidak
   dapat berjalan bila guard tersebut tidak terpenuhi.
4. Importer menangani source-wins upsert `site_settings` dan `content_sections`
   berdasarkan scope/key. Ini mengganti nilai seed baseline dengan konfigurasi
   source tanpa menghapus source maupun target, lalu membandingkan count semua
   tabel aplikasi di dalam transaksi.
5. Bila import gagal, hentikan dan pulihkan target dari backup target; jangan
   menghapus sumber untuk mencoba ulang.
6. Jalankan `scripts/bootstrap-technical-admin.mjs` memakai service
   `migration`, dengan password baru owner. Script menolak bila akun teknis
   berpassword sudah ada, sehingga tidak dapat mengambil alih admin yang sudah
   memiliki password, dan hanya mencatat audit tersanitasi.

## Validasi sebelum DNS/cutover

- Bandingkan count target dengan inventaris sumber untuk setiap tabel yang
  dipetakan; pengecualian yang disetujui hanya `admin_sessions` dan data
  Supabase (`auth`, `storage`, `drizzle`).
- Periksa semua FK target dan `site_settings.default_link_bio_branch_id`.
- Bandingkan jumlah/ukuran/checksum asset manifest dan buka sampel logo,
  campaign, gallery, serta gambar produk melalui `/media/*`.
- Login dengan technical admin baru; pastikan role biasa tidak dapat melihat
  credential CAPI/Test Event Code.
- Buka root Link Bio dan setiap slug, klik CTA WhatsApp, lakukan satu upload
  media non-destruktif, lalu validasi event internal dan Meta dengan test code
  bila tracking aktif.
- Jalankan preflight deploy; ia harus menemukan schema standalone sebelum app
  ditarik. Jangan melanjutkan jika preflight gagal.

## Rollback dan operasi sesudah cutover

Jika validasi gagal, arahkan trafik kembali ke sumber dan pertahankan target
beserta log untuk investigasi. Jangan menghapus volume atau database target
selama periode rollback. Setelah stabil, jadwalkan backup PostgreSQL dan volume
media target. Saat merotasi `POSTGRES_APP_PASSWORD` pada volume yang sudah ada,
ubah password `kgj_app` secara manual dengan role owner dalam maintenance
window; init script tidak dieksekusi ulang pada volume lama. Perbarui
`DATABASE_URL` runtime secara bersamaan, lalu restart hanya aplikasi dan
verifikasi login/public page.
