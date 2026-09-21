-- ============================================================
-- Phase 11: Digital Membership Identity — pass lifecycle + audit
-- ============================================================

-- Helper: is the current user a manager (admin) of the given association?
CREATE OR REPLACE FUNCTION public.is_assoc_manager(_association_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND association_id = _association_id
      AND role = 'admin'
  ) OR public.is_platform_admin();
$$;

-- ============================================================
-- 1. member_identity_passes
-- ============================================================
CREATE TABLE public.member_identity_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  pass_serial text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  card_version integer NOT NULL DEFAULT 1,
  issued_at timestamptz,
  expires_at timestamptz,
  suspended_at timestamptz,
  revoked_at timestamptz,
  replaced_by uuid REFERENCES public.member_identity_passes(id) ON DELETE SET NULL,
  wallet_apple_pass_id text,
  wallet_google_pass_id text,
  last_signed_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_identity_pass_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active','expired','suspended','revoked','replaced') THEN
    RAISE EXCEPTION 'Invalid pass status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_identity_pass_status
  BEFORE INSERT OR UPDATE ON public.member_identity_passes
  FOR EACH ROW EXECUTE FUNCTION public.validate_identity_pass_status();

CREATE TRIGGER trg_identity_passes_updated_at
  BEFORE UPDATE ON public.member_identity_passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_identity_passes_association ON public.member_identity_passes(association_id);
CREATE INDEX idx_identity_passes_member ON public.member_identity_passes(member_id);
CREATE UNIQUE INDEX idx_identity_passes_current_active
  ON public.member_identity_passes(association_id, member_id)
  WHERE status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_identity_passes TO authenticated;
GRANT ALL ON public.member_identity_passes TO service_role;

ALTER TABLE public.member_identity_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage passes in their association"
  ON public.member_identity_passes FOR ALL
  TO authenticated
  USING (public.is_assoc_manager(association_id))
  WITH CHECK (public.is_assoc_manager(association_id));

CREATE POLICY "Members read own pass"
  ON public.member_identity_passes FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. member_identity_events
-- ============================================================
CREATE TABLE public.member_identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  pass_id uuid REFERENCES public.member_identity_passes(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  actor_user_id uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_identity_event_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('issue','suspend','renew','replace','revoke','verify','wallet_mint') THEN
    RAISE EXCEPTION 'Invalid identity event type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_identity_event_type
  BEFORE INSERT ON public.member_identity_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_identity_event_type();

CREATE INDEX idx_identity_events_association ON public.member_identity_events(association_id);
CREATE INDEX idx_identity_events_pass ON public.member_identity_events(pass_id);
CREATE INDEX idx_identity_events_created ON public.member_identity_events(created_at DESC);

GRANT SELECT, INSERT ON public.member_identity_events TO authenticated;
GRANT ALL ON public.member_identity_events TO service_role;

ALTER TABLE public.member_identity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers read identity events"
  ON public.member_identity_events FOR SELECT
  TO authenticated
  USING (public.is_assoc_manager(association_id));

CREATE POLICY "Managers write identity events"
  ON public.member_identity_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_assoc_manager(association_id));
