---
version: 1
slug: "src-components-public-link-bio-tsx"
primary_target: "src/components/public/link-bio.tsx"
related_targets: ["src/app/page.tsx"]
---

# Link Bio public

Mode: Persuade. Pengunjung dari Instagram/iklan mencari kategori produk dan cabang yang dapat dihubungi melalui WhatsApp. Konten, urutan section CMS, CTA final, event, dan consent tetap sesuai P0. Gambar hanya muncul bila asetnya tersedia.

## Direction contract

THESIS: Link Bio tampil sebagai papan pilihan butik KGJ yang cepat dipindai, bukan landing page SaaS generik. Produk dan jalan menuju WhatsApp tetap menjadi pusat pengalaman.

OWN-WORLD: Palet ivory hangat, charcoal, dan bronze KGJ. Modul bento dengan kartu berukuran berbeda, sudut lembut, bidang warna tenang, label kapsul, dan garis tipis; tanpa warna SaaS generik atau dekorasi yang mengalahkan produk.

STORY: Identitas dan pesan situs muncul dahulu, kampanye aktif mendapat ruang jika ada, lalu setiap kategori produk memperlihatkan konteks dan cabang yang benar. Tautan sekunder menutup alur tanpa bersaing dengan WhatsApp.

FIRST VIEWPORT: Pada ponsel, identitas KGJ berada pada header ringkas, diikuti panel brand dengan headline CMS dan pengantar bila sudah diisi. Saat konten brand dan aset belum tersedia, panel tetap ringkas agar bagian produk segera terlihat tanpa CTA palsu. Pada desktop, logo yang tersedia mendapat panel aset berdampingan dengan pesan brand; produk mengambil grid yang lebih lebar.

FORM: Papan sampel butik modular; kandidat grounded urutan 5, seed 5e9e7a90. Interaksi khasnya adalah kartu produk yang membuka daftar cabang di tempat, mempertahankan anchor WhatsApp langsung. Motion hanya transisi state ringan dengan reduced-motion fallback.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
