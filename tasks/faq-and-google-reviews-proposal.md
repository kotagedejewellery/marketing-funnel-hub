# Usulan fitur: FAQ dan ulasan Google per cabang

**Status:** bagian FAQ disetujui untuk implementasi pada 22 September 2026; integrasi ulasan Google tetap draf. **Keputusan yang sudah diberikan:** ulasan yang ditampilkan hanya berbintang 4–5; pemilik memiliki akses pengelola ke seluruh Google Business Profile cabang.

## Tujuan dan asumsi

Menjawab pertanyaan umum tanpa menghalangi CTA WhatsApp, serta menampilkan ulasan Google asli yang relevan dengan cabang pada `/b/{slug}`. Asumsi untuk persetujuan: delapan FAQ di bawah menjadi konten awal bersama di `/` dan semua halaman cabang; cabang dapat memiliki daftar FAQ sendiri setelah diubah melalui CMS. Ulasan hanya muncul di halaman cabang, tidak digabung atau dirata-ratakan di `/`.

## Cakupan dan perilaku

- CMS dapat membuat, mengubah, mengurutkan, mengaktifkan, dan menonaktifkan FAQ. Form pertanyaan/jawaban divalidasi server-side; perubahan tercatat di audit log. Satu tabel `faqs` dengan `branch_id` nullable: `NULL` adalah daftar awal/global. Bila cabang belum punya daftar sendiri, tampilkan daftar global; setelah cabang menyimpan daftar sendiri, tampilkan daftar cabang saja. FAQ publik berupa accordion sederhana.
- Setiap cabang boleh mempunyai satu Google Place ID. Server mengambil Place Details (New) dengan kredensial server-only; pilih hanya ulasan berbintang 4 atau 5, maksimal tiga kartu dari hasil API. Places API (New) mengembalikan paling banyak lima ulasan yang dipilih Google berdasarkan relevansi; karena itu tiga kartu **tidak dijamin**. Jika tidak ada ulasan yang memenuhi, bagian ulasan boleh tidak tampil. Jangan mengarang atau menyalin ulasan ke database.
- Tampilkan label eksplisit "Pilihan ulasan bintang 4–5 dari Google Maps", atribusi Google Maps dan penulis, serta tautan sumber tiap ulasan. Bila menampilkan rating rata-rata lokasi, gunakan angka agregat Google yang tidak difilter dan beri label yang jelas. Kegagalan Google tidak memengaruhi konten lain atau WhatsApp.
- Tidak ada event tracking baru, dependensi UI baru, dashboard review, moderasi review, atau penyimpanan teks/avatar ulasan. Situs harus memenuhi kebijakan tampilan dan penggunaan data Google sebelum fitur ulasan diaktifkan.

## Konten FAQ awal

1. **Harganya berapa?**  
   Untuk harga bervariasi nih kak menyesuaikan bahan dan kadar yang kakak inginkan. Cincin Premium mulai 10 Juta sepasang dan mulai 15 Juta untuk Nusantara Series.

   Bisa juga disesuaikan dengan alokasi dana kakak 😊

2. **Bahannya ada apa aja?**  
   Untuk bahannya kami menyediakan cincin dari bahan:

   - Emas Putih 9K, 12K, 18K
   - Emas Kuning 9K, 12K, 18K
   - Palladium 10%, 25%, 50%
   - Whiterock Platinum 950

3. **Kalau pesan online, ukur jarinya gimana?**  
   Tenang kak 🥰... untuk kakak yang tidak bisa ukur jari di offline store, kami kirimkan free ring sizer (alat ukur jari) yang praktis dan akurat.

   Untuk info lengkapnya bisa lanjut konsultasi ya kak 🫶

4. **Konsultasi dulu boleh nggak sih?**  
   Boleh dong kak 🥰... kakak bebas tanya apa aja, minko siap bantu semaksimal mungkin. Langsung klik tombol konsultasi diatas ya kak.

5. **Pesan cincin satuan bisa ngga?**  
   Custom cincin di Kotagede Jewellery bisa single (satuan) juga ya kak, kami menyediakan bahan dari Palladium, Whiterock Platinum, Emas Putih, Kuning, dan Rosegold. 🥰

   Untuk info lengkapnya lanjut konsultasi dengan klik tombol diatas ya kak.

6. **Gimana cara pesennya?**  
   Untuk pemesanan online:

   1. Konsultasi dulu via Whatsapp (klik tombol konsultasi atau ambil promo diatas)
   2. Pilih model dan jenis serta kadar cincin
   3. Ukur jari
   4. Isi form pemesanan
   5. Transfer DP / Lunas
   6. Cincin masuk produksi
   7. Selesai kami konfirmasi + gambar, kalau OK kami kirim cincinya

   Untuk info lengkapnya lanjut konsultasi dengan klik tombol diatas ya kak.

7. **Apakah ada garansi kalau cincinnya rusak atau ukurannya nggak pas?**  
   Ada banget, Kak! Kenyamanan Kakak adalah prioritas utama kami. Setiap pembelian cincin sudah dilengkapi dengan Garansi Panjang 3 hingga 10 Tahun. Garansi meliputi Garansi Resize, Garansi Rhodium ulang, Garansi Ukir Nama ulang, Garansi hasil jadi, Garansi Pengiriman dan Garansi pasang permata kembali.

8. **Cincinnya bisa dijual kembali?**  
   Mohon maaf kak, Kotagede Jewellery TIDAK BISA BUYBACK atau beli kembali apabila telah terjadi transaksi atau akad jual beli antara customer dan Kotagede Jewellery.

   Kotagede Jewellery tidak membeli kembali cincin yang telah dipesan oleh customer, karena kami berharap pernikahan kakak akan selalu langgeng kak ☺️

   Namun jika kakak bosan dengan modelnya, bisa kami bantu lebur ulang ganti model 😊

Sebelum tayang live, pemilik mengonfirmasi klaim harga, bahan, ring sizer gratis, masa/cakupan garansi, dan kebijakan buyback. Ejaan/tanda baca dirapikan untuk keterbacaan tanpa mengubah makna.

## Lokasi kode dan standar

Ikuti modul saat ini: `src/lib/db/schema.ts` + migrasi Drizzle untuk data, `src/modules/public-content` untuk bacaan publik, `src/modules/admin` untuk CMS/Auth/Zod/audit, dan `src/components/public/link-bio.tsx` untuk tampilan. Nama database `snake_case`, UUID PK, `timestamptz`, `is_active`, dan urutan deterministik. Misalnya, validasi pertanyaan menggunakan `z.string().trim().min(1).max(200)` pada Server Action; batas jawaban ditetapkan sebelum implementasi. Kredensial Google tidak masuk browser atau CMS.

Perintah proyek yang relevan: `pnpm dev`, `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm typecheck`. Migrasi live tetap ditinjau dan dijalankan pemilik secara terpisah; tidak dipicu saat build.

## Verifikasi dan batas tindakan

Saat fitur selesai, usulkan pemeriksaan terfokus untuk: fallback FAQ global/cabang, filter 4–5 dan kondisi Google gagal, serta satu pemeriksaan tampilan manual. Jalankan hanya setelah pemilik menyetujui cakupan tes. Jangan melakukan scraping Maps, menyimpan ulasan Google secara permanen, menambah event tracking, atau menahan WhatsApp karena API Google.

## Kriteria selesai dan keputusan terbuka

1. FAQ awal tampil di `/` dan halaman cabang; CMS dapat mengubahnya tanpa deploy, dengan audit dan validasi.
2. `/b/{slug}` hanya menampilkan ulasan lokasi cabang tersebut yang berbintang 4–5 dan tersedia dari Google, dengan atribusi/sumber/filter yang jelas; `/` tidak mencampur ulasan cabang.
3. Jika Place ID/key belum disediakan atau Google gagal, halaman dan CTA WhatsApp tetap berfungsi.

**Perlu persetujuan:** (a) apakah batas maksimal lima ulasan yang disediakan Places API (New), sehingga hasil filter mungkin kurang dari tiga kartu, dapat diterima; (b) apakah asumsi fallback FAQ global ke cabang benar; (c) apakah copy FAQ di atas sudah boleh tayang setelah klaim bisnis ditinjau. Jika butuh penelusuran seluruh ulasan, Google Business Profile Reviews API perlu akses API yang disetujui Google dan OAuth; itu menjadi rancangan integrasi berbeda.

Setelah disetujui, perbarui hanya `docs/prd.md`, `docs/system-architecture.md`, dan `docs/database-design.md` sebagai sumber resmi lalu implementasikan perubahan minimum. Referensi kebijakan Google: [Places review limit](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places), [attribution and filtering](https://developers.google.com/maps/documentation/places/web-service/policies), [Business Profile review list](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list).
