CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE TABLE "admin_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"display_name" text,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_profiles_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_profiles_role_check" CHECK ("admin_profiles"."role" in ('admin', 'technical_admin'))
);
--> statement-breakpoint
ALTER TABLE "admin_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "branch_google_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"source_hash" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewer_photo_url" text,
	"reviewer_review_count" integer,
	"rating" integer NOT NULL,
	"relative_time" text NOT NULL,
	"relative_time_id" text,
	"review_text" text NOT NULL,
	"review_text_id" text,
	"reviewed_at" date,
	"source_url" text NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_google_reviews_branch_source_hash_unique" UNIQUE("branch_id","source_hash"),
	CONSTRAINT "branch_google_reviews_rating_check" CHECK ("branch_google_reviews"."rating" between 1 and 5),
	CONSTRAINT "branch_google_reviews_reviewer_count_check" CHECK ("branch_google_reviews"."reviewer_review_count" is null or "branch_google_reviews"."reviewer_review_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "branch_google_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "branch_meta_tracking_configs" (
	"branch_id" uuid PRIMARY KEY NOT NULL,
	"mode" text DEFAULT 'inherit' NOT NULL,
	"pixel_id" text,
	"dataset_id" text,
	"capi_access_token_encrypted" text,
	"capi_test_event_code_encrypted" text,
	"cta_meta_event" text,
	"page_view_enabled" boolean DEFAULT true NOT NULL,
	"page_load_meta_event" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_meta_tracking_configs_mode_check" CHECK ("branch_meta_tracking_configs"."mode" in ('inherit', 'custom', 'disabled')),
	CONSTRAINT "branch_meta_tracking_configs_custom_values_check" CHECK (("branch_meta_tracking_configs"."mode" = 'custom' and "branch_meta_tracking_configs"."pixel_id" is not null and "branch_meta_tracking_configs"."dataset_id" is not null and "branch_meta_tracking_configs"."capi_access_token_encrypted" is not null) or ("branch_meta_tracking_configs"."mode" = 'inherit' and "branch_meta_tracking_configs"."pixel_id" is null and "branch_meta_tracking_configs"."dataset_id" is null and "branch_meta_tracking_configs"."capi_access_token_encrypted" is null) or ("branch_meta_tracking_configs"."mode" = 'disabled' and "branch_meta_tracking_configs"."pixel_id" is null and "branch_meta_tracking_configs"."dataset_id" is null and "branch_meta_tracking_configs"."capi_access_token_encrypted" is null and "branch_meta_tracking_configs"."capi_test_event_code_encrypted" is null)),
	CONSTRAINT "branch_meta_tracking_configs_page_load_meta_event_check" CHECK ("branch_meta_tracking_configs"."page_load_meta_event" is null or "branch_meta_tracking_configs"."page_load_meta_event" = 'PageView'),
	CONSTRAINT "branch_meta_tracking_configs_cta_meta_event_check" CHECK ("branch_meta_tracking_configs"."cta_meta_event" is null or "branch_meta_tracking_configs"."cta_meta_event" in ('ViewContent', 'AddToCart', 'AddToWishlist', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Lead', 'CompleteRegistration', 'Contact'))
);
--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "branch_review_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"minimum_rating" integer DEFAULT 1 NOT NULL,
	"maximum_reviews" integer DEFAULT 6 NOT NULL,
	"display_mode" text DEFAULT 'automatic' NOT NULL,
	"scrape_year" integer,
	"scrape_limit" integer DEFAULT 50 NOT NULL,
	"last_scraped_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branch_review_sources_branch_id_unique" UNIQUE("branch_id"),
	CONSTRAINT "branch_review_sources_minimum_rating_check" CHECK ("branch_review_sources"."minimum_rating" between 1 and 5),
	CONSTRAINT "branch_review_sources_maximum_reviews_check" CHECK ("branch_review_sources"."maximum_reviews" between 1 and 12),
	CONSTRAINT "branch_review_sources_display_mode_check" CHECK ("branch_review_sources"."display_mode" in ('automatic', 'manual')),
	CONSTRAINT "branch_review_sources_scrape_year_check" CHECK ("branch_review_sources"."scrape_year" is null or "branch_review_sources"."scrape_year" between 2004 and 2100),
	CONSTRAINT "branch_review_sources_scrape_limit_check" CHECK ("branch_review_sources"."scrape_limit" in (10, 25, 50))
);
--> statement-breakpoint
ALTER TABLE "branch_review_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"cta_label" text,
	"profile_name" text,
	"headline" text,
	"introduction" text,
	"show_profile_name" boolean,
	"show_headline" boolean,
	"show_introduction" boolean,
	"logo_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_slug_unique" UNIQUE("slug"),
	CONSTRAINT "branches_whatsapp_number_check" CHECK ("branches"."whatsapp_number" ~ '^[1-9][0-9]{7,14}$')
);
--> statement-breakpoint
ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"name" text NOT NULL,
	"title" text,
	"description" text,
	"banner_path" text,
	"target_url" text,
	"active_from" timestamp with time zone,
	"active_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_date_range_check" CHECK ("campaigns"."active_until" is null or "campaigns"."active_from" is null or "campaigns"."active_until" > "campaigns"."active_from")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "content_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"section_key" text NOT NULL,
	"label" text NOT NULL,
	"public_title" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"spacing_after" text DEFAULT 'normal' NOT NULL,
	"show_divider" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_sections_spacing_after_check" CHECK ("content_sections"."spacing_after" in ('compact', 'normal', 'relaxed'))
);
--> statement-breakpoint
ALTER TABLE "content_sections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"anonymous_session_id" text NOT NULL,
	"event_name" text NOT NULL,
	"event_time" timestamp with time zone NOT NULL,
	"page_url" text,
	"product_id" uuid,
	"branch_id" uuid,
	"link_id" uuid,
	"product_category" text,
	"branch_name" text,
	"link_label" text,
	"link_type" text,
	"cta" text,
	"source" text,
	"campaign" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"device_type" text,
	"browser_family" text,
	"country_code" text,
	"city" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "events_context_check" CHECK ((
        ("events"."event_name" = 'PageView' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
        or ("events"."event_name" = 'ViewContent' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
        or ("events"."event_name" = 'Contact' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" = 'whatsapp')
        or ("events"."event_name" = 'LinkClick' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is not null and "events"."link_label" is not null and "events"."link_type" in ('secondary', 'social') and "events"."cta" = 'link')
      )),
	CONSTRAINT "events_device_type_check" CHECK ("events"."device_type" is null or "events"."device_type" in ('mobile', 'tablet', 'desktop', 'other')),
	CONSTRAINT "events_browser_family_check" CHECK ("events"."browser_family" is null or "events"."browser_family" in ('Chrome', 'Safari', 'Firefox', 'Edge', 'Other')),
	CONSTRAINT "events_country_code_check" CHECK ("events"."country_code" is null or "events"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"image_path" text NOT NULL,
	"title" text,
	"description" text,
	"alt_text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"link_type" text NOT NULL,
	"platform" text,
	"icon_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_type_check" CHECK ("links"."link_type" in ('secondary', 'social'))
);
--> statement-breakpoint
ALTER TABLE "links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"display_name" text,
	"description" text,
	"image_path" text,
	"show_image" boolean DEFAULT true NOT NULL,
	"whatsapp_message_template" text,
	"cta_label" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_branches_product_branch_unique" UNIQUE("product_id","branch_id")
);
--> statement-breakpoint
ALTER TABLE "product_branches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001' NOT NULL,
	"site_name" text DEFAULT 'KGJ' NOT NULL,
	"headline" text,
	"introduction" text,
	"show_profile_name" boolean DEFAULT true NOT NULL,
	"show_headline" boolean DEFAULT true NOT NULL,
	"show_introduction" boolean DEFAULT true NOT NULL,
	"logo_path" text,
	"default_whatsapp_message" text NOT NULL,
	"default_cta_label" text NOT NULL,
	"privacy_url" text,
	"default_link_bio_branch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton_check" CHECK ("site_settings"."id" = '00000000-0000-0000-0000-000000000001'::uuid)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admin_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admin_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_google_reviews" ADD CONSTRAINT "branch_google_reviews_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_meta_tracking_configs" ADD CONSTRAINT "branch_meta_tracking_configs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_review_sources" ADD CONSTRAINT "branch_review_sources_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_link_bio_branch_id_branches_id_fk" FOREIGN KEY ("default_link_bio_branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_expires_idx" ON "admin_sessions" USING btree ("admin_id","expires_at");--> statement-breakpoint
CREATE INDEX "branch_google_reviews_visibility_idx" ON "branch_google_reviews" USING btree ("branch_id","is_hidden","rating","sort_order");--> statement-breakpoint
CREATE INDEX "campaigns_visibility_idx" ON "campaigns" USING btree ("is_active","sort_order","active_from" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "campaigns_branch_visibility_idx" ON "campaigns" USING btree ("branch_id","is_active","sort_order","active_from" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_global_key_unique" ON "content_sections" USING btree ("section_key") WHERE "content_sections"."branch_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_branch_key_unique" ON "content_sections" USING btree ("branch_id","section_key") WHERE "content_sections"."branch_id" is not null;--> statement-breakpoint
CREATE INDEX "events_time_idx" ON "events" USING btree ("event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_name_time_idx" ON "events" USING btree ("event_name","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_session_time_idx" ON "events" USING btree ("anonymous_session_id","event_time");--> statement-breakpoint
CREATE INDEX "events_product_time_idx" ON "events" USING btree ("product_id","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_branch_time_idx" ON "events" USING btree ("branch_id","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_link_time_idx" ON "events" USING btree ("link_id","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_device_time_idx" ON "events" USING btree ("device_type","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_country_time_idx" ON "events" USING btree ("country_code","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_utm_campaign_time_idx" ON "events" USING btree ("utm_campaign","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_utm_source_time_idx" ON "events" USING btree ("utm_source","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "faqs_branch_sort_idx" ON "faqs" USING btree ("branch_id","sort_order");--> statement-breakpoint
CREATE INDEX "gallery_items_branch_visibility_idx" ON "gallery_items" USING btree ("branch_id","is_active","sort_order");--> statement-breakpoint
CREATE INDEX "links_branch_sort_idx" ON "links" USING btree ("branch_id","sort_order");--> statement-breakpoint
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("is_active","sort_order");--> statement-breakpoint
DO $$
DECLARE
  table_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kgj_app') THEN
    CREATE ROLE kgj_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;

  REVOKE ALL ON SCHEMA public FROM PUBLIC;
  GRANT USAGE ON SCHEMA public TO kgj_app;

  FOREACH table_name IN ARRAY ARRAY[
    'admin_profiles', 'admin_sessions', 'audit_logs',
    'branch_google_reviews', 'branch_meta_tracking_configs',
    'branch_review_sources', 'branches', 'campaigns', 'content_sections',
    'events', 'faqs', 'gallery_items', 'links', 'product_branches',
    'products', 'site_settings'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO kgj_app', table_name);
    EXECUTE format(
      'CREATE POLICY kgj_app_access ON public.%I FOR ALL TO kgj_app USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END $$;--> statement-breakpoint
INSERT INTO public.site_settings (id, default_whatsapp_message, default_cta_label)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Halo, saya tertarik dengan {product} di cabang {branch}.',
  'Hubungi via WhatsApp'
)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
INSERT INTO public.content_sections (
  section_key, label, public_title, sort_order, is_active
)
VALUES
  ('profile_logo', 'Logo profil', NULL, 0, true),
  ('brand_header', 'Profil cabang', NULL, 10, true),
  ('campaign_banner', 'Konten unggulan', NULL, 20, true),
  ('gallery', 'Galeri Produk', 'Galeri produk', 30, true),
  ('products', 'Produk', 'Pilihan produk', 40, true),
  ('google_reviews', 'Ulasan Google', 'Ulasan Google', 45, true),
  ('faq', 'FAQ', 'Pertanyaan yang sering ditanyakan', 50, true),
  ('secondary_links', 'Tautan tambahan', 'Tautan lainnya', 60, true),
  ('social_links', 'Media sosial', 'Temukan kami', 70, true),
  ('footer', 'Footer', NULL, 80, true)
ON CONFLICT DO NOTHING;
