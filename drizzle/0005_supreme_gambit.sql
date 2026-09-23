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
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_items_branch_visibility_idx" ON "gallery_items" USING btree ("branch_id","is_active","sort_order");--> statement-breakpoint
REVOKE ALL ON TABLE public.gallery_items FROM PUBLIC, anon, authenticated;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.gallery_items TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.gallery_items FOR ALL TO kgj_app USING (true) WITH CHECK (true);--> statement-breakpoint
INSERT INTO public.gallery_items (
	branch_id,
	image_path,
	title,
	description,
	alt_text,
	sort_order,
	is_active
)
SELECT
	assignment.branch_id,
	COALESCE(NULLIF(assignment.image_path, ''), NULLIF(product.image_path, '')),
	COALESCE(assignment.display_name, product.name),
	COALESCE(assignment.description, product.description),
	COALESCE(assignment.display_name, product.name),
	assignment.sort_order,
	true
FROM public.product_branches AS assignment
INNER JOIN public.products AS product ON product.id = assignment.product_id
WHERE assignment.is_active = true
	AND assignment.show_image = true
	AND product.is_active = true
	AND COALESCE(NULLIF(assignment.image_path, ''), NULLIF(product.image_path, '')) IS NOT NULL;--> statement-breakpoint
WITH product_sections AS MATERIALIZED (
	SELECT branch_id, sort_order
	FROM public.content_sections
	WHERE section_key = 'products'
), shifted AS (
	UPDATE public.content_sections AS target
	SET sort_order = target.sort_order + 1, updated_at = now()
	FROM product_sections AS source
	WHERE target.branch_id IS NOT DISTINCT FROM source.branch_id
		AND target.sort_order >= source.sort_order
	RETURNING target.id
)
INSERT INTO public.content_sections (
	branch_id,
	section_key,
	label,
	sort_order,
	is_active
)
SELECT branch_id, 'gallery', 'Galeri Produk', sort_order, true
FROM product_sections
ON CONFLICT DO NOTHING;
