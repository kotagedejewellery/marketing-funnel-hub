ALTER TABLE "form_submissions" ADD COLUMN "continuation_token_hash" text;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD COLUMN "whatsapp_continued_at" timestamp with time zone;
