CREATE TABLE "page_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"section_key" text,
	"product_branch_id" uuid,
	"link_id" uuid,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_blocks_kind_check" CHECK ("page_blocks"."kind" in ('section', 'product', 'link')),
	CONSTRAINT "page_blocks_reference_check" CHECK ((
        ("page_blocks"."kind" = 'section' and "page_blocks"."section_key" is not null and "page_blocks"."product_branch_id" is null and "page_blocks"."link_id" is null)
        or ("page_blocks"."kind" = 'product' and "page_blocks"."section_key" is null and "page_blocks"."product_branch_id" is not null and "page_blocks"."link_id" is null)
        or ("page_blocks"."kind" = 'link' and "page_blocks"."section_key" is null and "page_blocks"."product_branch_id" is null and "page_blocks"."link_id" is not null)
      ))
);
--> statement-breakpoint
ALTER TABLE "page_blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE public.page_blocks FROM PUBLIC;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.page_blocks TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.page_blocks FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_context_check";--> statement-breakpoint
ALTER TABLE "links" DROP CONSTRAINT "links_type_check";--> statement-breakpoint
ALTER TABLE "page_blocks" ADD CONSTRAINT "page_blocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_blocks" ADD CONSTRAINT "page_blocks_product_branch_id_product_branches_id_fk" FOREIGN KEY ("product_branch_id") REFERENCES "public"."product_branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_blocks" ADD CONSTRAINT "page_blocks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "page_blocks_branch_section_unique" ON "page_blocks" USING btree ("branch_id","section_key") WHERE "page_blocks"."kind" = 'section';--> statement-breakpoint
CREATE UNIQUE INDEX "page_blocks_branch_product_unique" ON "page_blocks" USING btree ("branch_id","product_branch_id") WHERE "page_blocks"."kind" = 'product';--> statement-breakpoint
CREATE UNIQUE INDEX "page_blocks_branch_link_unique" ON "page_blocks" USING btree ("branch_id","link_id") WHERE "page_blocks"."kind" = 'link';--> statement-breakpoint
CREATE INDEX "page_blocks_branch_sort_idx" ON "page_blocks" USING btree ("branch_id","sort_order");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_context_check" CHECK ((
        ("events"."event_name" = 'PageView' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
        or ("events"."event_name" = 'ViewContent' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is null and "events"."branch_name" is null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" is null)
        or ("events"."event_name" = 'Contact' and "events"."product_id" is not null and "events"."product_category" is not null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is null and "events"."link_label" is null and "events"."link_type" is null and "events"."cta" = 'whatsapp')
        or ("events"."event_name" = 'LinkClick' and "events"."product_id" is null and "events"."product_category" is null and "events"."branch_id" is not null and "events"."branch_name" is not null and "events"."link_id" is not null and "events"."link_label" is not null and "events"."link_type" in ('secondary', 'social', 'cta') and "events"."cta" = 'link')
      ));--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_type_check" CHECK ("links"."link_type" in ('secondary', 'social', 'cta'));
