CREATE TABLE "admin_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"role" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_profiles_role_check" CHECK ("admin_profiles"."role" in ('admin', 'technical_admin'))
);
--> statement-breakpoint
ALTER TABLE "admin_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"cta_label" text,
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
	"section_key" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_sections_section_key_unique" UNIQUE("section_key")
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
	"product_category" text,
	"branch_name" text,
	"cta" text,
	"source" text,
	"campaign" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_event_id_unique" UNIQUE("event_id"),
	CONSTRAINT "events_context_check" CHECK ((
        ("events"."event_name" = 'PageView' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."cta" is null)
        or ("events"."event_name" = 'ViewContent' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."cta" is null)
        or ("events"."event_name" = 'Contact' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."cta" = 'whatsapp')
      ))
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"logo_path" text,
	"default_whatsapp_message" text NOT NULL,
	"default_cta_label" text NOT NULL,
	"privacy_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton_check" CHECK ("site_settings"."id" = '00000000-0000-0000-0000-000000000001'::uuid)
);
--> statement-breakpoint
ALTER TABLE "site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admin_profiles_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_visibility_idx" ON "campaigns" USING btree ("is_active","sort_order","active_from" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_time_idx" ON "events" USING btree ("event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_name_time_idx" ON "events" USING btree ("event_name","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_session_time_idx" ON "events" USING btree ("anonymous_session_id","event_time");--> statement-breakpoint
CREATE INDEX "events_product_time_idx" ON "events" USING btree ("product_id","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_branch_time_idx" ON "events" USING btree ("branch_id","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_utm_campaign_time_idx" ON "events" USING btree ("utm_campaign","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "events_utm_source_time_idx" ON "events" USING btree ("utm_source","event_time" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "products_active_sort_idx" ON "products" USING btree ("is_active","sort_order");--> statement-breakpoint
-- auth.users is managed by Supabase, so this FK is added without asking Drizzle to create that table.
ALTER TABLE public.admin_profiles ADD CONSTRAINT admin_profiles_auth_user_fk FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kgj_app') THEN
    CREATE ROLE kgj_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;--> statement-breakpoint
-- A password is set out of band; the migration never embeds a credential.
REVOKE ALL ON TABLE public.admin_profiles, public.site_settings, public.content_sections, public.campaigns, public.products, public.branches, public.product_branches, public.links, public.events, public.audit_logs FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO kgj_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_profiles, public.site_settings, public.content_sections, public.campaigns, public.products, public.branches, public.product_branches, public.links, public.events, public.audit_logs TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.admin_profiles FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.site_settings FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.content_sections FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.campaigns FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.products FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.branches FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.product_branches FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.links FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.events FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.audit_logs FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
-- Bucket definitions are supported SQL configuration; object operations still go through Storage API.
INSERT INTO storage.buckets (id, name, public) VALUES
  ('public-assets', 'public-assets', true),
  ('admin-media', 'admin-media', false)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS app_private;--> statement-breakpoint
REVOKE ALL ON SCHEMA app_private FROM PUBLIC;--> statement-breakpoint
GRANT USAGE ON SCHEMA app_private TO authenticated;--> statement-breakpoint
CREATE FUNCTION app_private.is_active_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION app_private.is_active_admin() FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_private.is_active_admin() TO authenticated;--> statement-breakpoint
CREATE POLICY kgj_admin_media_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id IN ('public-assets', 'admin-media') AND app_private.is_active_admin());--> statement-breakpoint
CREATE POLICY kgj_admin_media_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('public-assets', 'admin-media') AND app_private.is_active_admin());--> statement-breakpoint
CREATE POLICY kgj_admin_media_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('public-assets', 'admin-media') AND app_private.is_active_admin())
WITH CHECK (bucket_id IN ('public-assets', 'admin-media') AND app_private.is_active_admin());--> statement-breakpoint
CREATE POLICY kgj_admin_media_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('public-assets', 'admin-media') AND app_private.is_active_admin());--> statement-breakpoint
INSERT INTO public.site_settings (id, default_whatsapp_message, default_cta_label)
VALUES ('00000000-0000-0000-0000-000000000001', 'Halo, saya tertarik dengan {product} di cabang {branch}.', 'Hubungi via WhatsApp')
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
INSERT INTO public.content_sections (section_key, label, sort_order) VALUES
  ('brand_header', 'Brand Header', 0),
  ('campaign_banner', 'Campaign Banner', 1),
  ('products', 'Products', 2),
  ('secondary_links', 'Secondary Links', 3),
  ('social_links', 'Social Links', 4),
  ('footer', 'Footer', 5)
ON CONFLICT (section_key) DO NOTHING;
