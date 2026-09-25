ALTER TABLE "branch_google_reviews"
  ADD COLUMN "relative_time_id" text,
  ADD COLUMN "review_text_id" text;
--> statement-breakpoint
GRANT DELETE ON TABLE public.branch_google_reviews TO kgj_app;
