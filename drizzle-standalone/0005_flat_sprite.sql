CREATE TABLE "form_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"product_branch_id" uuid NOT NULL,
	"form_block_id" uuid NOT NULL,
	"form_title" text NOT NULL,
	"form_schema" jsonb NOT NULL,
	"values_encrypted" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_submissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_product_branch_id_product_branches_id_fk" FOREIGN KEY ("product_branch_id") REFERENCES "public"."product_branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_submissions_branch_form_submitted_idx" ON "form_submissions" USING btree ("branch_id","form_block_id","submitted_at");