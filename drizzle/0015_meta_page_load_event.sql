ALTER TABLE "branch_meta_tracking_configs"
  ADD COLUMN "page_load_meta_event" text;
--> statement-breakpoint
UPDATE "branch_meta_tracking_configs"
SET "page_load_meta_event" = CASE
  WHEN "page_view_enabled" THEN 'PageView'
  ELSE NULL
END;
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  ADD CONSTRAINT "branch_meta_tracking_configs_page_load_meta_event_check"
  CHECK (
    "page_load_meta_event" IS NULL
    OR "page_load_meta_event" IN (
      'PageView',
      'ViewContent',
      'AddToCart',
      'AddToWishlist',
      'InitiateCheckout',
      'AddPaymentInfo',
      'Purchase',
      'Lead',
      'CompleteRegistration',
      'Contact'
    )
  );
