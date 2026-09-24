INSERT INTO public.admin_profiles (id, display_name, role, is_active)
SELECT id, 'Developer KGJ', 'technical_admin', true
FROM auth.users
WHERE id = 'b973469e-fbf6-430c-bb03-e31802e8e60a'::uuid
RETURNING id, role, is_active;