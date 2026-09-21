-- P0-A2A: allow authenticated members to read and record their own check-ins.
-- Existing policies only permitted association admins; the Member PWA
-- check-in cutover runs as the authenticated member and would otherwise
-- be blocked by RLS.

GRANT SELECT, INSERT ON public.member_checkins TO authenticated;
GRANT ALL ON public.member_checkins TO service_role;

-- Read: a member can see their own check-in rows.
CREATE POLICY member_checkins_self_select
  ON public.member_checkins
  FOR SELECT
  TO authenticated
  USING (
    member_code IN (
      SELECT m.code FROM public.members m WHERE m.user_id = auth.uid()
    )
  );

-- Write: a member can insert only rows keyed to their own member_code
-- and association_id. Status/timestamp are still server-derived in the
-- server function; RLS just prevents cross-member forgery.
CREATE POLICY member_checkins_self_insert
  ON public.member_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    member_code IN (
      SELECT m.code FROM public.members m
      WHERE m.user_id = auth.uid()
        AND m.association_id = member_checkins.association_id
    )
  );