CREATE TABLE "form_submission_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"destination" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "form_submission_deliveries_submission_provider_unique" UNIQUE("submission_id","provider"),
	CONSTRAINT "form_submission_deliveries_provider_check" CHECK ("form_submission_deliveries"."provider" = 'google_sheets'),
	CONSTRAINT "form_submission_deliveries_status_check" CHECK ("form_submission_deliveries"."status" in ('pending', 'delivered', 'failed'))
);
--> statement-breakpoint
ALTER TABLE "form_submission_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_submission_deliveries" ADD CONSTRAINT "form_submission_deliveries_submission_id_form_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_submission_deliveries_status_created_idx" ON "form_submission_deliveries" USING btree ("status","created_at");--> statement-breakpoint
REVOKE ALL ON TABLE public.form_submission_deliveries FROM PUBLIC;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.form_submission_deliveries TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.form_submission_deliveries FOR ALL TO kgj_app USING (true) WITH CHECK (true);
