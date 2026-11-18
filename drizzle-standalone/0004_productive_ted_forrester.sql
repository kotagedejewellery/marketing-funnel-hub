CREATE TABLE "branch_page_builder_layouts" (
	"branch_id" uuid PRIMARY KEY NOT NULL,
	"draft_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "branch_page_builder_layouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "branch_page_builder_layouts" ADD CONSTRAINT "branch_page_builder_layouts_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
REVOKE ALL ON TABLE public.branch_page_builder_layouts FROM PUBLIC;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.branch_page_builder_layouts TO kgj_app;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.branch_page_builder_layouts FOR ALL TO kgj_app USING (true) WITH CHECK (true);
