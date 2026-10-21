ALTER TABLE "branch_meta_tracking_configs"
  ADD COLUMN "capi_test_event_code_encrypted" text;
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  DROP CONSTRAINT "branch_meta_tracking_configs_custom_values_check";
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  ADD CONSTRAINT "branch_meta_tracking_configs_custom_values_check"
  CHECK (
    ("mode" = 'custom' AND "pixel_id" IS NOT NULL AND "dataset_id" IS NOT NULL AND "capi_access_token_encrypted" IS NOT NULL)
    OR ("mode" = 'inherit' AND "pixel_id" IS NULL AND "dataset_id" IS NULL AND "capi_access_token_encrypted" IS NULL)
    OR ("mode" = 'disabled' AND "pixel_id" IS NULL AND "dataset_id" IS NULL AND "capi_access_token_encrypted" IS NULL AND "capi_test_event_code_encrypted" IS NULL)
  );
