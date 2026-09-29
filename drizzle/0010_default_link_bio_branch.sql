ALTER TABLE "site_settings"
  ADD COLUMN "default_link_bio_branch_id" uuid;
--> statement-breakpoint
ALTER TABLE "site_settings"
  ADD CONSTRAINT "site_settings_default_link_bio_branch_id_branches_id_fk"
  FOREIGN KEY ("default_link_bio_branch_id")
  REFERENCES "public"."branches"("id")
  ON DELETE restrict
  ON UPDATE no action;
