ALTER TABLE "content_sections" ADD COLUMN "public_title" text;
--> statement-breakpoint
UPDATE "content_sections"
SET "public_title" = CASE "section_key"
  WHEN 'gallery' THEN 'Galeri produk'
  WHEN 'products' THEN 'Pilihan produk'
  WHEN 'faq' THEN 'Pertanyaan yang sering ditanyakan'
  WHEN 'secondary_links' THEN 'Tautan lainnya'
  WHEN 'social_links' THEN 'Temukan kami'
  ELSE NULL
END;
--> statement-breakpoint
UPDATE "content_sections"
SET "sort_order" = "sort_order" + 10,
    "updated_at" = now();
--> statement-breakpoint
INSERT INTO "content_sections" (
  "branch_id",
  "section_key",
  "label",
  "public_title",
  "sort_order",
  "is_active"
)
VALUES (NULL, 'profile_logo', 'Logo profil', NULL, 0, true)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "content_sections" (
  "branch_id",
  "section_key",
  "label",
  "public_title",
  "sort_order",
  "is_active"
)
SELECT DISTINCT
  "branch_id",
  'profile_logo',
  'Logo profil',
  NULL,
  0,
  true
FROM "content_sections"
WHERE "branch_id" IS NOT NULL
ON CONFLICT DO NOTHING;
