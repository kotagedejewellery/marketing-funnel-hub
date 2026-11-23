ALTER TABLE "form_submissions" ADD COLUMN "contact_search_hash" text;--> statement-breakpoint
CREATE INDEX "form_submissions_submitted_id_idx" ON "form_submissions" USING btree ("submitted_at","id");--> statement-breakpoint
CREATE INDEX "form_submissions_contact_search_submitted_idx" ON "form_submissions" USING btree ("contact_search_hash","submitted_at","id");