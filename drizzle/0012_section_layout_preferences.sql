ALTER TABLE "content_sections"
  ADD COLUMN "spacing_after" text DEFAULT 'normal' NOT NULL,
  ADD COLUMN "show_divider" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "content_sections"
  ADD CONSTRAINT "content_sections_spacing_after_check"
  CHECK ("content_sections"."spacing_after" in ('compact', 'normal', 'relaxed'));
