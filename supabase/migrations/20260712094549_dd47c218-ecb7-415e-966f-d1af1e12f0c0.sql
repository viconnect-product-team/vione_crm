REVOKE EXECUTE ON FUNCTION public.list_my_linkable_members() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.link_my_member_profile(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlink_my_member_profile(text) FROM PUBLIC, anon;