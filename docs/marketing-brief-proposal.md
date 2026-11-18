# Proposal Brief Marketing — KGJ Link Bio & Meta Tracking Hub

**Status:** draft analisis berbasis repository, 16 November 2026.  
**Catatan sumber:** sesi **Marketing #2** tidak tersedia pada Document Control
yang terhubung dan tidak ada artefaknya di repository. Brief ini tidak
mengasumsikan keputusan dari sesi tersebut; lengkapi setelah tautan/transkrip
sesi tersedia.

## Ringkasan eksekutif

KGJ sudah memiliki fondasi produk untuk mengarahkan trafik dari Meta Ads,
Instagram, dan organik ke WhatsApp cabang yang tepat. Prioritas marketing
sekarang adalah mengoperasikan funnel itu dengan konten per cabang, URL iklan
ber-UTM yang disiplin, dan pengukuran yang benar—bukan menambah CRM, form lead,
atau tracking hasil penjualan.

Funnel P0 yang harus dipertahankan:

```text
Iklan / Instagram / organik → Link Bio cabang → pilih kebutuhan produk → WhatsApp cabang
```

CTA WhatsApp harus tetap langsung; kegagalan tracking tidak boleh menahan
navigasi. Batas P0 berhenti pada minat/`Contact`, bukan lead terverifikasi,
appointment, transaksi, atau revenue.

## Kapabilitas yang dapat dipakai Marketing

- Satu Link Bio aktif per cabang pada `/{slug-cabang}` dan satu cabang pilihan
  sebagai halaman root `/`.
- Konten cabang: profil, logo, kampanye unggulan, galeri, FAQ, tautan,
  susunan section, serta CTA produk WhatsApp yang dapat diatur tanpa redeploy.
- Produk adalah kategori/kebutuhan, dapat dipakai banyak cabang; CTA hanya
  muncul bila produk, assignment, dan cabang semuanya aktif.
- Analytics internal menyediakan `PageView`, `Contact`, dan `LinkClick`,
  performa CTA WhatsApp, peringkat produk, attribution UTM, serta ekspor CSV.
- Meta Pixel dan Conversions API bersifat opsional dan per cabang; hanya
  `technical_admin` mengelola kredensialnya.

## Brief kerja yang diusulkan

### Tujuan 30 hari

Membuktikan bahwa Link Bio per cabang dapat meningkatkan volume `Contact`
WhatsApp yang teratribusi, sambil menjaga alur pembukaan WhatsApp tetap mulus.

### Audiens dan pesan

| Elemen | Arahan |
| --- | --- |
| Audiens | Pengunjung Meta Ads, Instagram, dan organik yang mencari kategori perhiasan tertentu di area cabang. |
| Landing | Selalu gunakan URL Link Bio cabang yang relevan, bukan URL generik bila iklan memiliki target cabang. |
| Pesan utama | Jelaskan kebutuhan/produk dan alasan menghubungi cabang tersebut; CTA harus menyebut kategori produk yang dipilih. |
| Bukti visual | Gunakan banner 4:5 dan galeri visual khusus cabang; galeri bukan katalog dan tidak boleh dijadikan CTA produk tersembunyi. |
| CTA | Satu CTA WhatsApp langsung per kategori produk aktif, dengan label dan pesan yang jelas. |

### Struktur kampanye dan URL

Setiap destination URL Meta Ads wajib menyertakan:

```text
utm_source=meta
utm_medium=paid_social
utm_campaign=<nama-kampanye>
utm_content=<ad-set>
utm_term=<iklan>
```

Nilai tersebut adalah teks attribution, bukan ID Meta resmi. Tetapkan satu
konvensi penamaan yang mudah dibaca Marketing, misalnya
`2026-11_yogyakarta_cincin-nikah_prospecting` untuk `utm_campaign`, sebelum
iklan diluncurkan.

### KPI dan keputusan

| KPI | Definisi di sistem | Keputusan yang didukung |
| --- | --- | --- |
| Pembukaan | Total `PageView`; bukan unique visitor. | Bandingkan daya tarik kampanye/landing per periode. |
| Minat WhatsApp | `Contact` dengan produk dan cabang tervalidasi. | Tentukan produk, cabang, dan kreatif yang paling mendorong percakapan. |
| Rasio WhatsApp | `Contact ÷ PageView`. | Perbaiki urutan CTA, copy, atau kecocokan landing–iklan. |
| Klik link non-WhatsApp | `LinkClick`. | Nilai tautan katalog/sosial/custom tanpa mencampurkannya dengan minat produk. |
| Attribution | Source/campaign serta lima UTM tersimpan sampai `Contact`. | Alokasikan eksperimen dan anggaran berdasarkan kampanye yang membawa minat. |

Jangan menyimpulkan lead, pembelian, omzet, atau ROAS dari dashboard ini.
Outcome tersebut belum menjadi bagian P0 dan tidak boleh diimpor sebagai data
pelanggan ke sistem ini tanpa perubahan scope yang disetujui.

## Rencana aktivasi minimum

1. Marketing menyiapkan cabang aktif, nomor WhatsApp resmi, kategori produk,
   CTA, banner, galeri, FAQ, dan URL iklan ber-UTM untuk satu pilot cabang.
2. `technical_admin` memastikan gate production, Pixel ID, dan CAPI (bila
   dipakai) terkonfigurasi; jangan pernah menaruh token di materi atau browser.
3. Owner menyetujui kebijakan privasi dan melakukan satu smoke check live:
   buka URL ber-UTM, klik CTA WhatsApp, lalu periksa `Contact` dan—bila
   dikonfigurasi—event Meta dengan `event_id` yang sama.
4. Setelah periode pengamatan yang disepakati, bandingkan `PageView`,
   `Contact`, rasio WhatsApp, produk, cabang, dan `utm_campaign` dengan periode
   sebelumnya. Ubah satu variabel konten/kampanye pada satu waktu.

## Risiko dan keputusan yang perlu ditutup

1. **Sesi Marketing #2 belum terbaca.** Perlu tautan atau transkrip sebelum
   brief ini dinyatakan final.
2. **Status migrasi tidak konsisten.** `tasks/todo.md` mencatat owner melaporkan
   migrasi live berhasil, sedangkan status dokumen arsitektur masih menyebut
   migrasi lokal/live menunggu persetujuan. Owner perlu menetapkan satu status
   operasional yang benar sebelum aktivasi.
3. **Validasi automatic tracking belum tercatat fokus.** Catatan tugas menyebut
   browser check lama memakai consent flow yang sudah pensiun; lakukan smoke
   check sesuai kebijakan automatic tracking sekarang sebelum membelanjakan
   anggaran iklan.
4. **Kepatuhan privasi dan provider.** Tracking otomatis hanya boleh aktif
   setelah kebijakan privasi, konfigurasi Meta, dan review rilis disetujui.
5. **Disiplin operasional konten.** Mengganti slug cabang setelah URL dibagikan
   memutus tautan lama; gunakan slug stabil. Konten cabang harus diperiksa agar
   tidak salah nomor WhatsApp atau salah penugasan produk.

## Scope yang sengaja tidak diusulkan

Tidak ada form, CRM, sinkronisasi lead, appointment, katalog/detail produk,
checkout, tracking penjualan, GTM, ataupun dashboard revenue. Semua itu adalah
perubahan scope di luar funnel P0 saat ini.
