
-- Add concurrency columns
ALTER TABLE public.business_relationship_memory_extraction_receipts
  ADD COLUMN IF NOT EXISTS claim_token uuid,
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claim_expires_at timestamptz;

-- Index to make claim scans cheap
CREATE INDEX IF NOT EXISTS idx_brm_receipts_claimable
  ON public.business_relationship_memory_extraction_receipts (extractor_id, status, attempt_count, created_at)
  WHERE status IN ('pending','processing');

-- ==========================================================================
-- CLAIM RPC: atomic SKIP LOCKED
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.claim_relationship_memory_extraction_receipts(
  p_extractor_id text,
  p_limit int,
  p_claim_token uuid,
  p_stale_after_seconds int DEFAULT 300
)
RETURNS TABLE (
  id uuid,
  owner_user_id uuid,
  source_domain text,
  source_record_id text,
  source_version text,
  extractor_id text,
  extractor_version text,
  attempt_count int,
  row_version int,
  claim_token uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(COALESCE(p_limit, 1), 1), 25);
BEGIN
  IF p_extractor_id IS NULL OR length(p_extractor_id) = 0 THEN
    RAISE EXCEPTION 'extractor_id required';
  END IF;
  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'claim_token required';
  END IF;

  RETURN QUERY
  WITH claimable AS (
    SELECT r.id
    FROM public.business_relationship_memory_extraction_receipts r
    WHERE r.extractor_id = p_extractor_id
      AND r.attempt_count < 3
      AND (
        r.status = 'pending'
        OR (
          r.status = 'processing'
          AND r.claimed_at IS NOT NULL
          AND r.claimed_at < now() - make_interval(secs => p_stale_after_seconds)
        )
      )
    ORDER BY r.created_at ASC
    LIMIT v_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.business_relationship_memory_extraction_receipts r
     SET status         = 'processing',
         attempt_count  = r.attempt_count + 1,
         claim_token    = p_claim_token,
         claimed_at     = now(),
         claim_expires_at = now() + make_interval(secs => p_stale_after_seconds),
         row_version    = r.row_version + 1,
         updated_at     = now(),
         last_error     = NULL
   FROM claimable c
  WHERE r.id = c.id
  RETURNING r.id, r.owner_user_id, r.source_domain, r.source_record_id,
            r.source_version, r.extractor_id, r.extractor_version,
            r.attempt_count, r.row_version, r.claim_token;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_relationship_memory_extraction_receipts(text,int,uuid,int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_relationship_memory_extraction_receipts(text,int,uuid,int) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.claim_relationship_memory_extraction_receipts(text,int,uuid,int) TO service_role;

-- ==========================================================================
-- COMPLETE RPC (completed | partial)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.complete_relationship_memory_extraction_receipt(
  p_id uuid,
  p_claim_token uuid,
  p_candidate_count int,
  p_partial boolean
)
RETURNS TABLE (applied boolean, new_status text, new_row_version int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
  v_rv int;
BEGIN
  UPDATE public.business_relationship_memory_extraction_receipts r
     SET status         = CASE WHEN p_partial THEN 'partial' ELSE 'completed' END,
         candidate_count = GREATEST(COALESCE(p_candidate_count, 0), 0),
         completed_at   = now(),
         claim_token    = NULL,
         claim_expires_at = NULL,
         row_version    = r.row_version + 1,
         updated_at     = now()
   WHERE r.id = p_id
     AND r.status = 'processing'
     AND r.claim_token = p_claim_token
   RETURNING r.status, r.row_version INTO v_status, v_rv;

  IF v_status IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::int;
  ELSE
    RETURN QUERY SELECT true, v_status, v_rv;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_relationship_memory_extraction_receipt(uuid,uuid,int,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_relationship_memory_extraction_receipt(uuid,uuid,int,boolean) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.complete_relationship_memory_extraction_receipt(uuid,uuid,int,boolean) TO service_role;

-- ==========================================================================
-- FAIL RPC (retryable | terminal on attempt cap)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.fail_relationship_memory_extraction_receipt(
  p_id uuid,
  p_claim_token uuid,
  p_error text
)
RETURNS TABLE (applied boolean, new_status text, new_row_version int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempts int;
  v_next text;
  v_rv int;
BEGIN
  SELECT r.attempt_count INTO v_attempts
    FROM public.business_relationship_memory_extraction_receipts r
   WHERE r.id = p_id
     AND r.status = 'processing'
     AND r.claim_token = p_claim_token
   FOR UPDATE;

  IF v_attempts IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::int;
    RETURN;
  END IF;

  v_next := CASE WHEN v_attempts >= 3 THEN 'failed' ELSE 'pending' END;

  UPDATE public.business_relationship_memory_extraction_receipts r
     SET status           = v_next,
         last_error       = left(COALESCE(p_error, ''), 500),
         claim_token      = NULL,
         claim_expires_at = NULL,
         completed_at     = CASE WHEN v_next = 'failed' THEN now() ELSE NULL END,
         row_version      = r.row_version + 1,
         updated_at       = now()
   WHERE r.id = p_id
   RETURNING r.row_version INTO v_rv;

  RETURN QUERY SELECT true, v_next, v_rv;
END;
$$;

REVOKE ALL ON FUNCTION public.fail_relationship_memory_extraction_receipt(uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fail_relationship_memory_extraction_receipt(uuid,uuid,text) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fail_relationship_memory_extraction_receipt(uuid,uuid,text) TO service_role;

-- ==========================================================================
-- SKIP RPC (terminal, non-retryable — excluded source / invalid candidate)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.skip_relationship_memory_extraction_receipt(
  p_id uuid,
  p_claim_token uuid,
  p_reason text
)
RETURNS TABLE (applied boolean, new_status text, new_row_version int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rv int;
BEGIN
  UPDATE public.business_relationship_memory_extraction_receipts r
     SET status           = 'skipped',
         last_error       = left(COALESCE(p_reason, ''), 500),
         claim_token      = NULL,
         claim_expires_at = NULL,
         completed_at     = now(),
         row_version      = r.row_version + 1,
         updated_at       = now()
   WHERE r.id = p_id
     AND r.status = 'processing'
     AND r.claim_token = p_claim_token
   RETURNING r.row_version INTO v_rv;

  IF v_rv IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::int;
  ELSE
    RETURN QUERY SELECT true, 'skipped'::text, v_rv;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.skip_relationship_memory_extraction_receipt(uuid,uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.skip_relationship_memory_extraction_receipt(uuid,uuid,text) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.skip_relationship_memory_extraction_receipt(uuid,uuid,text) TO service_role;
