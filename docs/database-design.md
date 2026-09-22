# Database Design — KGJ Marketing Funnel Hub

**Status:** model P0 disetujui; migrasi ekstensi per cabang telah dihasilkan tetapi belum diterapkan; implementasi schema ada di `src/lib/db/schema.ts` dan migrasi `drizzle/` · **Acuan:** brief bisnis v1.0 (14 September 2026) serta keputusan data proyek · **Diperbarui:** 22 September 2026

Brief PDF meminta kategori produk, cabang, CMS, atribusi, dan tracking, tetapi tidak menetapkan tabel. Desain berikut adalah keputusan proyek untuk memenuhi brief tanpa menambah CRM. Lihat [PRD](prd.md) untuk makna bisnis dan [System Architecture](system-architecture.md) untuk akses/API.

## Konvensi dan relasi

PostgreSQL/Supabase; nama kolom `snake_case`, PK UUID, waktu `timestamptz` UTC, perubahan schema melalui migrasi Drizzle. Semua tabel aplikasi memakai RLS; akses browser `anon`/`authenticated` ke tabel domain ditolak, sedangkan modul server memakai role aplikasi minimum. Kolom `created_at`/`updated_at` pada tabel konten memakai `timestamptz` (event dan audit append-only hanya `created_at`). `is_active` untuk perubahan rutin, bukan hard delete.

`auth.users` ↔ `admin_profiles` (ID sama, relasi identitas logis); `products` M:N `branches` melalui `product_branches`; `events` dapat merujuk produk/cabang; `audit_logs` dapat merujuk profil admin. Tidak ada tabel `sessions`, `attribution`, `customers`, `leads`, `orders`, atau `sales` di P0.

## Sepuluh tabel P0

| Tabel | Kolom inti dan aturan |
| --- | --- |
| `admin_profiles` | `id` UUID PK = Auth user ID, `display_name?`, `role` ∈ `admin`/`technical_admin`, `is_active`; timestamp konten. Hanya profil aktif berhak masuk CMS. |
| `site_settings` | Satu baris dengan `id = 00000000-0000-0000-0000-000000000001` (CHECK), `site_name`, `headline?`, `introduction?`, `logo_path?`, `default_whatsapp_message`, `default_cta_label`, `privacy_url?`; timestamp konten. Tautan sosial tidak diduplikasi di sini. |
| `content_sections` | `id`, `branch_id?` (null = halaman gabungan), `section_key` unik per halaman, `label`, `sort_order` default 0, `is_active`; timestamp konten. |
| `campaigns` | `id`, `branch_id?` (null = halaman gabungan), `name`, `title?`, `description?`, `banner_path?`, `target_url?`, `active_from?`, `active_until?`, `is_active`, `sort_order`; timestamp konten. Jika kedua tanggal ada, `active_until > active_from`. |
| `products` | `id`, `name`, `slug` unik, `description?`, `image_path?`, `is_active`, `sort_order`; timestamp konten. Satu baris = kategori/kebutuhan, bukan SKU; `slug` adalah `product_category` stabil. |
| `branches` | `id`, `name`, `slug` unik, `whatsapp_number` wajib dalam format kode negara (`^[1-9][0-9]{7,14}$`), `cta_label?`, override halaman `headline?`, `introduction?`, `logo_path?`, `is_active`, `sort_order`; timestamp konten. |
| `product_branches` | `id`, `product_id` FK, `branch_id` FK, `display_name?`, `description?`, `image_path?` untuk override tampilan, `whatsapp_message_template?`, `cta_label?`, `is_active`, `sort_order`; timestamp konten; kombinasi (`product_id`, `branch_id`) unik. |
| `links` | `id`, `branch_id?` (null = halaman gabungan), `label`, `url`, `link_type` ∈ `secondary`/`social`, `platform?`, `icon_key?`, `is_active`, `sort_order`; timestamp konten. Semua tautan sosial/sekunder ada di sini. |
| `events` | `id` UUID PK, `event_id` teks unik, `anonymous_session_id`, `event_name`, `event_time`, `page_url?`, `product_id?`, `branch_id?`, snapshot `product_category?`/`branch_name?`, `cta?`, `source?`, `campaign?`, lima `utm_*?`, `metadata?` JSONB, `created_at`. |
| `audit_logs` | `id`, `admin_id?` FK, `action`, `entity_type`, `entity_id?`, `changes?` JSONB tersanitasi, `created_at`. Aksi utama: create/update/activate/deactivate/assign/unassign. |

`?` berarti nullable. Semua `id` adalah UUID; `sort_order` integer dan `is_active` boolean. Primary key default acak, kecuali `admin_profiles.id` mengikuti Auth dan `site_settings.id` tetap. Path gambar adalah referensi Supabase Storage, bukan binary database.

### Scope halaman per cabang (disetujui 22 September 2026; migrasi belum diterapkan)

Tidak ada tabel baru. `branch_id` nullable pada `content_sections`, `campaigns`, dan `links` menentukan pemilik konten: `NULL` untuk `/`, ID cabang untuk `/b/{slug}`. FK baru ke `branches.id` memakai `ON DELETE RESTRICT`; baris lama tetap `NULL`. Keunikan lama `content_sections.section_key` diganti dua unique index parsial: satu untuk `(section_key)` ketika `branch_id IS NULL`, satu untuk `(branch_id, section_key)` ketika `branch_id IS NOT NULL`. Ini mencegah duplikasi section pada satu halaman tanpa melarang nama section sama di cabang lain. Index scope dan urutan disediakan untuk baca halaman.

`branches.headline/introduction/logo_path` yang kosong memakai nilai `site_settings`; identitas `site_name` tetap global. `product_branches.display_name/description/image_path` yang kosong memakai nilai `products`, tetapi `products.slug` tetap kategori kanonis untuk tracking. Pada halaman cabang, hanya assignment aktif ke cabang aktif dan produk aktif yang tampil, diurutkan menurut assignment. Nomor WhatsApp tetap hanya dari `branches.whatsapp_number`.

Kampanye dan tautan dipilih tepat dalam scope halaman, tanpa fallback ke scope global. Kampanye tetap maksimal satu sesuai urutan dan periode existing. Section cabang, jika belum ada satu pun baris scoped, memakai section global; setelah Marketing menyimpan set section cabang, hanya baris scoped yang dipakai sehingga seluruh section dapat diatur independen. Satu-satunya perubahan pada event ialah `page_url` dapat menyimpan path kanonis `/b/{slug}`; constraint tiga event dan FK historis tidak berubah. Semua tabel tetap RLS dengan akses domain hanya dari modul server.

## Aturan baca dan integritas

- CTA publik hanya jika `products.is_active AND product_branches.is_active AND branches.is_active`. Nomor dari `branches.whatsapp_number`. Template: assignment → default situs. Label: assignment → cabang → default situs. FK assignment ke produk/cabang memakai `ON DELETE RESTRICT`.
- Kampanye eligible jika aktif, `active_from` kosong/≤ sekarang, dan `active_until` kosong/≥ sekarang. Tampilkan maksimal satu, urut `sort_order ASC`, `active_from DESC NULLS LAST`, `created_at DESC`, `id ASC`. Periode tumpang-tindih boleh tetapi CMS memberi peringatan.
- `events.event_name` hanya `PageView`, `ViewContent`, `Contact`. CHECK database: PageView tanpa produk/cabang/CTA; ViewContent wajib `product_id` dan snapshot `product_category`, tanpa cabang/CTA; Contact wajib produk, cabang, kedua snapshot, dan `cta='whatsapp'`. FK event ke produk/cabang `ON DELETE RESTRICT`; histori dipertahankan lewat deactivation dan snapshot.
- `event_id` unik: retry setara memakai baris lama, sedangkan payload berbeda material ditolak 409 oleh aplikasi. Index event mengikuti waktu, nama+waktu, sesi+waktu, produk+waktu, cabang+waktu, `utm_campaign`+waktu, dan `utm_source`+waktu. `products` diindeks menurut status+urutan; kampanye menurut status/urutan/periode.
- Atribusi UTM disnapshot pada tiap event; `anonymous_session_id` menghubungkan journey tanpa tabel sesi. Nilai sumber/kampanye yang tidak tersedia tetap kosong. Batas `metadata` 4 KiB dan validasi konteks/consent berada di server, bukan hanya pada CHECK database.

Event internal disimpan maksimal 24 bulan. Job terautentikasi menghapus event kadaluarsa per batch dan hanya mencatat jumlah/status; audit log tidak boleh memuat rahasia. Perubahan produksi hanya melalui migrasi yang ditinjau dan disetujui, tidak melalui build aplikasi. `supabase/seed.sql` tidak menggantikan migrasi Drizzle; reset lokal harus diikuti `pnpm db:migrate:local`.
