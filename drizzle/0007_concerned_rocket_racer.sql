CREATE TABLE "branch_google_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"source_hash" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_photo_url" text,
	"reviewer_review_count" integer,
	"rating" integer NOT NULL,
	"relative_time" text NOT NULL,
	"review_text" text NOT NULL,
	"source_url" text NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_google_reviews_branch_source_hash_unique" UNIQUE("branch_id","source_hash"),
	CONSTRAINT "branch_google_reviews_rating_check" CHECK ("branch_google_reviews"."rating" between 1 and 5),
	CONSTRAINT "branch_google_reviews_reviewer_count_check" CHECK ("branch_google_reviews"."reviewer_review_count" is null or "branch_google_reviews"."reviewer_review_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "branch_google_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "branch_review_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"minimum_rating" integer DEFAULT 1 NOT NULL,
	"maximum_reviews" integer DEFAULT 6 NOT NULL,
	"display_mode" text DEFAULT 'automatic' NOT NULL,
	"last_scraped_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_review_sources_branch_id_unique" UNIQUE("branch_id"),
	CONSTRAINT "branch_review_sources_minimum_rating_check" CHECK ("branch_review_sources"."minimum_rating" between 1 and 5),
	CONSTRAINT "branch_review_sources_maximum_reviews_check" CHECK ("branch_review_sources"."maximum_reviews" between 1 and 12),
	CONSTRAINT "branch_review_sources_display_mode_check" CHECK ("branch_review_sources"."display_mode" in ('automatic', 'manual'))
);
--> statement-breakpoint
ALTER TABLE "branch_review_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "branch_google_reviews" ADD CONSTRAINT "branch_google_reviews_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_review_sources" ADD CONSTRAINT "branch_review_sources_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "branch_google_reviews_visibility_idx" ON "branch_google_reviews" USING btree ("branch_id","is_hidden","rating","sort_order");
--> statement-breakpoint
REVOKE ALL ON TABLE public.branch_review_sources, public.branch_google_reviews FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.branch_review_sources, public.branch_google_reviews TO kgj_app;
--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.branch_review_sources FOR ALL TO kgj_app USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.branch_google_reviews FOR ALL TO kgj_app USING (true) WITH CHECK (true);
--> statement-breakpoint
INSERT INTO "content_sections" (
  "branch_id",
  "section_key",
  "label",
  "public_title",
  "sort_order",
  "is_active"
)
VALUES (NULL, 'google_reviews', 'Ulasan Google', 'Ulasan Google', 45, true)
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
  'google_reviews',
  'Ulasan Google',
  'Ulasan Google',
  45,
  true
FROM "content_sections"
WHERE "branch_id" IS NOT NULL
ON CONFLICT DO NOTHING;
