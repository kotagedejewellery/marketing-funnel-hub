CREATE TABLE "branch_meta_tracking_configs" (
  "branch_id" uuid PRIMARY KEY NOT NULL,
  "mode" text DEFAULT 'inherit' NOT NULL,
  "pixel_id" text,
  "dataset_id" text,
  "capi_access_token_encrypted" text,
  "page_view_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "branch_meta_tracking_configs_mode_check"
    CHECK ("branch_meta_tracking_configs"."mode" in ('inherit', 'custom', 'disabled')),
  CONSTRAINT "branch_meta_tracking_configs_custom_values_check"
    CHECK (("branch_meta_tracking_configs"."mode" = 'custom' and "branch_meta_tracking_configs"."pixel_id" is not null and "branch_meta_tracking_configs"."dataset_id" is not null and "branch_meta_tracking_configs"."capi_access_token_encrypted" is not null) or ("branch_meta_tracking_configs"."mode" <> 'custom' and "branch_meta_tracking_configs"."pixel_id" is null and "branch_meta_tracking_configs"."dataset_id" is null and "branch_meta_tracking_configs"."capi_access_token_encrypted" is null))
);
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  ADD CONSTRAINT "branch_meta_tracking_configs_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
REVOKE ALL ON TABLE public.branch_meta_tracking_configs FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.branch_meta_tracking_configs TO kgj_app;
--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.branch_meta_tracking_configs
  FOR ALL TO kgj_app USING (true) WITH CHECK (true);
