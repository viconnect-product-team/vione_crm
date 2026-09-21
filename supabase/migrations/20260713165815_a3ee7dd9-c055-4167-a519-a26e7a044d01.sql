
REVOKE ALL ON FUNCTION public.bm_valid_timezone(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_require_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_is_participant(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_eligibility_source(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_pair_blocked(uuid,uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_log_event(uuid,uuid,text,integer,public.business_meeting_source_type,text,jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bm_validate_timing(timestamptz,timestamptz,text) FROM PUBLIC, anon;

-- authenticated needs execute on the participant check (evaluated inside RLS policies as invoker)
GRANT EXECUTE ON FUNCTION public.bm_is_participant(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bm_valid_timezone(text) TO authenticated;
