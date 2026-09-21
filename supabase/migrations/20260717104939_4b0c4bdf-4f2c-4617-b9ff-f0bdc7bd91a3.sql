
-- ============================================================
-- BC-9.1 Turn B2b-ii — persistence, merge, provenance, links, supersession
-- ============================================================

-- 1) MEMORIES: scope, row_version, supersession chain
ALTER TABLE public.business_relationship_memories
  ADD COLUMN IF NOT EXISTS scope_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS scope_ref  text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS row_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_by_memory_id uuid NULL
    REFERENCES public.business_relationship_memories(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.business_relationship_memories
    ADD CONSTRAINT bc_rm_memory_scope_type
    CHECK (scope_type IN ('meeting','introduction','profile','work_item','none'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.business_relationship_memories
    ADD CONSTRAINT bc_rm_memory_row_version_positive CHECK (row_version > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.business_relationship_memories
    ADD CONSTRAINT bc_rm_memory_superseded_not_self CHECK (superseded_by_memory_id IS NULL OR superseded_by_memory_id <> id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Replace the coarse unique on canonical identity with a partial unique that
-- allows historical supersession while blocking two concurrent actives.
ALTER TABLE public.business_relationship_memories
  DROP CONSTRAINT IF EXISTS bc_rm_memory_unique;

CREATE UNIQUE INDEX IF NOT EXISTS bc_rm_memory_active_unique
  ON public.business_relationship_memories
    (owner_user_id, subject_type, subject_ref, scope_type, scope_ref, memory_kind, canonical_key)
  WHERE status IN ('candidate','active');

CREATE INDEX IF NOT EXISTS bc_rm_memory_lookup_idx
  ON public.business_relationship_memories
    (owner_user_id, subject_type, subject_ref, memory_kind, canonical_key);

-- 2) SOURCES: provenance identity + uniqueness
ALTER TABLE public.business_relationship_memory_sources
  ADD COLUMN IF NOT EXISTS source_record_id text NULL,
  ADD COLUMN IF NOT EXISTS source_version   text NOT NULL DEFAULT '1',
  ADD COLUMN IF NOT EXISTS extractor_id     text NOT NULL DEFAULT 'unspecified',
  ADD COLUMN IF NOT EXISTS evidence_type    text NOT NULL DEFAULT 'structured_field';

-- Backfill source_record_id from legacy source_ref values.
UPDATE public.business_relationship_memory_sources
  SET source_record_id = source_ref
  WHERE source_record_id IS NULL;

ALTER TABLE public.business_relationship_memory_sources
  ALTER COLUMN source_record_id SET NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.business_relationship_memory_sources
    ADD CONSTRAINT bc_rm_source_evidence_type
    CHECK (evidence_type IN ('direct_statement','structured_field','explicit_commitment','corroborated_signal','weak_signal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS bc_rm_sources_identity_unique
  ON public.business_relationship_memory_sources
    (memory_id, source_domain, source_record_id, source_version, extractor_id, extractor_version, evidence_type);

-- 3) LINKS: expand allowed kinds
ALTER TABLE public.business_relationship_memory_links
  DROP CONSTRAINT IF EXISTS bc_rm_link_kind;

ALTER TABLE public.business_relationship_memory_links
  ADD CONSTRAINT bc_rm_link_kind CHECK (link_kind IN (
    'supports','refines','contradicts','supersedes','related',
    'derived_from','confirmed_by','mentioned_in'
  ));

-- 4) apply-candidate RPC (service-role only)
CREATE OR REPLACE FUNCTION public.business_relationship_memory_apply_candidate(
  p_receipt_id         uuid,
  p_claim_token        text,
  p_extractor_id       text,
  p_extractor_version  text,
  p_candidate          jsonb,
  p_expected_version   integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_receipt        record;
  v_owner          uuid;
  v_subject_type   text := p_candidate ->> 'subjectType';
  v_subject_ref    text := p_candidate ->> 'subjectRef';
  v_scope_type     text := COALESCE(p_candidate ->> 'scopeType','none');
  v_scope_ref      text := COALESCE(p_candidate ->> 'scopeRecordId','');
  v_memory_kind    text := p_candidate ->> 'memoryKind';
  v_canonical_key  text := p_candidate ->> 'canonicalKey';
  v_structured     jsonb := COALESCE(p_candidate -> 'structuredValue','{}'::jsonb);
  v_visibility     text := COALESCE(p_candidate ->> 'visibilityClass','standard');
  v_evidence_type  text := COALESCE(p_candidate ->> 'evidenceType','structured_field');
  v_evidence_str   text := COALESCE(p_candidate ->> 'evidenceStrength','medium');
  v_subject_resolved boolean := COALESCE((p_candidate ->> 'subjectResolved')::boolean, false);
  v_source_domain  text := p_candidate ->> 'sourceDomain';
  v_source_record  text := p_candidate ->> 'sourceRecordId';
  v_source_version text := COALESCE(p_candidate ->> 'sourceVersion','1');
  v_occurred_at    timestamptz := COALESCE((p_candidate ->> 'occurredAt')::timestamptz, now());
  v_existing       record;
  v_outcome        text;
  v_new_memory_id  uuid;
  v_conf_current   numeric(4,3);
  v_conf_target    numeric(4,3);
  v_conf_delta     numeric(4,3);
  v_material_change boolean := false;
  v_new_row_ver    integer;
  v_replacement_id uuid;
  v_sensitivity_default text;
  v_new_sensitivity text;
  v_conflict_incompat boolean := false;
  v_result         jsonb;
  v_provenance_id  uuid;
  v_provenance_added boolean := false;
  v_link_added     boolean := false;
BEGIN
  -- 1) Lock receipt and validate ownership / claim
  SELECT * INTO v_receipt
    FROM public.business_relationship_memory_extraction_receipts
   WHERE id = p_receipt_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM: receipt not found';
  END IF;

  IF v_receipt.status <> 'processing' THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM: receipt not in processing (%)', v_receipt.status;
  END IF;

  IF v_receipt.claim_token IS NULL OR v_receipt.claim_token <> p_claim_token THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM: claim token mismatch';
  END IF;

  IF v_receipt.extractor_id <> p_extractor_id OR v_receipt.extractor_version <> p_extractor_version THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_INVALID_MERGE: extractor mismatch';
  END IF;

  v_owner := v_receipt.owner_user_id;

  -- 2) Validate candidate identity
  IF v_subject_type IS NULL OR v_subject_ref IS NULL OR v_memory_kind IS NULL OR v_canonical_key IS NULL THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_INVALID_MERGE: missing identity';
  END IF;

  IF NOT v_subject_resolved THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_INVALID_MERGE: subject unresolved';
  END IF;

  -- Structural exclusion of private-note sources.
  IF v_source_domain = 'private_meeting_notes' OR v_source_domain IS NULL THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_INVALID_MERGE: forbidden source domain';
  END IF;

  IF v_memory_kind NOT IN ('preference','interest','role_context','communication_style','goal',
    'constraint','shared_history','commitment','milestone','risk_flag','opportunity_signal','personal_context') THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_INVALID_MERGE: forbidden memory kind';
  END IF;

  -- 3) Lock existing memory (canonical identity)
  SELECT * INTO v_existing
    FROM public.business_relationship_memories
   WHERE owner_user_id = v_owner
     AND subject_type  = v_subject_type
     AND subject_ref   = v_subject_ref
     AND scope_type    = v_scope_type
     AND scope_ref     = v_scope_ref
     AND memory_kind   = v_memory_kind
     AND canonical_key = v_canonical_key
     AND status IN ('candidate','active')
   ORDER BY created_at ASC
   LIMIT 1
   FOR UPDATE;

  v_sensitivity_default := CASE v_memory_kind
    WHEN 'goal' THEN 'sensitive'
    WHEN 'constraint' THEN 'sensitive'
    WHEN 'commitment' THEN 'sensitive'
    WHEN 'opportunity_signal' THEN 'sensitive'
    WHEN 'risk_flag' THEN 'restricted'
    WHEN 'personal_context' THEN 'restricted'
    WHEN 'role_context' THEN 'public_ok'
    WHEN 'milestone' THEN 'public_ok'
    ELSE 'standard'
  END;

  -- Confidence increment from evidence strength (monotonic).
  v_conf_delta := CASE v_evidence_str
    WHEN 'high'   THEN 0.15
    WHEN 'medium' THEN 0.08
    ELSE 0.04
  END;

  -- 4) Classify + apply
  IF NOT FOUND THEN
    -- CREATES_NEW
    v_outcome := 'creates_new';
    v_new_sensitivity := GREATEST_TEXT_SENSITIVITY(v_visibility, v_sensitivity_default);
    INSERT INTO public.business_relationship_memories(
      owner_user_id, subject_type, subject_ref, scope_type, scope_ref,
      memory_kind, canonical_key, canonical_value, confidence, source_count,
      status, sensitivity, first_observed_at, last_observed_at, row_version
    ) VALUES (
      v_owner, v_subject_type, v_subject_ref, v_scope_type, v_scope_ref,
      v_memory_kind, v_canonical_key, v_structured,
      LEAST(1.0::numeric, 0.5 + v_conf_delta)::numeric(4,3), 1,
      'candidate', v_new_sensitivity, v_occurred_at, v_occurred_at, 1
    )
    ON CONFLICT (owner_user_id, subject_type, subject_ref, scope_type, scope_ref, memory_kind, canonical_key)
      WHERE status IN ('candidate','active')
    DO NOTHING
    RETURNING id, row_version INTO v_new_memory_id, v_new_row_ver;

    IF v_new_memory_id IS NULL THEN
      -- Concurrent creator won the race — re-select and treat as duplicate.
      SELECT id, row_version INTO v_new_memory_id, v_new_row_ver
        FROM public.business_relationship_memories
       WHERE owner_user_id = v_owner
         AND subject_type  = v_subject_type AND subject_ref = v_subject_ref
         AND scope_type    = v_scope_type   AND scope_ref   = v_scope_ref
         AND memory_kind   = v_memory_kind  AND canonical_key = v_canonical_key
         AND status IN ('candidate','active')
       LIMIT 1;
      v_outcome := 'duplicate';
    ELSE
      v_material_change := true;
    END IF;
  ELSE
    v_new_memory_id := v_existing.id;
    v_new_row_ver   := v_existing.row_version;

    -- Detect incompat: any shared key in structuredValue with different JSON value.
    v_conflict_incompat := EXISTS (
      SELECT 1 FROM jsonb_each(v_structured) c(k,v)
       WHERE v_existing.canonical_value ? c.k
         AND v_existing.canonical_value -> c.k IS DISTINCT FROM c.v
    );

    IF v_conflict_incompat THEN
      -- CONFLICT: create separate candidate memory, keep existing untouched, add contradicts link
      v_outcome := 'conflicts_existing';
      INSERT INTO public.business_relationship_memories(
        owner_user_id, subject_type, subject_ref, scope_type, scope_ref,
        memory_kind, canonical_key, canonical_value, confidence, source_count,
        status, sensitivity, first_observed_at, last_observed_at, row_version
      ) VALUES (
        v_owner, v_subject_type, v_subject_ref, v_scope_type, v_scope_ref,
        v_memory_kind, v_canonical_key || ':conflict:' || substr(md5(v_structured::text), 1, 8),
        v_structured, (0.5 + v_conf_delta)::numeric(4,3), 1,
        'candidate', GREATEST_TEXT_SENSITIVITY(v_visibility, v_existing.sensitivity),
        v_occurred_at, v_occurred_at, 1
      )
      RETURNING id INTO v_replacement_id;

      INSERT INTO public.business_relationship_memory_links(owner_user_id, from_memory_id, to_memory_id, link_kind, weight)
      VALUES (v_owner, v_replacement_id, v_existing.id, 'contradicts', 1.0)
      ON CONFLICT (from_memory_id, to_memory_id, link_kind) DO NOTHING;
      GET DIAGNOSTICS v_link_added = ROW_COUNT;
      v_new_memory_id := v_replacement_id;
      v_new_row_ver := 1;
    ELSIF v_structured = v_existing.canonical_value OR v_structured = '{}'::jsonb THEN
      -- DUPLICATE
      v_outcome := 'duplicate';
      v_conf_current := v_existing.confidence;
      v_conf_target := LEAST(1.0::numeric, v_conf_current + (1 - v_conf_current) * (v_conf_delta / 2))::numeric(4,3);
      IF v_conf_target > v_conf_current THEN
        UPDATE public.business_relationship_memories
           SET confidence = v_conf_target,
               source_count = source_count + 1,
               last_observed_at = GREATEST(last_observed_at, v_occurred_at)
         WHERE id = v_existing.id;
      END IF;
    ELSIF v_existing.canonical_value <@ v_structured AND v_structured <> v_existing.canonical_value THEN
      -- ENRICHMENT: candidate strictly extends existing (no key overwrites)
      IF p_expected_version IS NOT NULL AND p_expected_version <> v_existing.row_version THEN
        RAISE EXCEPTION 'RELATIONSHIP_MEMORY_VERSION_CONFLICT: expected %, got %', p_expected_version, v_existing.row_version;
      END IF;
      v_outcome := 'enriches_existing';
      v_new_sensitivity := GREATEST_TEXT_SENSITIVITY(v_visibility, v_existing.sensitivity);
      v_conf_current := v_existing.confidence;
      v_conf_target := LEAST(1.0::numeric, v_conf_current + (1 - v_conf_current) * (v_conf_delta))::numeric(4,3);
      UPDATE public.business_relationship_memories
         SET canonical_value = v_existing.canonical_value || v_structured,
             confidence = v_conf_target,
             source_count = source_count + 1,
             sensitivity = v_new_sensitivity,
             row_version = v_existing.row_version + 1,
             last_observed_at = GREATEST(last_observed_at, v_occurred_at)
       WHERE id = v_existing.id AND row_version = v_existing.row_version;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'RELATIONSHIP_MEMORY_VERSION_CONFLICT: concurrent enrichment';
      END IF;
      v_new_row_ver := v_existing.row_version + 1;
      v_material_change := true;
    ELSE
      -- SUPPORTS_EXISTING
      v_outcome := 'supports_existing';
      v_conf_current := v_existing.confidence;
      v_conf_target := LEAST(1.0::numeric, v_conf_current + (1 - v_conf_current) * (v_conf_delta))::numeric(4,3);
      v_new_sensitivity := GREATEST_TEXT_SENSITIVITY(v_visibility, v_existing.sensitivity);
      UPDATE public.business_relationship_memories
         SET confidence = v_conf_target,
             source_count = source_count + 1,
             sensitivity = v_new_sensitivity,
             last_observed_at = GREATEST(last_observed_at, v_occurred_at)
       WHERE id = v_existing.id;
      IF v_conf_target > v_conf_current THEN v_material_change := true; END IF;
    END IF;
  END IF;

  -- 5) Provenance (idempotent via unique index)
  INSERT INTO public.business_relationship_memory_sources(
    owner_user_id, memory_id, source_domain, source_ref,
    source_record_id, source_version, extractor_id, extractor_version,
    evidence_type, observed_at, weight, snippet_safe
  ) VALUES (
    v_owner, v_new_memory_id, v_source_domain, COALESCE(v_source_record, v_receipt.source_record_id),
    COALESCE(v_source_record, v_receipt.source_record_id), v_source_version,
    p_extractor_id, p_extractor_version, v_evidence_type, v_occurred_at,
    CASE v_evidence_str WHEN 'high' THEN 1.0 WHEN 'medium' THEN 0.7 ELSE 0.4 END,
    NULL
  )
  ON CONFLICT (memory_id, source_domain, source_record_id, source_version, extractor_id, extractor_version, evidence_type)
  DO NOTHING
  RETURNING id INTO v_provenance_id;

  v_provenance_added := v_provenance_id IS NOT NULL;

  v_result := jsonb_build_object(
    'outcome', v_outcome,
    'memoryId', v_new_memory_id,
    'existingMemoryId', CASE WHEN v_outcome = 'conflicts_existing' THEN v_existing.id ELSE NULL END,
    'created', v_outcome = 'creates_new',
    'materiallyChanged', v_material_change,
    'provenanceAdded', v_provenance_added,
    'linkAdded', v_link_added,
    'version', v_new_row_ver,
    'reviewRequired', v_outcome IN ('conflicts_existing')
  );

  RETURN v_result;
END
$fn$;

-- Helper: string comparison of sensitivity tiers, returns the max.
CREATE OR REPLACE FUNCTION public.GREATEST_TEXT_SENSITIVITY(a text, b text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT CASE
    WHEN (CASE COALESCE(a,'standard') WHEN 'public_ok' THEN 0 WHEN 'standard' THEN 1 WHEN 'sensitive' THEN 2 WHEN 'restricted' THEN 3 ELSE 1 END)
       >= (CASE COALESCE(b,'standard') WHEN 'public_ok' THEN 0 WHEN 'standard' THEN 1 WHEN 'sensitive' THEN 2 WHEN 'restricted' THEN 3 ELSE 1 END)
    THEN COALESCE(a,'standard') ELSE COALESCE(b,'standard') END;
$$;

REVOKE ALL ON FUNCTION public.business_relationship_memory_apply_candidate(uuid,text,text,text,jsonb,integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_relationship_memory_apply_candidate(uuid,text,text,text,jsonb,integer) FROM anon;
REVOKE ALL ON FUNCTION public.business_relationship_memory_apply_candidate(uuid,text,text,text,jsonb,integer) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.business_relationship_memory_apply_candidate(uuid,text,text,text,jsonb,integer) TO service_role;

REVOKE ALL ON FUNCTION public.GREATEST_TEXT_SENSITIVITY(text,text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.GREATEST_TEXT_SENSITIVITY(text,text) TO service_role;

-- 5) supersession RPC (separate, explicit)
CREATE OR REPLACE FUNCTION public.business_relationship_memory_supersede(
  p_receipt_id       uuid,
  p_claim_token      text,
  p_old_memory_id    uuid,
  p_expected_version integer,
  p_candidate        jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_receipt   record;
  v_old       record;
  v_new_id    uuid;
BEGIN
  SELECT * INTO v_receipt
    FROM public.business_relationship_memory_extraction_receipts
   WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND OR v_receipt.status <> 'processing' OR v_receipt.claim_token IS DISTINCT FROM p_claim_token THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_RECEIPT_STALE_CLAIM';
  END IF;

  SELECT * INTO v_old FROM public.business_relationship_memories
   WHERE id = p_old_memory_id AND owner_user_id = v_receipt.owner_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED: unknown target';
  END IF;
  IF v_old.status NOT IN ('candidate','active') THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_SUPERSESSION_NOT_ALLOWED: terminal state';
  END IF;
  IF v_old.row_version <> p_expected_version THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_VERSION_CONFLICT';
  END IF;

  INSERT INTO public.business_relationship_memories(
    owner_user_id, subject_type, subject_ref, scope_type, scope_ref,
    memory_kind, canonical_key, canonical_value, confidence, source_count,
    status, sensitivity, first_observed_at, last_observed_at, row_version
  )
  SELECT v_old.owner_user_id, v_old.subject_type, v_old.subject_ref, v_old.scope_type, v_old.scope_ref,
         v_old.memory_kind, v_old.canonical_key || ':v' || (v_old.row_version + 1),
         COALESCE(p_candidate -> 'structuredValue', v_old.canonical_value),
         v_old.confidence,
         v_old.source_count,
         'active', v_old.sensitivity, now(), now(), 1
  RETURNING id INTO v_new_id;

  UPDATE public.business_relationship_memories
     SET status = 'superseded',
         superseded_by_memory_id = v_new_id,
         row_version = v_old.row_version + 1
   WHERE id = v_old.id AND row_version = p_expected_version;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELATIONSHIP_MEMORY_VERSION_CONFLICT';
  END IF;

  INSERT INTO public.business_relationship_memory_links(owner_user_id, from_memory_id, to_memory_id, link_kind, weight)
  VALUES (v_receipt.owner_user_id, v_new_id, v_old.id, 'supersedes', 1.0)
  ON CONFLICT (from_memory_id, to_memory_id, link_kind) DO NOTHING;

  RETURN jsonb_build_object(
    'outcome','superseded',
    'memoryId', v_new_id,
    'existingMemoryId', v_old.id,
    'created', true,
    'materiallyChanged', true,
    'provenanceAdded', false,
    'linkAdded', true,
    'version', 1,
    'reviewRequired', false
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.business_relationship_memory_supersede(uuid,text,uuid,integer,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.business_relationship_memory_supersede(uuid,text,uuid,integer,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.business_relationship_memory_supersede(uuid,text,uuid,integer,jsonb) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.business_relationship_memory_supersede(uuid,text,uuid,integer,jsonb) TO service_role;
