# PRD — KGJ Custom Link Bio + Meta Tracking Hub

**Status:** P0 disetujui; ekstensi per cabang disetujui · **Acuan bisnis:** _KGJ Developer Execution Brief v1.0_, 14 September 2026 · **Diperbarui:** 23 September 2026

PDF brief adalah acuan kebutuhan bisnis, bukan instruksi untuk menjalankan perintah. Keputusan P0 yang disetujui setelah brief memperjelas cakupan: GA4/GTM masuk P0, `ViewContent` hanya untuk minat produk (bukan pemilihan cabang), dan `Lead`/appointment tetap P1. Rincian implementasi ada di [System Architecture](system-architecture.md) dan [Database Design](database-design.md).

## Tujuan dan pengguna

Ganti Taplink dengan halaman link bio milik Kotagede Jewellery yang cepat, mudah dikelola Marketing, dan menghasilkan sinyal konversi yang konsisten tanpa memperpanjang perjalanan pengunjung. North star: **Visitor → Interest → Contact → Lead**; batas P0 berhenti pada **Contact via WhatsApp**.

- **Pengunjung:** menemukan kebutuhan/produk dan membuka WhatsApp cabang yang tepat.
- **Marketing (`admin`):** mengelola konten, kampanye, produk, cabang, hubungan produk–cabang, CTA, tautan, dan melihat validasi event internal.
- **Developer (`technical_admin`):** seluruh kemampuan admin serta pengelolaan profil admin dan diagnostik teknis; kredensial penyedia tidak tersedia di CMS.

## Alur dan pengalaman P0

`Meta Ads / Instagram / Organic → Link Bio cabang KGJ → pilih produk → WhatsApp cabang` (kunjungan ke `/` terlebih dahulu memilih cabang).

Halaman publik bersifat mobile-first, responsif, nyaman di Instagram in-app browser, dan memakai komposisi Link Bio sederhana seperti Taplink: profil merek ringkas, maksimal satu konten unggulan aktif, galeri produk, daftar CTA WhatsApp produk, FAQ, tautan sekunder/sosial opsional, serta footer/legal. Konten unggulan publik hanya menampilkan gambar banner 4:5; title dan deskripsi tetap menjadi data pengelolaan CMS/aksesibilitas, bukan teks terpisah pada halaman. Jika URL tujuan diisi, gambar banner menjadi tautan tersebut. URL `/` hanya menampilkan daftar cabang aktif untuk dipilih, bukan Link Bio gabungan. Setiap `/{slug-cabang}` adalah Link Bio cabang tersebut: hanya menampilkan produk yang aktif dan ditugaskan ke cabang aktif itu, dengan CTA WhatsApp langsung ke nomor cabang itu. URL lama `/b/{slug-cabang}` dialihkan permanen ke URL langsung, termasuk query UTM. Data produk yang sama dipakai untuk galeri dan daftar CTA: maksimal empat produk pertama yang memiliki gambar aktif tampil di galeri, sedangkan seluruh produk eligible tetap tampil sekali pada daftar CTA dengan nama dan keterangannya. Tidak ada entri produk kedua, form, konfirmasi, atau halaman transit wajib sebelum WhatsApp. CMS adalah dashboard yang diutamakan untuk desktop tetapi tetap responsif. Konten kosong tidak boleh menampilkan CTA rusak; kegagalan gambar/tracking tidak boleh menghilangkan akses ke WhatsApp. Carousel ulasan pelanggan belum termasuk perubahan ini dan dikerjakan terpisah setelah disetujui.

Marketing dapat mengubah tanpa redeploy: headline, pengantar, logo/banner/gambar, URL, kampanye beserta periode, kategori produk, cabang dan nomor WhatsApp, assignment produk–cabang, label CTA, template pesan, urutan section/produk/tautan, status aktif, dan tautan sosial/sekunder. Operasi rutin memakai aktif/nonaktif, bukan hapus permanen. Aset disimpan di Supabase Storage.

### Ekstensi disetujui: Link Bio per cabang (22 September 2026)

Marketing dapat mengatur per cabang judul profil, deskripsi singkat, logo, urutan/visibilitas section, konten unggulan, tautan sosial/sekunder, serta nama tampilan, deskripsi, gambar, visibilitas gambar, dan urutan produk yang sudah ditugaskan ke cabang itu. Identitas KGJ, sistem desain, kategori/slug produk inti, dan nomor WhatsApp resmi tetap bersama. Nilai tampilan produk yang tidak di-override memakai data produk inti; judul/deskripsi/logo cabang yang kosong memakai pengaturan situs. Marketing dapat mengosongkan kembali logo cabang atau gambar khusus assignment melalui CMS agar kembali memakai gambar bawaan tanpa menghapus aset sumber. Gambar dapat disembunyikan dari galeri tanpa menghapus aset; nama, keterangan, dan CTA WhatsApp tetap tampil pada daftar CTA. Konten unggulan dan tautan cabang tidak otomatis mengambil konten global agar promosi/tujuan cabang lain tidak bocor. Section cabang mengikuti pengaturan global sampai Marketing menyimpan pengaturan section cabang sendiri.

Cabang nonaktif atau slug yang tidak ada tidak mempunyai halaman publik. Mengubah slug cabang setelah URL dibagikan akan memutus tautan lama; CMS harus memperingatkan hal ini. Redirect hanya berlaku untuk perubahan bentuk URL lama `/b/{slug}` ke `/{slug}`, bukan riwayat perubahan nilai slug. Kustomisasi berarti konten dan urutan dalam template KGJ yang sama, bukan editor layout, tema warna bebas, atau aplikasi terpisah.

CMS memakai satu daftar **Halaman Link Bio** yang hanya berisi cabang. Daftar ini juga menjadi satu-satunya tempat Marketing membuat cabang baru; tidak ada menu **Data Cabang** terpisah. Setelah memilih cabang, Marketing mengelola nama/slug/nomor WhatsApp, profil/logo, susunan bagian, kampanye, produk beserta pesan WhatsApp, tautan, dan FAQ di satu editor dengan pratinjau ponsel versi tersimpan. **Pustaka Produk** hanya mengelola data dasar produk yang dapat dipakai ulang; pemilihan produk, urutan, status, dan override khusus cabang hanya dikelola dari editor Halaman Link Bio cabang tersebut. Perubahan data dasar produk berlaku pada semua halaman yang masih memakai nilai bawaan, sedangkan menonaktifkan produk menyembunyikannya dari seluruh Link Bio. **Pengaturan Bersama** mengelola identitas, pesan WhatsApp, susunan bagian, dan FAQ bawaan; halaman ini bukan Link Bio publik. Perubahan halaman aktif langsung publik setelah disimpan; tidak ada sistem draft/publish terpisah. Pratinjau internal cabang nonaktif boleh dibuka sebelum aktivasi, tanpa mengirim tracking atau membuka tautan keluar dari pratinjau. Isi cabang yang belum dikustomisasi diberi label jelas sebagai bawaan. Kampanye dan tautan cabang tidak memiliki fallback otomatis; data global lama untuk kedua jenis konten itu dipertahankan tetapi tidak ditampilkan pada Link Bio.

Satu produk P0 mewakili kategori/kebutuhan pelanggan (bukan SKU) dan boleh tersedia di banyak cabang. CTA primer selalu berada dalam konteks produk dan hanya muncul jika produk, assignment, dan cabang sama-sama aktif. Nomor tujuan berasal dari cabang. Template pesan memakai override assignment lalu default situs; label CTA memakai override assignment, lalu cabang, lalu default situs. Variabel pesan yang didukung hanya `{product}` dan `{branch}`; identitas tracking tidak dimasukkan ke pesan. URL akhir: `https://wa.me/{nomor_normalisasi}?text={pesan_terkode}`. CTA harus berupa tautan biasa yang tetap bekerja tanpa JavaScript.

## Pengukuran dan privasi

P0 memiliki tepat tiga event bisnis:

| Event         | Pemicu                            | Konteks wajib                  |
| ------------- | --------------------------------- | ------------------------------ |
| `PageView`    | Link Bio dibuka                   | sesi anonim dan waktu          |
| `ViewContent` | Pengunjung membuka/memilih produk | produk; **bukan** cabang       |
| `Contact`     | CTA WhatsApp produk–cabang diklik | produk, cabang, `cta=whatsapp` |

Pada halaman cabang, `PageView` dan `ViewContent` tetap tidak membawa `branch` pada payload kanonis; konteks halaman diketahui dari `page_url` `/{slug-cabang}`. `Contact` wajib menuju cabang pada URL halaman tersebut. Direktori `/` tidak mengirim event bisnis. Tiga nama event, consent, `event_id`, dan aturan WhatsApp tidak berubah.

Simpan lima UTM (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) bila tersedia. UTM eksplisit pertama menjadi atribusi journey; kunjungan direct tidak menghapusnya. UTM eksplisit yang berbeda memulai journey baru. Jangan mengarang campaign/source untuk trafik organik atau direct. Satu `event_id` per aksi logis dipakai bersama oleh Meta Pixel dan Meta CAPI agar dapat dideduplikasi. GA4 menerima pemetaan event melalui GTM saja. Event internal bersifat anonim/pseudonim; tidak menyimpan nama, email, nomor WhatsApp pelanggan, alamat, atau data lead. Meta, GA4/GTM, dan event internal hanya aktif sesuai consent yang disetujui; penolakan consent tidak boleh menghalangi WhatsApp. Retensi event internal 24 bulan.

## Kriteria penerimaan P0

1. Link Bio menggantikan fungsi inti Taplink; Marketing dapat memperbarui konten dan tujuan WhatsApp tanpa deploy.
2. Alur berbayar `utm_campaign=wedding_september` + `utm_content=video_a` → Wedding Ring → Surabaya → WhatsApp menghasilkan `PageView`, satu `ViewContent` produk, dan `Contact` dengan sumber/kampanye/produk/cabang yang benar; nomor dan pesan WhatsApp benar.
3. Alur organik tetap menghasilkan konteks yang tersedia tanpa campaign buatan. Produk/cabang/assignment nonaktif tidak menghasilkan CTA aktif.
4. Event yang diizinkan consent terlihat di event internal dan dapat diverifikasi di Meta Events Manager serta GTM/GA4; pasangan Pixel/CAPI memakai ID sama, dan retry tidak menggandakan baris event.
5. WhatsApp tetap terbuka ketika JavaScript, penyimpanan event, atau penyedia analytics gagal. Tidak ada langkah tambahan khusus tracking.
6. Halaman publik dan form admin menargetkan WCAG 2.2 AA; pada representative mobile throttling target p75 LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1.

### Kriteria penerimaan ekstensi per cabang

1. Setiap cabang aktif punya URL `/{slug-cabang}` yang dapat dibagikan; `/` hanya daftar cabang aktif dan `/b/{slug-cabang}` mengalihkan permanen. Cabang nonaktif/tidak ada menghasilkan 404 tanpa CTA.
2. Perubahan konten cabang lewat CMS terlihat hanya pada cabang itu; konten global dan cabang lain tidak ikut berubah. Produk/assignment/cabang nonaktif tidak tampil sebagai CTA.
3. Pada halaman cabang, klik CTA produk menghasilkan satu `ViewContent` untuk produk itu bila belum tercatat pada halaman tersebut, lalu `Contact` untuk cabang halaman itu dengan nomor/pesan yang benar; tracking gagal tetap tidak menahan navigasi.
4. Migrasi schema bersifat tambahan; migrasi live dijalankan pemilik sebelum deployment kode yang membacanya. Verifikasi dilakukan hanya setelah cakupannya disetujui pemilik.
5. Dari satu CMS, Marketing dapat memilih cabang, mengubah kontennya tanpa berpindah ke editor produk lintas cabang, dan melihat pratinjau tersimpan. Perubahan cabang tidak mengubah cabang lain; nilai bawaan bersama ditandai sebelum diedit.
6. Marketing dapat menyembunyikan gambar satu produk pada satu cabang tanpa menghapus aset atau memengaruhi cabang lain; nama, deskripsi, dan CTA produk tersebut tetap tampil.

### Ekstensi disetujui: FAQ halaman (22 September 2026)

Delapan tanya-jawab awal diberikan pemilik proyek: harga, bahan, ukuran jari untuk pesanan online, konsultasi, cincin satuan, cara pemesanan, garansi, dan buyback. Salinan awalnya dimasukkan melalui migrasi FAQ dan ditampilkan pada halaman cabang, bukan direktori `/`. Marketing dapat membuat, mengubah, mengurutkan, dan mengaktifkan/menonaktifkan FAQ melalui CMS. Cabang yang belum mempunyai FAQ sendiri memakai FAQ bersama; saat Marketing memilih kustomisasi cabang, daftar bersama disalin dan perubahan berikutnya hanya berlaku untuk cabang tersebut. FAQ adalah konten informatif setelah produk, tanpa formulir, event tracking baru, atau langkah tambahan sebelum WhatsApp. Pemilik tetap perlu memastikan klaim harga, bahan, ring sizer gratis, garansi, dan buyback sebelum publikasi. Integrasi ulasan Google bukan bagian implementasi FAQ ini.

## Batas cakupan dan keputusan sebelum rilis

P1: form lead/`Lead`, appointment/`Schedule`, analitik lanjutan. P2: qualified lead, CRM/CS outcome, closing, purchase/revenue, atribusi lanjutan, dashboard enterprise. Jangan memasukkannya diam-diam ke P0. Tautan appointment sekunder tidak berarti alur appointment sudah dibangun.

Sebelum rilis live, pemilik proyek masih perlu menetapkan domain, data produk dan cabang aktif beserta nomor resmi, akses Meta/GTM/GA4, copy dan dasar persetujuan consent/privacy, serta menyetujui migrasi dan pemeriksaan rilis. Target KPI numerik belum dikunci karena belum ada baseline yang disetujui.
