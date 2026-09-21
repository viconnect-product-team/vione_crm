CREATE OR REPLACE FUNCTION public.current_member_id()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT m.id
  FROM public.members m
  WHERE m.user_id = auth.uid()
    AND (
      m.association_id = public.current_association_id()
      OR public.current_association_id() IS NULL
    )
  ORDER BY (m.association_id = public.current_association_id()) DESC,
           m.created_at ASC
  LIMIT 1;
$function$;

-- Internal helper functions: not meant to be called directly by app users.
REVOKE EXECUTE ON FUNCTION public.set_member_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_member_notification(text, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_increment_sync_rate(text, integer, integer) FROM PUBLIC, anon, authenticated;