ALTER TABLE "site_settings"
  ADD COLUMN "show_profile_name" boolean DEFAULT true NOT NULL,
  ADD COLUMN "show_headline" boolean DEFAULT true NOT NULL,
  ADD COLUMN "show_introduction" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "branches"
  ADD COLUMN "profile_name" text,
  ADD COLUMN "show_profile_name" boolean,
  ADD COLUMN "show_headline" boolean,
  ADD COLUMN "show_introduction" boolean;
