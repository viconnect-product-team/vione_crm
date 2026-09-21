
-- BC-9.1 Turn B1 — Extraction receipts (idempotency identity)

CREATE TABLE IF NOT EXISTS public.business_relationship_memory_extraction_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source identity (must match allowlisted safe domain)
  source_domain TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_version TEXT NOT NULL DEFAULT '0',

  -- Extractor identity
  extractor_id TEXT NOT NULL,
  extractor_version TEXT NOT NULL,

  -- Outcome
  status TEXT NOT NULL DEFAULT 'pending',
  candidate_count INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,

  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT rm_receipts_status_chk CHECK (
    status IN ('pending','processing','completed','partial','failed','skipped')
  ),
  CONSTRAINT rm_receipts_source_domain_chk CHECK (
    source_domain IN (
      'meeting_safe','meeting_outcome_safe','follow_up_safe','agenda_safe',
      'shared_notes_safe','introduction_safe','connection_relationship_safe',
      'person_profile_safe','association_company_safe','relationship_graph_safe',
      'work_hub_items','notification_action_safe'
    )
    AND source_domain <> 'private_meeting_notes'
  ),
  CONSTRAINT rm_receipts_candidate_count_chk CHECK (candidate_count >= 0),
  CONSTRAINT rm_receipts_attempt_count_chk CHECK (attempt_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_rm_receipts_identity
  ON public.business_relationship_memory_extraction_receipts (
    owner_user_id, source_domain, source_record_id, extractor_version
  );

CREATE INDEX IF NOT EXISTS ix_rm_receipts_status_created
  ON public.business_relationship_memory_extraction_receipts (status, created_at);

CREATE INDEX IF NOT EXISTS ix_rm_receipts_owner_updated
  ON public.business_relationship_memory_extraction_receipts (owner_user_id, updated_at DESC);

-- Owner-only read; writes are service-role only (extraction worker).
GRANT SELECT ON public.business_relationship_memory_extraction_receipts TO authenticated;
GRANT ALL   ON public.business_relationship_memory_extraction_receipts TO service_role;

ALTER TABLE public.business_relationship_memory_extraction_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memory_extraction_receipts FORCE  ROW LEVEL SECURITY;

CREATE POLICY "rm_receipts_owner_read"
  ON public.business_relationship_memory_extraction_receipts
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- updated_at maintenance (reuse existing helper)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_rm_receipts_updated_at'
  ) THEN
    CREATE TRIGGER trg_rm_receipts_updated_at
      BEFORE UPDATE ON public.business_relationship_memory_extraction_receipts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
