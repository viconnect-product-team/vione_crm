
-- ============================================================
-- BC-4.1 — Relationship Graph Engine (read-only foundation)
-- Additive, migration-safe. No product data is copied here.
-- ============================================================

-- ---------- graph_registry_versions ----------
CREATE TABLE IF NOT EXISTS public.graph_registry_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_hash   text NOT NULL UNIQUE,
  manifest        jsonb NOT NULL,
  version         integer NOT NULL,
  deployed_at     timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.graph_registry_versions TO authenticated;
GRANT ALL    ON public.graph_registry_versions TO service_role;

ALTER TABLE public.graph_registry_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_registry_versions FORCE ROW LEVEL SECURITY;

CREATE POLICY "graph_registry_versions_read_authenticated"
  ON public.graph_registry_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- ---------- graph_nodes ----------
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_kind             text NOT NULL,
  external_ref_type     text NOT NULL,
  external_ref_id       text NOT NULL,
  tenant_scope_type     text NOT NULL DEFAULT 'global',
  tenant_scope_id       uuid,
  visibility_class      text NOT NULL DEFAULT 'private',
  status                text NOT NULL DEFAULT 'active',
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  registry_version      integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  archived_at           timestamptz,
  CONSTRAINT graph_nodes_unique_external UNIQUE (node_kind, external_ref_type, external_ref_id),
  CONSTRAINT graph_nodes_visibility_class_check
    CHECK (visibility_class IN ('private','connected','association','community','public','system')),
  CONSTRAINT graph_nodes_status_check
    CHECK (status IN ('active','archived','suspended')),
  CONSTRAINT graph_nodes_tenant_scope_type_check
    CHECK (tenant_scope_type IN ('global','association','community','tenant'))
);

CREATE INDEX IF NOT EXISTS graph_nodes_kind_ref_idx
  ON public.graph_nodes (node_kind, external_ref_type, external_ref_id);
CREATE INDEX IF NOT EXISTS graph_nodes_tenant_idx
  ON public.graph_nodes (tenant_scope_type, tenant_scope_id);
CREATE INDEX IF NOT EXISTS graph_nodes_visibility_idx
  ON public.graph_nodes (visibility_class);
CREATE INDEX IF NOT EXISTS graph_nodes_status_archive_idx
  ON public.graph_nodes (status, archived_at);

GRANT SELECT ON public.graph_nodes TO authenticated;
GRANT ALL    ON public.graph_nodes TO service_role;

ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_nodes FORCE ROW LEVEL SECURITY;

-- ---------- graph_edges ----------
CREATE TABLE IF NOT EXISTS public.graph_edges (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_kind             text NOT NULL,
  source_node_id        uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  target_node_id        uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  directionality        text NOT NULL DEFAULT 'directed',
  visibility_class      text NOT NULL DEFAULT 'private',
  tenant_scope_type     text NOT NULL DEFAULT 'global',
  tenant_scope_id       uuid,
  status                text NOT NULL DEFAULT 'active',
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  registry_version      integer NOT NULL DEFAULT 1,
  valid_from            timestamptz,
  valid_until           timestamptz,
  created_by_user_id    uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  archived_at           timestamptz,
  CONSTRAINT graph_edges_directionality_check
    CHECK (directionality IN ('directed','undirected')),
  CONSTRAINT graph_edges_visibility_class_check
    CHECK (visibility_class IN ('private','connected','association','community','public','system')),
  CONSTRAINT graph_edges_status_check
    CHECK (status IN ('active','archived','revoked')),
  CONSTRAINT graph_edges_tenant_scope_type_check
    CHECK (tenant_scope_type IN ('global','association','community','tenant'))
);

CREATE INDEX IF NOT EXISTS graph_edges_source_idx
  ON public.graph_edges (source_node_id, edge_kind, status);
CREATE INDEX IF NOT EXISTS graph_edges_target_idx
  ON public.graph_edges (target_node_id, edge_kind, status);
CREATE INDEX IF NOT EXISTS graph_edges_pair_idx
  ON public.graph_edges (source_node_id, target_node_id);
CREATE INDEX IF NOT EXISTS graph_edges_tenant_idx
  ON public.graph_edges (tenant_scope_type, tenant_scope_id);
CREATE INDEX IF NOT EXISTS graph_edges_visibility_idx
  ON public.graph_edges (visibility_class);
CREATE INDEX IF NOT EXISTS graph_edges_validity_idx
  ON public.graph_edges (valid_from, valid_until);
CREATE INDEX IF NOT EXISTS graph_edges_archive_idx
  ON public.graph_edges (archived_at);

GRANT SELECT ON public.graph_edges TO authenticated;
GRANT ALL    ON public.graph_edges TO service_role;

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_edges FORCE ROW LEVEL SECURITY;

-- ---------- updated_at triggers ----------
CREATE OR REPLACE FUNCTION public.graph_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS graph_nodes_touch ON public.graph_nodes;
CREATE TRIGGER graph_nodes_touch
  BEFORE UPDATE ON public.graph_nodes
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

DROP TRIGGER IF EXISTS graph_edges_touch ON public.graph_edges;
CREATE TRIGGER graph_edges_touch
  BEFORE UPDATE ON public.graph_edges
  FOR EACH ROW EXECUTE FUNCTION public.graph_touch_updated_at();

-- ---------- Visibility helper functions (SECURITY DEFINER, hardened) ----------

-- Does the current user own the person node (external ref → user_profiles)?
CREATE OR REPLACE FUNCTION public.graph_user_owns_node(_node public.graph_nodes)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _node.external_ref_type = 'user_profile'
      THEN _node.external_ref_id = auth.uid()::text
    WHEN _node.external_ref_type = 'auth_user'
      THEN _node.external_ref_id = auth.uid()::text
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.graph_user_owns_node(public.graph_nodes) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.graph_user_owns_node(public.graph_nodes) TO authenticated, service_role;

-- Is the current user a member of the node's tenant scope (association/community)?
CREATE OR REPLACE FUNCTION public.graph_user_in_scope(_scope_type text, _scope_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR _scope_id IS NULL THEN
    RETURN false;
  END IF;

  IF _scope_type = 'association' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.association_id = _scope_id
        AND m.user_id = _uid
    );
  END IF;

  -- 'community' + 'tenant' scopes reserved for future domains; fail closed for now.
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.graph_user_in_scope(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.graph_user_in_scope(text, uuid) TO authenticated, service_role;

-- Can the current user read this node? (fails closed)
CREATE OR REPLACE FUNCTION public.graph_can_read_node(_node public.graph_nodes)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN false
    WHEN _node.archived_at IS NOT NULL OR _node.status <> 'active' THEN false
    WHEN _node.visibility_class = 'system' THEN false
    WHEN _node.visibility_class = 'public' THEN true
    WHEN public.graph_user_owns_node(_node) THEN true
    WHEN _node.visibility_class IN ('association','community')
      AND public.graph_user_in_scope(_node.tenant_scope_type, _node.tenant_scope_id) THEN true
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.graph_can_read_node(public.graph_nodes) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.graph_can_read_node(public.graph_nodes) TO authenticated, service_role;

-- Can the current user read this node by id? (used by edge policy)
CREATE OR REPLACE FUNCTION public.graph_can_read_node_id(_node_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _n public.graph_nodes%ROWTYPE;
BEGIN
  SELECT * INTO _n FROM public.graph_nodes WHERE id = _node_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  RETURN public.graph_can_read_node(_n);
END;
$$;

REVOKE ALL ON FUNCTION public.graph_can_read_node_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.graph_can_read_node_id(uuid) TO authenticated, service_role;

-- ---------- graph_nodes RLS policies ----------
DROP POLICY IF EXISTS "graph_nodes_read_scoped" ON public.graph_nodes;
CREATE POLICY "graph_nodes_read_scoped"
  ON public.graph_nodes
  FOR SELECT
  TO authenticated
  USING (public.graph_can_read_node(graph_nodes));

-- No INSERT/UPDATE/DELETE policies for authenticated (writes via SECURITY DEFINER in BC-4.2).

-- ---------- graph_edges RLS policies ----------
DROP POLICY IF EXISTS "graph_edges_read_scoped" ON public.graph_edges;
CREATE POLICY "graph_edges_read_scoped"
  ON public.graph_edges
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND archived_at IS NULL
    AND status = 'active'
    AND visibility_class <> 'system'
    AND public.graph_can_read_node_id(source_node_id)
    AND public.graph_can_read_node_id(target_node_id)
    AND (
      visibility_class = 'public'
      OR (
        visibility_class = 'private' AND (
          EXISTS (
            SELECT 1 FROM public.graph_nodes n
            WHERE n.id = graph_edges.source_node_id
              AND public.graph_user_owns_node(n)
          )
          OR EXISTS (
            SELECT 1 FROM public.graph_nodes n
            WHERE n.id = graph_edges.target_node_id
              AND public.graph_user_owns_node(n)
          )
        )
      )
      OR (
        visibility_class IN ('association','community')
        AND public.graph_user_in_scope(tenant_scope_type, tenant_scope_id)
      )
      OR (
        visibility_class = 'connected'
        -- 'connected' visibility resolved in BC-4.2 when connection edges exist.
        -- Until then fall back to endpoint ownership.
        AND (
          EXISTS (
            SELECT 1 FROM public.graph_nodes n
            WHERE n.id = graph_edges.source_node_id
              AND public.graph_user_owns_node(n)
          )
          OR EXISTS (
            SELECT 1 FROM public.graph_nodes n
            WHERE n.id = graph_edges.target_node_id
              AND public.graph_user_owns_node(n)
          )
        )
      )
    )
  );

-- No write policies for authenticated on graph_edges either.
