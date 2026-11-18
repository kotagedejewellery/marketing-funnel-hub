REVOKE ALL ON TABLE public.form_submissions FROM PUBLIC;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.form_submissions TO kgj_app;--> statement-breakpoint
DROP POLICY IF EXISTS kgj_app_access ON public.form_submissions;--> statement-breakpoint
CREATE POLICY kgj_app_access ON public.form_submissions FOR ALL TO kgj_app USING (true) WITH CHECK (true);
