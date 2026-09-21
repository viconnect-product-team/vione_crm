INSERT INTO public.user_roles (user_id, role)
SELECT id, 'platform_admin'::app_role FROM auth.users WHERE email = 'admin@vba.vn'
ON CONFLICT (user_id, role) DO NOTHING;