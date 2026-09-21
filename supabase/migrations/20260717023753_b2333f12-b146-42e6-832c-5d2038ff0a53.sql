
-- BC-9.1 Turn A — Relationship Memory foundation

-- 1) Memories
CREATE TABLE public.business_relationship_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_ref TEXT NOT NULL,
  memory_kind TEXT NOT NULL,
  canonical_key TEXT NOT NULL,
  canonical_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.500,
  source_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'candidate',
  sensitivity TEXT NOT NULL DEFAULT 'standard',
  first_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID REFERENCES auth.users(id),
  registry_version TEXT NOT NULL DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bc_rm_memory_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT bc_rm_memory_status CHECK (status IN ('candidate','active','superseded','dismissed','expired')),
  CONSTRAINT bc_rm_memory_sensitivity CHECK (sensitivity IN ('public_ok','standard','sensitive','restricted')),
  CONSTRAINT bc_rm_memory_subject_type CHECK (subject_type IN ('person','organization','relationship','opportunity')),
  CONSTRAINT bc_rm_memory_source_count_nonneg CHECK (source_count >= 0),
  CONSTRAINT bc_rm_memory_unique UNIQUE (owner_user_id, subject_type, subject_ref, memory_kind, canonical_key)
);

CREATE INDEX bc_rm_memories_owner_subject_idx
  ON public.business_relationship_memories (owner_user_id, subject_type, subject_ref);
CREATE INDEX bc_rm_memories_owner_status_idx
  ON public.business_relationship_memories (owner_user_id, status);
CREATE INDEX bc_rm_memories_owner_kind_idx
  ON public.business_relationship_memories (owner_user_id, memory_kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_memories TO authenticated;
GRANT ALL ON public.business_relationship_memories TO service_role;

ALTER TABLE public.business_relationship_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memories FORCE ROW LEVEL SECURITY;

CREATE POLICY "bc_rm_memories_owner_select"
  ON public.business_relationship_memories FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_memories_owner_insert"
  ON public.business_relationship_memories FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_memories_owner_update"
  ON public.business_relationship_memories FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_memories_owner_delete"
  ON public.business_relationship_memories FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- Helper (created after the table exists so the body validates)
CREATE OR REPLACE FUNCTION public.bc_rm_owns_memory(_memory_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_relationship_memories
    WHERE id = _memory_id AND owner_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.bc_rm_owns_memory(uuid) TO authenticated;

-- 2) Sources
CREATE TABLE public.business_relationship_memory_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.business_relationship_memories(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_domain TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight NUMERIC(4,3) NOT NULL DEFAULT 1.000,
  extractor_version TEXT NOT NULL DEFAULT '1.0.0',
  snippet_safe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bc_rm_source_weight_range CHECK (weight >= 0 AND weight <= 1),
  CONSTRAINT bc_rm_source_allowed_domain CHECK (source_domain IN (
    'meeting_safe','meeting_outcome_safe','follow_up_safe','agenda_safe','shared_notes_safe',
    'introduction_safe','connection_relationship_safe','person_profile_safe',
    'association_company_safe','relationship_graph_safe','work_hub_items','notification_action_safe'
  )),
  CONSTRAINT bc_rm_source_reject_private_notes CHECK (source_domain <> 'private_meeting_notes')
);

CREATE INDEX bc_rm_sources_memory_idx ON public.business_relationship_memory_sources (memory_id);
CREATE INDEX bc_rm_sources_owner_domain_idx
  ON public.business_relationship_memory_sources (owner_user_id, source_domain);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_memory_sources TO authenticated;
GRANT ALL ON public.business_relationship_memory_sources TO service_role;

ALTER TABLE public.business_relationship_memory_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memory_sources FORCE ROW LEVEL SECURITY;

CREATE POLICY "bc_rm_sources_owner_select"
  ON public.business_relationship_memory_sources FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_sources_owner_insert"
  ON public.business_relationship_memory_sources FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_sources_owner_update"
  ON public.business_relationship_memory_sources FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_sources_owner_delete"
  ON public.business_relationship_memory_sources FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- 3) Links
CREATE TABLE public.business_relationship_memory_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_memory_id UUID NOT NULL REFERENCES public.business_relationship_memories(id) ON DELETE CASCADE,
  to_memory_id UUID NOT NULL REFERENCES public.business_relationship_memories(id) ON DELETE CASCADE,
  link_kind TEXT NOT NULL,
  weight NUMERIC(4,3) NOT NULL DEFAULT 1.000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bc_rm_link_kind CHECK (link_kind IN ('supports','refines','contradicts','supersedes','related')),
  CONSTRAINT bc_rm_link_weight_range CHECK (weight >= 0 AND weight <= 1),
  CONSTRAINT bc_rm_link_not_self CHECK (from_memory_id <> to_memory_id),
  CONSTRAINT bc_rm_link_unique UNIQUE (from_memory_id, to_memory_id, link_kind)
);

CREATE INDEX bc_rm_links_owner_idx ON public.business_relationship_memory_links (owner_user_id);
CREATE INDEX bc_rm_links_from_idx ON public.business_relationship_memory_links (from_memory_id);
CREATE INDEX bc_rm_links_to_idx ON public.business_relationship_memory_links (to_memory_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_memory_links TO authenticated;
GRANT ALL ON public.business_relationship_memory_links TO service_role;

ALTER TABLE public.business_relationship_memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memory_links FORCE ROW LEVEL SECURITY;

CREATE POLICY "bc_rm_links_owner_select"
  ON public.business_relationship_memory_links FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_links_owner_insert"
  ON public.business_relationship_memory_links FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_user_id
    AND public.bc_rm_owns_memory(from_memory_id)
    AND public.bc_rm_owns_memory(to_memory_id)
  );
CREATE POLICY "bc_rm_links_owner_update"
  ON public.business_relationship_memory_links FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_links_owner_delete"
  ON public.business_relationship_memory_links FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- 4) Feedback
CREATE TABLE public.business_relationship_memory_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.business_relationship_memories(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_kind TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT bc_rm_feedback_kind CHECK (feedback_kind IN ('accept','reject','edit','flag_sensitive','request_forget'))
);

CREATE INDEX bc_rm_feedback_memory_idx ON public.business_relationship_memory_feedback (memory_id);
CREATE INDEX bc_rm_feedback_owner_idx ON public.business_relationship_memory_feedback (owner_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_relationship_memory_feedback TO authenticated;
GRANT ALL ON public.business_relationship_memory_feedback TO service_role;

ALTER TABLE public.business_relationship_memory_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memory_feedback FORCE ROW LEVEL SECURITY;

CREATE POLICY "bc_rm_feedback_owner_select"
  ON public.business_relationship_memory_feedback FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);
CREATE POLICY "bc_rm_feedback_owner_insert"
  ON public.business_relationship_memory_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id AND public.bc_rm_owns_memory(memory_id));
CREATE POLICY "bc_rm_feedback_owner_delete"
  ON public.business_relationship_memory_feedback FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- updated_at triggers
CREATE TRIGGER bc_rm_memories_updated_at
  BEFORE UPDATE ON public.business_relationship_memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER bc_rm_sources_updated_at
  BEFORE UPDATE ON public.business_relationship_memory_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER bc_rm_links_updated_at
  BEFORE UPDATE ON public.business_relationship_memory_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER bc_rm_feedback_updated_at
  BEFORE UPDATE ON public.business_relationship_memory_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
