ALTER TABLE "events" ADD COLUMN "link_id" uuid;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "link_label" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "link_type" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "device_type" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "browser_family" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "country_code" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "city" text;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_context_check";
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_context_check" CHECK ((
  ("events"."event_name" = 'PageView' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
  or ("events"."event_name" = 'ViewContent' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
  or ("events"."event_name" = 'Contact' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" = 'whatsapp')
  or ("events"."event_name" = 'LinkClick' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is not null and "events"."link_label" is not null and "events"."link_type" in ('secondary', 'social') and "events"."cta" = 'link')
));
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_device_type_check" CHECK ("events"."device_type" is null or "events"."device_type" in ('mobile', 'tablet', 'desktop', 'other'));
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_browser_family_check" CHECK ("events"."browser_family" is null or "events"."browser_family" in ('Chrome', 'Safari', 'Firefox', 'Edge', 'Other'));
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_country_code_check" CHECK ("events"."country_code" is null or "events"."country_code" ~ '^[A-Z]{2}$');
--> statement-breakpoint
CREATE INDEX "events_link_time_idx" ON "events" USING btree ("link_id", "event_time" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX "events_device_time_idx" ON "events" USING btree ("device_type", "event_time" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX "events_country_time_idx" ON "events" USING btree ("country_code", "event_time" DESC NULLS LAST);
