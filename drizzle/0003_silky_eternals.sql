CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faqs_branch_sort_idx" ON "faqs" USING btree ("branch_id","sort_order");--> statement-breakpoint
REVOKE ALL ON TABLE public.faqs FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.faqs TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.faqs FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
UPDATE public.content_sections AS section
SET sort_order = section.sort_order + 1, updated_at = now()
WHERE section.branch_id IS NULL
  AND section.sort_order > (
    SELECT sort_order FROM public.content_sections
    WHERE branch_id IS NULL AND section_key = 'products'
  );--> statement-breakpoint
INSERT INTO public.content_sections (section_key, label, sort_order)
SELECT 'faq', 'FAQ', sort_order + 1
FROM public.content_sections
WHERE branch_id IS NULL AND section_key = 'products';--> statement-breakpoint
UPDATE public.content_sections AS section
SET sort_order = section.sort_order + 1, updated_at = now()
FROM public.content_sections AS products_section
WHERE section.branch_id = products_section.branch_id
  AND products_section.section_key = 'products'
  AND section.branch_id IS NOT NULL
  AND section.sort_order > products_section.sort_order;--> statement-breakpoint
INSERT INTO public.content_sections (branch_id, section_key, label, sort_order)
SELECT branch_id, 'faq', 'FAQ',
       COALESCE(MAX(sort_order) FILTER (WHERE section_key = 'products'), MAX(sort_order)) + 1
FROM public.content_sections
WHERE branch_id IS NOT NULL
GROUP BY branch_id;--> statement-breakpoint
INSERT INTO public.faqs (question, answer, sort_order) VALUES
  ('Harganya berapa?', $faq$Untuk harga bervariasi nih kak menyesuaikan bahan dan kadar yang kakak inginkan. Cincin Premium mulai 10 Juta sepasang dan mulai 15 Juta untuk Nusantara Series.

Bisa juga disesuaikan dengan alokasi dana kakak 😊$faq$, 0),
  ('Bahannya ada apa aja?', $faq$Untuk bahannya kami menyediakan cincin dari bahan:

- Emas Putih 9K, 12K, 18K
- Emas Kuning 9K, 12K, 18K
- Palladium 10%, 25%, 50%
- Whiterock Platinum 950$faq$, 10),
  ('Kalau pesan online, ukur jarinya gimana?', $faq$Tenang kak 🥰... untuk kakak yang tidak bisa ukur jari di offline store, kami kirimkan free ring sizer (alat ukur jari) yang praktis dan akurat.

Untuk info lengkapnya bisa lanjut konsultasi ya kak 🫶$faq$, 20),
  ('Konsultasi dulu boleh nggak sih?', $faq$Boleh dong kak 🥰... kakak bebas tanya apa aja, minko siap bantu semaksimal mungkin. Langsung klik tombol konsultasi diatas ya kak.$faq$, 30),
  ('Pesan cincin satuan bisa ngga?', $faq$Custom cincin di Kotagede Jewellery bisa single (satuan) juga ya kak, kami menyediakan bahan dari Palladium, Whiterock Platinum, Emas Putih, Kuning, dan Rosegold. 🥰

Untuk info lengkapnya lanjut konsultasi dengan klik tombol diatas ya kak.$faq$, 40),
  ('Gimana cara pesennya?', $faq$Untuk pemesanan online:

1. Konsultasi dulu via Whatsapp (klik tombol konsultasi atau ambil promo diatas)
2. Pilih model dan jenis serta kadar cincin
3. Ukur jari
4. Isi form pemesanan
5. Transfer DP / Lunas
6. Cincin masuk produksi
7. Selesai kami konfirmasi + gambar, kalau OK kami kirim cincinya

Untuk info lengkapnya lanjut konsultasi dengan klik tombol diatas ya kak.$faq$, 50),
  ('Apakah ada garansi kalau cincinnya rusak atau ukurannya nggak pas?', $faq$Ada banget, Kak! Kenyamanan Kakak adalah prioritas utama kami. Setiap pembelian cincin sudah dilengkapi dengan Garansi Panjang 3 hingga 10 Tahun. Garansi meliputi Garansi Resize, Garansi Rhodium ulang, Garansi Ukir Nama ulang, Garansi hasil jadi, Garansi Pengiriman dan Garansi pasang permata kembali.$faq$, 60),
  ('Cincinnya bisa dijual kembali?', $faq$Mohon maaf kak, Kotagede Jewellery TIDAK BISA BUYBACK atau beli kembali apabila telah terjadi transaksi atau akad jual beli antara customer dan Kotagede Jewellery.

Kotagede Jewellery tidak membeli kembali cincin yang telah dipesan oleh customer, karena kami berharap pernikahan kakak akan selalu langgeng kak ☺️

Namun jika kakak bosan dengan modelnya, bisa kami bantu lebur ulang ganti model 😊$faq$, 70);
