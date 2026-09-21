CREATE TABLE public.business_relationship_person_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('follow_up','meeting')),
  target_kind text NOT NULL CHECK (target_kind IN ('connection','saved_card','guest_contact')),
  target_user_id uuid,
  target_card_id uuid,
  target_guest_id uuid REFERENCES public.guest_contacts(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  title text,
  note text,
  location_label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','cancelled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brpp_target_shape CHECK (
    (target_kind = 'connection'    AND target_user_id IS NOT NULL AND target_card_id IS NULL AND target_guest_id IS NULL) OR
    (target_kind = 'saved_card'    AND target_card_id IS NOT NULL AND target_user_id IS NULL AND target_guest_id IS NULL) OR
    (target_kind = 'guest_contact' AND target_guest_id IS NOT NULL AND target_user_id IS NULL AND target_card_id IS NULL)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_person_plans TO authenticated;
GRANT ALL ON public.business_relationship_person_plans TO service_role;

ALTER TABLE public.business_relationship_person_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own person plans"
  ON public.business_relationship_person_plans FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "Owner creates own person plans"
  ON public.business_relationship_person_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner updates own person plans"
  ON public.business_relationship_person_plans FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner deletes own person plans"
  ON public.business_relationship_person_plans FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE INDEX brpp_owner_due_idx
  ON public.business_relationship_person_plans (owner_user_id, status, due_at);

CREATE OR REPLACE FUNCTION public.brpp_validate_plan_target()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if NEW.target_kind = 'connection' then
    if not exists (
      select 1 from public.user_connections
      where status = 'accepted'
        and pair_user_low = least(NEW.owner_user_id, NEW.target_user_id)
        and pair_user_high = greatest(NEW.owner_user_id, NEW.target_user_id)
    ) then
      raise exception 'PERSON_PLAN_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  elsif NEW.target_kind = 'guest_contact' then
    if not exists (
      select 1 from public.guest_contacts
      where id = NEW.target_guest_id
        and owner_user_id = NEW.owner_user_id
    ) then
      raise exception 'PERSON_PLAN_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  else
    if not exists (
      select 1 from public.saved_business_cards
      where owner_user_id = NEW.owner_user_id
        and target_card_id = NEW.target_card_id
        and archived = false
    ) then
      raise exception 'PERSON_PLAN_RELATIONSHIP_NOT_AUTHORIZED';
    end if;
  end if;
  return NEW;
end
$$;

CREATE TRIGGER brpp_validate_plan_target_trg
  BEFORE INSERT OR UPDATE ON public.business_relationship_person_plans
  FOR EACH ROW EXECUTE FUNCTION public.brpp_validate_plan_target();

CREATE OR REPLACE FUNCTION public.brpp_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  NEW.updated_at = now();
  return NEW;
end
$$;

CREATE TRIGGER brpp_touch_updated_at_trg
  BEFORE UPDATE ON public.business_relationship_person_plans
  FOR EACH ROW EXECUTE FUNCTION public.brpp_touch_updated_at();