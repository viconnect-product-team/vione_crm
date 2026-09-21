
-- ── BC-2.1C: enable direct platform-user ownership for Business Cards ──────────

-- 1. Make member/association links optional (additive; 0 rows today). This lets a
--    card belong directly to a platform user without fabricating a member row.
ALTER TABLE public.member_business_cards ALTER COLUMN member_id DROP NOT NULL;
ALTER TABLE public.member_business_cards ALTER COLUMN association_id DROP NOT NULL;
ALTER TABLE public.business_card_skills   ALTER COLUMN association_id DROP NOT NULL;
ALTER TABLE public.business_card_services ALTER COLUMN association_id DROP NOT NULL;
ALTER TABLE public.business_card_needs    ALTER COLUMN association_id DROP NOT NULL;

-- 2. Owner-aware parent-ownership helper. Child-table policies that already call
--    owns_business_card() automatically become owner-aware through this change.
CREATE OR REPLACE FUNCTION public.owns_business_card(_card_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.member_business_cards c
    WHERE c.id = _card_id
      AND (
        (c.member_id IS NOT NULL AND c.member_id = public.current_member_id())
        OR (c.owner_user_id IS NOT NULL AND c.owner_user_id = auth.uid())
      )
  );
$function$;

-- 3. Owner immutability: owner_user_id can never be reassigned by any client
--    path (owner, legacy member, or association manager). Only platform admins
--    (the controlled backfill) may change it. INSERT is unaffected (guarded by
--    RLS WITH CHECK = auth.uid()).
CREATE OR REPLACE FUNCTION public.enforce_business_card_owner_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    IF NOT public.is_platform_admin() THEN
      RAISE EXCEPTION 'owner_user_id is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_business_card_owner_immutable ON public.member_business_cards;
CREATE TRIGGER trg_business_card_owner_immutable
  BEFORE UPDATE ON public.member_business_cards
  FOR EACH ROW EXECUTE FUNCTION public.enforce_business_card_owner_immutable();

-- 4. Owner-aware RLS on member_business_cards (narrow policies ALONGSIDE legacy).
CREATE POLICY "Owner user reads own cards"
  ON public.member_business_cards FOR SELECT TO authenticated
  USING (owner_user_id IS NOT NULL AND owner_user_id = auth.uid());

-- Global card insert: owner must be self, and no member/association attached.
CREATE POLICY "Owner user inserts global card"
  ON public.member_business_cards FOR INSERT TO authenticated
  WITH CHECK (
    owner_user_id = auth.uid()
    AND member_id IS NULL
    AND association_id IS NULL
  );

CREATE POLICY "Owner user updates own card"
  ON public.member_business_cards FOR UPDATE TO authenticated
  USING (owner_user_id IS NOT NULL AND owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owner user deletes own card"
  ON public.member_business_cards FOR DELETE TO authenticated
  USING (owner_user_id IS NOT NULL AND owner_user_id = auth.uid());

-- 5. Belt-and-suspenders: legacy owner UPDATE with_check must not let a member
--    assign ownership to another user (trigger already blocks reassignment).
ALTER POLICY "Owner updates own card"
  ON public.member_business_cards
  WITH CHECK (
    member_id = public.current_member_id()
    AND (owner_user_id IS NULL OR owner_user_id = auth.uid())
  );

-- 6. Owner-aware lead access (in addition to legacy owner_member_id path).
CREATE POLICY "Leads card owner read"
  ON public.business_card_leads FOR SELECT TO authenticated
  USING (owns_business_card(card_id));

CREATE POLICY "Leads card owner update"
  ON public.business_card_leads FOR UPDATE TO authenticated
  USING (owns_business_card(card_id))
  WITH CHECK (owns_business_card(card_id));
