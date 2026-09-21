CREATE TYPE public.bc_customer_stage AS ENUM ('prospect','consulting','won','nurturing','inactive');
CREATE TYPE public.bc_customer_target_kind AS ENUM ('connection','saved_card','guest_contact');
CREATE TYPE public.bc_customer_log_kind AS ENUM ('call','meeting','email','message','note','stage_change');

CREATE TABLE public.bc_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  target_kind public.bc_customer_target_kind NOT NULL,
  target_user_id uuid,
  target_card_id uuid,
  target_guest_id uuid,
  display_name text,
  company_name text,
  stage public.bc_customer_stage NOT NULL DEFAULT 'prospect',
  expected_value numeric(14,2),
  currency text NOT NULL DEFAULT 'VND',
  source_label text,
  note text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bc_customers_target_xor CHECK (
    (target_kind = 'connection'   AND target_user_id IS NOT NULL AND target_card_id IS NULL AND target_guest_id IS NULL) OR
    (target_kind = 'saved_card'   AND target_card_id IS NOT NULL AND target_user_id IS NULL AND target_guest_id IS NULL) OR
    (target_kind = 'guest_contact'AND target_guest_id IS NOT NULL AND target_user_id IS NULL AND target_card_id IS NULL)
  ),
  CONSTRAINT bc_customers_value_nonneg CHECK (expected_value IS NULL OR expected_value >= 0)
);

CREATE UNIQUE INDEX bc_customers_owner_user_uq ON public.bc_customers (owner_user_id, target_user_id) WHERE target_user_id IS NOT NULL;
CREATE UNIQUE INDEX bc_customers_owner_card_uq ON public.bc_customers (owner_user_id, target_card_id) WHERE target_card_id IS NOT NULL;
CREATE UNIQUE INDEX bc_customers_owner_guest_uq ON public.bc_customers (owner_user_id, target_guest_id) WHERE target_guest_id IS NOT NULL;
CREATE INDEX bc_customers_owner_stage_idx ON public.bc_customers (owner_user_id, stage, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_customers TO authenticated;
GRANT ALL ON public.bc_customers TO service_role;
ALTER TABLE public.bc_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own customers" ON public.bc_customers
  FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE TABLE public.bc_customer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.bc_customers(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  kind public.bc_customer_log_kind NOT NULL DEFAULT 'note',
  body text,
  from_stage public.bc_customer_stage,
  to_stage public.bc_customer_stage,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bc_customer_logs_customer_idx ON public.bc_customer_logs (customer_id, occurred_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bc_customer_logs TO authenticated;
GRANT ALL ON public.bc_customer_logs TO service_role;
ALTER TABLE public.bc_customer_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own customer logs" ON public.bc_customer_logs
  FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE TRIGGER bc_customers_touch BEFORE UPDATE ON public.bc_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER bc_customer_logs_touch BEFORE UPDATE ON public.bc_customer_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();