# KGJ Marketing Funnel Hub

Link Bio milik Kotagede Jewellery untuk alur P0 **pengunjung → minat produk →
WhatsApp cabang**. Aplikasi adalah modular monolith Next.js dengan PostgreSQL
mandiri, CMS internal, volume media persisten, dan integrasi Meta opsional.

Tidak ada Supabase, layanan auth pihak ketiga, object store, atau database yang
dibuka ke internet pada arsitektur target.

## Arsitektur runtime

- **Next.js** melayani Link Bio, CMS, route media `/media/*`, dan API internal.
- **PostgreSQL 17** berjalan pada jaringan Docker internal; aplikasi memakai
  role terbatas `kgj_app`.
- **Media** berada pada named volume Docker `media-data`, dipasang pada
  `/app/media`; file publik hanya dibaca melalui route aplikasi.
- **Traefik** hanya meneruskan domain publik ke aplikasi. PostgreSQL tidak
  memiliki port host pada produksi.
- **GitHub Actions** membangun image immutable GHCR. Deploy VPS hanya menarik
  image tersebut; tidak menjalankan build atau migrasi database.

Kontrak produk, operasi, dan schema ada di [PRD](docs/prd.md),
[System Architecture](docs/system-architecture.md), dan
[Database Design](docs/database-design.md).

## Pengembangan lokal

Prasyarat: Docker Desktop, Node.js 24, dan pnpm 11.15.1.

```powershell
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
docker compose -f compose.local.yml up -d --wait
pnpm db:migrate:local
pnpm dev
```

Jangan menimpa `.env.local` yang sudah ada. Media lokal dibuat pada `.media`
saat admin pertama kali mengunggah file; direktori tersebut diabaikan Git.
Compose lokal tidak memakai restart policy, sehingga database tidak otomatis
aktif saat Docker Desktop dibuka.

Untuk menghentikan database lokal tanpa menghapus data:

```powershell
docker compose -f compose.local.yml stop
```

## Perintah penting

| Perintah | Kegunaan |
| --- | --- |
| `pnpm typecheck` | Validasi TypeScript |
| `pnpm test` | Unit dan component tests |
| `pnpm test:integration` | Uji PostgreSQL lokal yang sudah dimigrasikan |
| `pnpm test:e2e` | Smoke test browser terhadap database lokal |
| `pnpm quality:check` | Gate CI: format, lint, typecheck, test, dan build |
| `pnpm db:generate:standalone` | Buat migrasi Drizzle PostgreSQL untuk ditinjau |
| `pnpm db:migrate:local` | Terapkan migrasi ke PostgreSQL lokal saja |
| `pnpm db:migrate:live` | Terapkan migrasi live yang sudah disetujui secara eksplisit |

Install Chromium sekali sebelum E2E:

```powershell
pnpm exec playwright install chromium
```

## Produksi di VPS 1

1. Buat network Traefik `proxy` yang sudah digunakan VPS.
2. Salin `.env.live.example` menjadi `.env.production` yang diabaikan Git.
3. Isi password PostgreSQL, `DATABASE_URL` role `kgj_app`, rahasia sesi/tracking,
   dan `MEDIA_STORAGE_ROOT=/app/media`.
4. Pastikan `MEDIA_PUBLIC_BASE_URL=https://link.kotagedejewellery.com/media`.
5. Jalankan migrasi production hanya setelah ditinjau dan disetujui pemilik;
   gunakan service profile `migration`, bukan runtime aplikasi.
6. Deploy image SHA melalui workflow GitHub Actions.

`compose.production.yml` membuat dua volume terpisah: `postgres-data` dan
`media-data`. Service `media-init` hanya mengatur kepemilikan volume media;
ia tidak mengosongkan, menyalin, atau menghapus file. Aplikasi menggunakan
`restart: unless-stopped`; database dan media tidak diekspos ke host.

Repository secrets untuk deploy:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
DOCKER_BUILD_ENV
GHCR_USERNAME
GHCR_PULL_TOKEN
```

`DOCKER_BUILD_ENV` berisi environment runtime production yang sama dengan
`.env.production`, tanpa `DATABASE_LIVE_MIGRATION_URL`. Jangan menyimpan
credential migrasi di image, runtime, Git, atau log. Workflow deploy memulai
PostgreSQL lalu memeriksa schema minimum; bila belum ada, deploy aplikasi
dihentikan tanpa mengubah data.

## Aturan keselamatan data dan cutover

Tidak ada startup, build, Dockerfile, atau workflow deploy yang melakukan
reset database, `truncate`, migrasi otomatis, atau penghapusan volume.

Baseline `drizzle-standalone/0000_standalone_baseline.sql` hanya untuk
PostgreSQL baru yang kosong. Ia bukan skrip untuk menimpa database yang sudah
berisi data. Cutover dari Supabase self-hosted harus diperlakukan sebagai
operasi pemilik terpisah:

1. Backup database sumber dan target, serta salin bucket/file media sumber.
2. Siapkan target kosong, lalu impor schema dan data melalui
   [runbook cutover](docs/runbooks/standalone-vps-cutover.md) yang ditinjau.
   Jangan menjalankan reset pada sumber maupun target berisi data.
3. Salin setiap object media ke volume `media-data` dengan path relatif yang
   sama seperti `logo_path`, `banner_path`, dan `image_path` di database.
4. Bandingkan jumlah data, foreign key, branch root, akun admin, dan respons
   URL media sebelum DNS/cutover.
5. Simpan backup sampai smoke check publik, login CMS, unggah media, dan CTA
   WhatsApp terbukti benar. Kata sandi admin CMS perlu dibuat ulang karena
   Supabase Auth tidak dipakai lagi.

Migrasi live tidak pernah dijalankan oleh GitHub Actions. Aset atau data lama
tidak dihapus oleh perubahan aplikasi ini; pembersihan hanya boleh dilakukan
oleh pemilik setelah periode rollback yang disetujui.

## Operasi migrasi owner-only

Salin `.env.migration.example` menjadi `.env.migration`, isi hanya URL owner
database internal, lalu lindungi file itu (`chmod 600 .env.migration` di VPS).
Service profile `migration` tidak dijalankan oleh startup atau GitHub Actions.
Setelah pemilik menyetujui migrasi yang ditinjau, jalankan dari repository VPS:

```bash
APP_IMAGE=manual-migration-only \
  docker compose -f compose.production.yml --profile migration run --rm --build migration
```

Untuk membuat technical admin pertama setelah impor, isi juga
`BOOTSTRAP_ADMIN_EMAIL` dan `BOOTSTRAP_ADMIN_PASSWORD` (12â€“128 karakter) di
`.env.migration`, lalu jalankan:

```bash
APP_IMAGE=manual-migration-only \
  docker compose -f compose.production.yml --profile migration run --rm --build \
  migration node scripts/bootstrap-technical-admin.mjs
```

Bootstrap menolak berjalan bila technical admin yang sudah memiliki kata sandi
ada. Ia tidak mencetak password, hash, atau URL koneksi. Detail pemetaan data,
media, validasi, dan rollback ada di runbook.

Untuk cutover data, isi `SOURCE_DATABASE_URL`, tetapkan
`MEDIA_COPY_VERIFIED=true` hanya setelah manifest asset selesai diverifikasi,
dan gunakan konfirmasi eksplisit berikut. Script hanya membaca source,
menolak target yang telah berisi data impor, lalu memakai satu transaksi target
tanpa `DELETE`, `TRUNCATE`, atau reset:

```bash
CUTOVER_CONFIRMATION=IMPORT_SOURCE_DATA_WITHOUT_DELETION \
  APP_IMAGE=manual-migration-only \
  docker compose -f compose.production.yml --profile migration run --rm --build \
  migration node scripts/import-supabase-to-standalone.mjs
```

## Meta tracking

Saat `TRACKING_ENABLED=true`, browser dan CAPI menerima `PageView` ketika
Link Bio dibuka. CTA WhatsApp mengirim `Contact` secara internal dan event Meta
standar yang dipilih technical admin. Tracking bersifat best-effort dan tidak
pernah menahan navigasi WhatsApp.

Untuk konfigurasi cabang khusus, gunakan `META_TRACKING_CONFIG_ENCRYPTION_KEY`
64 karakter hex. Token CAPI dan Test Event Code tidak masuk halaman publik,
audit log, atau event internal. Detail lengkap ada di PRD.

## Kontribusi

Ikuti [AGENTS.md](AGENTS.md): baca dokumen sumber yang relevan, gunakan
migrasi forward-only, lakukan pengujian proporsional, dan jangan commit/push
atas nama pemilik.
