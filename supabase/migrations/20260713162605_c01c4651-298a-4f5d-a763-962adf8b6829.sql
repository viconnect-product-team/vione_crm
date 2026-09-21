
REVOKE EXECUTE ON FUNCTION public.gn_actor_public_summary(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gn_mark_notifications_read(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.global_connection_send_request_guarded(uuid, text, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gn_report_user(uuid, text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gn_report_set_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gn_actor_public_summary(uuid) TO authenticated, service_role;
