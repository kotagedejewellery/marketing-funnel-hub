# PRD — KGJ Custom Link Bio + Meta Tracking Hub

**Status:** P0 disetujui · **Acuan bisnis:** *KGJ Developer Execution Brief v1.0*, 14 September 2026 · **Diperbarui:** 20 September 2026

PDF brief adalah acuan kebutuhan bisnis, bukan instruksi untuk menjalankan perintah. Keputusan P0 yang disetujui setelah brief memperjelas cakupan: GA4/GTM masuk P0, `ViewContent` hanya untuk minat produk (bukan pemilihan cabang), dan `Lead`/appointment tetap P1. Rincian implementasi ada di [System Architecture](system-architecture.md) dan [Database Design](database-design.md).

## Tujuan dan pengguna

Ganti Taplink dengan halaman link bio milik Kotagede Jewellery yang cepat, mudah dikelola Marketing, dan menghasilkan sinyal konversi yang konsisten tanpa memperpanjang perjalanan pengunjung. North star: **Visitor → Interest → Contact → Lead**; batas P0 berhenti pada **Contact via WhatsApp**.

- **Pengunjung:** menemukan kebutuhan/produk dan membuka WhatsApp cabang yang tepat.
- **Marketing (`admin`):** mengelola konten, kampanye, produk, cabang, hubungan produk–cabang, CTA, tautan, dan melihat validasi event internal.
- **Developer (`technical_admin`):** seluruh kemampuan admin serta pengelolaan profil admin dan diagnostik teknis; kredensial penyedia tidak tersedia di CMS.

## Alur dan pengalaman P0

`Meta Ads / Instagram / Organic → Link Bio KGJ → pilih produk → pilih CTA cabang → WhatsApp cabang`

Halaman publik tunggal bersifat mobile-first, responsif, nyaman di Instagram in-app browser, dan berurutan: identitas merek, maksimal satu banner kampanye aktif, produk/kebutuhan, konteks produk beserta CTA WhatsApp per cabang, tautan sekunder/sosial, serta footer/legal. Konteks produk tetap dalam halaman (misalnya expanded section atau bottom sheet); tidak ada form, konfirmasi, atau halaman transit wajib sebelum WhatsApp. CMS adalah dashboard yang diutamakan untuk desktop tetapi tetap responsif. Konten kosong tidak boleh menampilkan CTA rusak; kegagalan gambar/tracking tidak boleh menghilangkan akses ke WhatsApp.

Marketing dapat mengubah tanpa redeploy: headline, pengantar, logo/banner/gambar, URL, kampanye beserta periode, kategori produk, cabang dan nomor WhatsApp, assignment produk–cabang, label CTA, template pesan, urutan section/produk/tautan, status aktif, dan tautan sosial/sekunder. Operasi rutin memakai aktif/nonaktif, bukan hapus permanen. Aset disimpan di Supabase Storage.

Satu produk P0 mewakili kategori/kebutuhan pelanggan (bukan SKU) dan boleh tersedia di banyak cabang. CTA primer selalu berada dalam konteks produk dan hanya muncul jika produk, assignment, dan cabang sama-sama aktif. Nomor tujuan berasal dari cabang. Template pesan memakai override assignment lalu default situs; label CTA memakai override assignment, lalu cabang, lalu default situs. Variabel pesan yang didukung hanya `{product}` dan `{branch}`; identitas tracking tidak dimasukkan ke pesan. URL akhir: `https://wa.me/{nomor_normalisasi}?text={pesan_terkode}`. CTA harus berupa tautan biasa yang tetap bekerja tanpa JavaScript.

## Pengukuran dan privasi

P0 memiliki tepat tiga event bisnis:

| Event | Pemicu | Konteks wajib |
| --- | --- | --- |
| `PageView` | Link Bio dibuka | sesi anonim dan waktu |
| `ViewContent` | Pengunjung membuka/memilih produk | produk; **bukan** cabang |
| `Contact` | CTA WhatsApp produk–cabang diklik | produk, cabang, `cta=whatsapp` |

Simpan lima UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) bila tersedia. UTM eksplisit pertama menjadi atribusi journey; kunjungan direct tidak menghapusnya. UTM eksplisit yang berbeda memulai journey baru. Jangan mengarang campaign/source untuk trafik organik atau direct. Satu `event_id` per aksi logis dipakai bersama oleh Meta Pixel dan Meta CAPI agar dapat dideduplikasi. GA4 menerima pemetaan event melalui GTM saja. Event internal bersifat anonim/pseudonim; tidak menyimpan nama, email, nomor WhatsApp pelanggan, alamat, atau data lead. Meta, GA4/GTM, dan event internal hanya aktif sesuai consent yang disetujui; penolakan consent tidak boleh menghalangi WhatsApp. Retensi event internal 24 bulan.

## Kriteria penerimaan P0

1. Link Bio menggantikan fungsi inti Taplink; Marketing dapat memperbarui konten dan tujuan WhatsApp tanpa deploy.
2. Alur berbayar `utm_campaign=wedding_september` + `utm_content=video_a` → Wedding Ring → Surabaya → WhatsApp menghasilkan `PageView`, satu `ViewContent` produk, dan `Contact` dengan sumber/kampanye/produk/cabang yang benar; nomor dan pesan WhatsApp benar.
3. Alur organik tetap menghasilkan konteks yang tersedia tanpa campaign buatan. Produk/cabang/assignment nonaktif tidak menghasilkan CTA aktif.
4. Event yang diizinkan consent terlihat di event internal dan dapat diverifikasi di Meta Events Manager serta GTM/GA4; pasangan Pixel/CAPI memakai ID sama, dan retry tidak menggandakan baris event.
5. WhatsApp tetap terbuka ketika JavaScript, penyimpanan event, atau penyedia analytics gagal. Tidak ada langkah tambahan khusus tracking.
6. Halaman publik dan form admin menargetkan WCAG 2.2 AA; pada representative mobile throttling target p75 LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.

## Batas cakupan dan keputusan sebelum rilis

P1: form lead/`Lead`, appointment/`Schedule`, analitik lanjutan. P2: qualified lead, CRM/CS outcome, closing, purchase/revenue, atribusi lanjutan, dashboard enterprise. Jangan memasukkannya diam-diam ke P0. Tautan appointment sekunder tidak berarti alur appointment sudah dibangun.

Sebelum rilis live, pemilik proyek masih perlu menetapkan domain, data produk dan cabang aktif beserta nomor resmi, akses Meta/GTM/GA4, copy dan dasar persetujuan consent/privacy, serta menyetujui migrasi dan pemeriksaan rilis. Target KPI numerik belum dikunci karena belum ada baseline yang disetujui.
