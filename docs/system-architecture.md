# System Architecture — KGJ Marketing Funnel Hub

**Status:** rancangan P0 disetujui; implementasi ekstensi per cabang disiapkan, verifikasi dan migrasi masih menunggu persetujuan · **Acuan:** brief bisnis v1.0 (14 September 2026) dan keputusan teknis proyek (15–22 September 2026) · **Diperbarui:** 22 September 2026

Brief PDF menetapkan tujuan dan prinsip sederhana, tetapi tidak memilih stack, keamanan, atau topologi environment. Pilihan di bawah adalah keputusan proyek sesudah brief, bukan klaim bahwa semuanya tertulis di PDF. Produk dan kriteria penerimaan ada di [PRD](prd.md); relasi dan constraint ada di [Database Design](database-design.md).

## Bentuk sistem

Satu **modular monolith** Next.js App Router (`src/app`) dengan TypeScript ketat, React, Tailwind CSS, dan shadcn/ui untuk CMS. Halaman publik menggunakan Server Components secara default dan JavaScript klien seperlunya. Admin mutations memakai Server Actions; batas HTTP eksplisit memakai Route Handlers. Jalur database/Auth/Storage/tracking berjalan di Node.js. Tidak ada backend terpisah, headless CMS, queue, Redis wajib, atau state manager global P0.

| Lapisan | Pilihan P0 |
| --- | --- |
| Aplikasi/deploy | Next.js di Vercel; Node 24, pnpm 11.15.1, versi paket exact di `package.json`/lockfile |
| Data | Supabase PostgreSQL; Drizzle untuk schema, migrasi, dan query domain |
| Identitas/media | Supabase Auth dan Storage |
| Validasi | Zod di server untuk input tak tepercaya; UI boleh memberi validasi tambahan |
| Sinyal | Meta Pixel, Meta CAPI, GTM → GA4, dan tabel event internal |
| Verifikasi | Vitest, Testing Library, Playwright, database lokal; cakupan berdasarkan risiko |

Alur: browser membuka `/` atau `/b/{slug-cabang}` → server membaca konten aktif melalui modul domain/Drizzle → halaman menampilkan CTA `wa.me` final → interaksi yang diizinkan consent membentuk canonical event → browser mengirim Pixel dan `dataLayer`, serta `POST /api/events` best-effort → server memvalidasi, menyimpan event idempotent, lalu mengirim Meta CAPI dengan timeout terbatas. GTM meneruskan GA4; tidak ada jalur `gtag` GA4 kedua. Tabel domain tidak diakses langsung oleh browser.

Jalur event internal aktif di lokal. Di production, `TRACKING_ENABLED` default `false`; pemilik mengubahnya ke `true` hanya setelah consent/privacy, konfigurasi Pixel/GTM/GA4, dan pemeriksaan rilis disetujui. ID Pixel, ID kontainer GTM, ID dataset CAPI, dan token CAPI hanya wajib ketika tracking diaktifkan. Skrip Pixel/GTM baru dimuat setelah consent terkait; CAPI hanya mengirim event yang baru tersimpan dengan consent pemasaran. Pada GTM, gunakan kontainer khusus GA4 tanpa tag pemasaran lain; buat trigger untuk `kgj_page_view`, `kgj_view_content`, dan `kgj_contact`, petakan parameter dari `dataLayer` ke GA4, serta nonaktifkan page-view otomatis agar tidak menggandakan event aplikasi. Perubahan consent dari mengizinkan ke menolak memuat ulang halaman untuk membuang skrip penyedia yang sudah ada. Pemetaan `dataLayer` mengikuti [panduan resmi Google](https://developers.google.com/tag-platform/tag-manager/datalayer).

## Batas modul dan antarmuka

- `src/modules/public-content`: konten publik aktif, satu kampanye eligible, produk dan CTA cabang; mutasi CMS menginvalidasi cache konten publik.
- `src/modules/admin`: autentikasi/otorisasi, validasi dan mutasi konten, media, audit, serta tampilan validasi event internal.
- `src/modules/tracking`: consent, sesi/atribusi, canonical event, validasi, penyimpanan, dan pemetaan penyedia.
- `src/lib/db` dan `src/lib/supabase`: koneksi server, Supabase Auth/Storage, dan schema; kredensial tidak diimpor ke komponen browser.

### Ekstensi Link Bio per cabang (disetujui 22 September 2026; implementasi menunggu verifikasi)

`/` tetap membaca konten global dan menampilkan CTA per cabang seperti sekarang. Route Server Component `/b/[slug]` memuat hanya cabang aktif, assignment dan produk aktif, serta konten yang khusus dimiliki cabang itu; slug tidak ada/nonaktif memakai 404. Seluruh halaman memakai satu template/desain KGJ dan komponen publik yang sama. Pada halaman cabang, produk dibuka untuk `ViewContent`, sedangkan CTA `wa.me` langsung menuju cabang halaman tanpa daftar cabang lagi. Tidak ada aplikasi, database, provider, role, atau event baru.

Model baca cabang memakai fallback global untuk identitas/headline/pengantar/logo dan nilai tampilan produk yang tidak di-override. Kampanye dan tautan adalah milik halaman yang dipilih (`branch_id IS NULL` untuk `/`, `branch_id = cabang` untuk halaman cabang), tanpa fallback lintas halaman. Section cabang memakai konfigurasi global jika belum mempunyai satu set konfigurasi sendiri. Urutan produk cabang mengikuti `product_branches.sort_order`. CMS menambah konteks cabang untuk edit profil halaman, section, kampanye, tautan, dan override tampilan assignment; setiap mutasi tetap memakai Auth, Zod, audit log, serta invalidasi path halaman terkait. Slug cabang adalah URL publik yang stabil; perubahan setelah dibagikan harus diberi peringatan di CMS.

Proxy sesi/UTM juga berjalan pada `/b/:path*`. `/api/events` menerima hanya path `/` atau `/b/{slug-cabang}` pada origin situs; query string dibuang sebelum penyimpanan. Untuk path cabang, server memastikan cabang aktif, `ViewContent` merujuk produk dengan assignment aktif ke cabang halaman, dan `Contact.branch.id` sama dengan cabang halaman. `PageView`/`ViewContent` tetap tanpa `branch` pada event; path halaman adalah konteks lokasi, bukan perubahan semantik event. `event_id`, consent, idempotensi, dan navigasi WhatsApp non-blocking tidak berubah.

Migrasi Drizzle hanya menambah kolom/index dan mengubah keunikan section global menjadi keunikan per scope; data lama tetap scope global. Deploy live berurutan: pemilik meninjau dan menjalankan migrasi live, lalu deploy kode yang membaca schema baru. Tidak ada migrasi otomatis saat build Vercel. Pemeriksaan fitur dilakukan setelah cakupannya disetujui pemilik; tidak perlu staging atau suite tes besar.

`GET /api/public/config` adalah bentuk DTO internal jika dibutuhkan, bukan request kedua yang wajib untuk render halaman. DTO mengembalikan `campaign: null` atau satu kampanye, produk aktif dengan cabang eligible, serta section/tautan aktif secara deterministik. `POST /api/events` adalah **satu-satunya mutasi tracking publik**; Meta CAPI tidak memiliki endpoint publik. CMS dapat memakai Server Actions. Respons error HTTP memakai `{ "ok": false, "error": { "code", "message", "fields"? } }`; 400 JSON rusak, 401 belum login, 403 tidak berhak, 404 tidak ada, 409 konflik, 422 validasi domain, 429 pembatasan laju, 500 kesalahan internal tersanitasi.

Event kanonis memuat `eventId`, `eventName`, `eventTime`, `anonymousSessionId`, `pageUrl`, konteks `product`/`branch`/`cta`, lima UTM dan `source`/`campaign` bila diketahui, serta `metadata` kecil. Browser mengirim ID produk/cabang; server mengambil slug/nama yang berwenang dari database dan memastikan assignment Contact aktif. `PageView` tidak memiliki produk/cabang/CTA; `ViewContent` wajib produk saja; `Contact` wajib produk, cabang, dan `whatsapp`. Retry `eventId` identik mengembalikan sukses `duplicate: true`; payload yang berubah material mendapat 409 tanpa menimpa event. Batas body 32 KiB dan `metadata` 4 KiB; validasi UUID, waktu, origin URL, panjang field, dan konteks dilakukan server-side. Rate limiting edge diterapkan pada `/api/events`, tanpa menjadikannya satu-satunya perlindungan.

## Tracking, navigasi, dan privasi

Cookie first-party `kgj_sid` menyimpan UUID acak dengan expiry bergulir 30 menit; atribusi lima UTM disimpan di cookie bertanda tangan. Cookie memakai `SameSite=Lax`, `Path=/`, dan `Secure` saat production. Tidak ada fingerprinting atau identitas lintas perangkat. UTM pertama yang tidak kosong dipertahankan; direct tidak menghapusnya; set UTM eksplisit berbeda memulai journey baru.

Pada klik WhatsApp, kode klien membentuk satu event, mendorong penyedia browser yang diizinkan consent, lalu mengirim request event `keepalive` tanpa `await`, `preventDefault`, interstitial, atau redirect buatan. Anchor `wa.me` tetap tujuan navigasi. Server menyimpan event lebih dulu, lalu mengirim CAPI dengan timeout dan retry terbatas memakai ID sama. Pengiriman P0 best-effort, bukan janji delivery sempurna. Kegagalan Pixel, GTM, CAPI, maupun insert event tidak boleh menggagalkan WhatsApp.

Default aman: tracking eksternal dan event anonim internal nonaktif sampai consent yang berlaku mengizinkan; copy dan kebijakan consent perlu persetujuan bisnis/legal sebelum live. `_fbp`, `_fbc`, IP, dan user-agent hanya boleh diteruskan ke Meta jika diizinkan dan tidak boleh disimpan di tabel event atau log biasa. Log server memuat kategori error, waktu, provider, dan ID event seperlunya; tanpa cookie, token, payload lengkap, IP, atau user-agent.

## Akses, keamanan, dan operasi

Halaman publik tanpa login. CMS memerlukan sesi Supabase Auth yang divalidasi server **dan** baris `admin_profiles` aktif. `admin` mengelola konten/validasi event; `technical_admin` juga mengelola profil admin dan diagnostik. Semua mutasi divalidasi server-side dan mencatat diff audit tersanitasi. Request mutasi berbasis cookie harus same-origin. Akses tabel domain melewati modul server dan role database aplikasi berprivilege minimum. RLS pada tabel yang terekspos Supabase menolak akses langsung `anon`/`authenticated` secara default. Browser Supabase hanya untuk Auth dan Storage yang disetujui. Bucket aset dibaca publik, ditulis admin terotorisasi dengan validasi MIME, ekstensi, ukuran, dan path. Token CAPI, secret Supabase, serta password database hanya ada di server/environment.

Hanya dua environment: **local** (Next.js + Supabase Local/Docker) dan **live** (Vercel + proyek Supabase hosted tersendiri). Tidak ada staging Supabase atau gate Vercel Preview P0. Jangan memakai kredensial live untuk pengembangan/CI. Supabase CLI mengelola layanan lokal; migrasi Drizzle mengelola schema aplikasi. Setelah `supabase db reset --local`, jalankan `pnpm db:migrate:local` secara terpisah karena reset tidak menjalankan migrasi Drizzle. Pada laptop Windows yang diuji, port lokal dapat dipublikasikan di semua interface; pemilik menjaga firewall dan menghentikan stack saat tidak dipakai. Operasi Git, provisioning live, dan persetujuan migrasi tetap milik pemilik proyek.

Perubahan schema: ubah Drizzle → hasilkan/tinjau migrasi → terapkan dan verifikasi lokal → persetujuan eksplisit pemilik → migrasi live terpisah dari build Vercel → deploy kompatibel dan smoke check singkat. Migrasi live dijalankan manual oleh pemilik melalui `pnpm db:migrate:live` dengan `DATABASE_LIVE_MIGRATION_URL` sementara dari koneksi admin Supabase; nilai ini tidak masuk Vercel dan berbeda dari `DATABASE_URL` role aplikasi. Gunakan perubahan backward-compatible; rollback aplikasi hanya jika schema masih kompatibel. Retensi event 24 bulan dilaksanakan job terautentikasi berbatas batch sebelum launch; jangan mengaktifkannya sebelum verifikasi lokal. Akun `technical_admin` pertama dibuat lewat prosedur Auth + profil server-side, bukan seed atau sekadar email yang diketahui.

Operasi live yang masih menjadi tugas pemilik: atur [WAF Vercel](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) untuk `/api/events` memakai batas per IP dan global langsung pada konfigurasi Firewall Vercel; jadwalkan `GET /api/cron/events-retention` dengan header `Authorization: Bearer <CRON_SECRET>` setelah verifikasi lokal (maksimal 500 event kadaluarsa per eksekusi); buat pengguna di Supabase Auth sebelum `technical_admin` menghubungkan ID-nya melalui CMS. Tidak ada WAF, cron, atau pengiriman penyedia yang diaktifkan hanya dengan menambahkan kode ini.

Sebelum menjalankan tes, konfirmasi cakupan ke pemilik sesuai `AGENTS.md`. Saat fitur selesai, verifikasi secukupnya: aturan domain/tracking dengan Vitest, interaksi dengan Testing Library, constraint dan akses DB dengan Supabase Local, alur WhatsApp/browser dengan Playwright; adaptasi provider memakai fixture di CI dan validasi nyata dilakukan saat gate rilis. CI tidak menyentuh live. Bukti lulus hanya boleh diklaim untuk pemeriksaan yang benar-benar dijalankan.
