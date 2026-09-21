REVOKE EXECUTE ON FUNCTION public.is_assoc_manager(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_assoc_manager(uuid) TO authenticated, service_role;