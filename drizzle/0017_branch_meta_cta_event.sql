ALTER TABLE "branch_meta_tracking_configs"
  ADD COLUMN "cta_meta_event" text;
--> statement-breakpoint
UPDATE "branch_meta_tracking_configs"
SET "cta_meta_event" = 'Contact',
    "page_view_enabled" = true,
    "page_load_meta_event" = 'PageView'
WHERE "mode" <> 'disabled';
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs"
  ADD CONSTRAINT "branch_meta_tracking_configs_cta_meta_event_check"
  CHECK (
    "cta_meta_event" IS NULL
    OR "cta_meta_event" IN (
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
