ALTER TABLE "content_sections" DROP CONSTRAINT "content_sections_section_key_unique";--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "introduction" text;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "logo_path" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "content_sections" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "product_branches" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "product_branches" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "product_branches" ADD COLUMN "image_path" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_branch_visibility_idx" ON "campaigns" USING btree ("branch_id","is_active","sort_order","active_from" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_global_key_unique" ON "content_sections" USING btree ("section_key") WHERE "content_sections"."branch_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_branch_key_unique" ON "content_sections" USING btree ("branch_id","section_key") WHERE "content_sections"."branch_id" is not null;--> statement-breakpoint
CREATE INDEX "links_branch_sort_idx" ON "links" USING btree ("branch_id","sort_order");