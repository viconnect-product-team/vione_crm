
-- BC-9.1 Turn B2c — Relationship Memory embeddings

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.business_relationship_memory_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.business_relationship_memories(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  embedding_profile text NOT NULL,
  provider_class text NOT NULL,
  model_id text NOT NULL,
  model_version text NOT NULL,
  dimensions integer NOT NULL CHECK (dimensions = 1536),
  input_version text NOT NULL,
  content_hash text NOT NULL,
  embedding vector(1536),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','ready','failed','stale','archived')),
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code text,
  claimed_at timestamptz,
  claim_token uuid,
  claim_expires_at timestamptz,
  generated_at timestamptz,
  stale_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Logical identity
CREATE UNIQUE INDEX IF NOT EXISTS bc_rm_embeddings_identity_unique
  ON public.business_relationship_memory_embeddings
    (memory_id, embedding_profile, model_version, input_version, content_hash);

-- Retrieval-support indexes
CREATE INDEX IF NOT EXISTS bc_rm_embeddings_ready_idx
  ON public.business_relationship_memory_embeddings (memory_id)
  WHERE status = 'ready';

CREATE INDEX IF NOT EXISTS bc_rm_embeddings_status_idx
  ON public.business_relationship_memory_embeddings (status, claim_expires_at);

-- HNSW cosine index (vector(1536) fits directly, no halfvec cast).
CREATE INDEX IF NOT EXISTS bc_rm_embeddings_hnsw_cosine_idx
  ON public.business_relationship_memory_embeddings
  USING hnsw (embedding vector_cosine_ops);

GRANT SELECT ON public.business_relationship_memory_embeddings TO authenticated;
GRANT ALL ON public.business_relationship_memory_embeddings TO service_role;

ALTER TABLE public.business_relationship_memory_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_relationship_memory_embeddings FORCE ROW LEVEL SECURITY;

-- Owner may see metadata only (raw vector is server-only via service role).
CREATE POLICY "Owners can view their memory embedding metadata"
  ON public.business_relationship_memory_embeddings
  FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Only service role writes.
CREATE POLICY "Service role manages embeddings"
  ON public.business_relationship_memory_embeddings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.bc_rm_embeddings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS bc_rm_embeddings_touch ON public.business_relationship_memory_embeddings;
CREATE TRIGGER bc_rm_embeddings_touch
  BEFORE UPDATE ON public.business_relationship_memory_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.bc_rm_embeddings_touch_updated_at();
