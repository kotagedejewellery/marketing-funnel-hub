UPDATE "branch_meta_tracking_configs"
SET "page_view_enabled" = "mode" <> 'disabled',
    "page_load_meta_event" = CASE
      WHEN "mode" = 'disabled' THEN NULL
      ELSE 'PageView'
    END;
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  DROP CONSTRAINT "branch_meta_tracking_configs_page_load_meta_event_check";
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  ADD CONSTRAINT "branch_meta_tracking_configs_page_load_meta_event_check"
  CHECK (
    "page_load_meta_event" IS NULL
    OR "page_load_meta_event" = 'PageView'
  );
