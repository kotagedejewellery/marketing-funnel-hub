---
version: 1
slug: "src-components-public-link-bio-tsx"
primary_target: "src/components/public/link-bio.tsx"
related_targets: ["src/app/page.tsx"]
---

# Link Bio public

Mode: Persuade. Pengunjung dari Instagram/iklan mencari kategori produk dan cabang yang dapat dihubungi melalui WhatsApp. Konten, urutan section CMS, CTA final, dan event tetap sesuai P0. Tracking otomatis mengikuti gate environment tanpa panel consent; gambar hanya muncul bila asetnya tersedia.

## Direction contract

THESIS: Link Bio tampil sebagai papan pilihan butik KGJ yang cepat dipindai, bukan landing page SaaS generik. Produk dan jalan menuju WhatsApp tetap menjadi pusat pengalaman.

OWN-WORLD: Palet ivory hangat, charcoal, dan bronze KGJ. Modul bento dengan kartu berukuran berbeda, sudut lembut, bidang warna tenang, label kapsul, dan garis tipis; tanpa warna SaaS generik atau dekorasi yang mengalahkan produk.

STORY: Profil cabang muncul dahulu, konten unggulan mendapat ruang jika ada, kemudian galeri produk memperkenalkan pilihan sebelum daftar CTA WhatsApp menyelesaikan tindakan. FAQ dan tautan opsional menutup alur tanpa bersaing dengan WhatsApp.

FIRST VIEWPORT: Pada ponsel, profil cabang terpusat menampilkan satu logo, nama cabang, judul/deskripsi opsional, lalu jalan pintas ke produk. Tidak ada header situs atau panel logo kedua. Konten unggulan tampil linear sesudah profil sebagai gambar banner 4:5 tanpa title/deskripsi publik terpisah; jika memiliki tujuan, gambar menjadi tautan. Lebar desktop tetap menyerupai Link Bio, bukan berubah menjadi landing page lebar.

FORM: Papan pilihan butik linear yang mengadaptasi pola Taplink tanpa drag-and-drop. Galeri milik cabang berdiri sendiri dari produk dan CTA: satu gambar tampil tunggal, dua memakai grid, dan tiga sampai enam menjadi native horizontal scroll-snap rail pada ponsel dengan tepi kartu berikutnya tetap terlihat; mulai `sm`, galeri kembali menjadi grid tiga kolom. Sisanya dibuka melalui disclosure native **Lihat semua koleksi** dengan aturan layout yang sama. Galeri menerima gambar 4:5, alt text wajib, serta judul/keterangan opsional tanpa CTA, autoplay, dependency carousel, atau tracking. Daftar produk tetap berupa CTA gelap berisi ikon WhatsApp, nama, keterangan, dan label aksi. Tidak ada carousel ulasan pada tahap ini. Motion hanya transisi state ringan dengan reduced-motion fallback.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
