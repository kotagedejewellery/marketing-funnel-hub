ALTER TABLE "branch_review_sources"
  ADD COLUMN "scrape_year" integer,
  ADD COLUMN "scrape_limit" integer DEFAULT 50 NOT NULL;
--> statement-breakpoint
ALTER TABLE "branch_review_sources"
  ADD CONSTRAINT "branch_review_sources_scrape_year_check"
  CHECK ("branch_review_sources"."scrape_year" is null or "branch_review_sources"."scrape_year" between 2004 and 2100),
  ADD CONSTRAINT "branch_review_sources_scrape_limit_check"
  CHECK ("branch_review_sources"."scrape_limit" in (10, 25, 50));
--> statement-breakpoint
ALTER TABLE "branch_google_reviews"
  ADD COLUMN "reviewed_at" date;
