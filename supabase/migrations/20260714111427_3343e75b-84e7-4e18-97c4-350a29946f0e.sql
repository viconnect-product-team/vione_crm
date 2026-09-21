
-- ─── 1. Edge idempotency column & uniqueness ────────────────
ALTER TABLE public.graph_edges
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS graph_edges_idem_idx
  ON public.graph_edges (created_by_user_id, edge_kind, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.graph_edges
  DROP CONSTRAINT IF EXISTS graph_edges_no_self_edge;
ALTER TABLE public.graph_edges
  ADD CONSTRAINT graph_edges_no_self_edge CHECK (source_node_id <> target_node_id);

CREATE UNIQUE INDEX IF NOT EXISTS graph_edges_active_unique_idx
  ON public.graph_edges (edge_kind, source_node_id, target_node_id)
  WHERE status = 'active' AND archived_at IS NULL;

-- ─── 2. Timeline events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.graph_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind text NOT NULL,
  subject_node_id uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  related_node_id uuid REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  edge_id uuid REFERENCES public.graph_edges(id) ON DELETE CASCADE,
  actor_node_id uuid REFERENCES public.graph_nodes(id) ON DELETE SET NULL,
  actor_user_id uuid,
  tenant_scope_type text NOT NULL DEFAULT 'global'
    CHECK (tenant_scope_type IN ('global','association','community','tenant')),
  tenant_scope_id uuid,
  visibility_class text NOT NULL DEFAULT 'private'
    CHECK (visibility_class IN ('private','connected','association','community','public','system')),
  summary_key text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  registry_version integer NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text,
  collapse_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS graph_timeline_events_dedupe_idx
  ON public.graph_timeline_events (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS graph_timeline_subject_idx
  ON public.graph_timeline_events (subject_node_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS graph_timeline_related_idx
  ON public.graph_timeline_events (related_node_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS graph_timeline_edge_idx
  ON public.graph_timeline_events (edge_id);
CREATE INDEX IF NOT EXISTS graph_timeline_tenant_idx
  ON public.graph_timeline_events (tenant_scope_type, tenant_scope_id);
CREATE INDEX IF NOT EXISTS graph_timeline_visibility_idx
  ON public.graph_timeline_events (visibility_class);
CREATE INDEX IF NOT EXISTS graph_timeline_archive_idx
  ON public.graph_timeline_events (archived_at);

REVOKE ALL ON public.graph_timeline_events FROM PUBLIC;
REVOKE ALL ON public.graph_timeline_events FROM anon;
GRANT SELECT ON public.graph_timeline_events TO authenticated;
GRANT ALL ON public.graph_timeline_events TO service_role;

ALTER TABLE public.graph_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_timeline_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS graph_timeline_read ON public.graph_timeline_events;
CREATE POLICY graph_timeline_read
  ON public.graph_timeline_events
  FOR SELECT
  TO authenticated
  USING (
    archived_at IS NULL
    AND visibility_class <> 'system'
    AND public.graph_can_read_node_id(subject_node_id)
    AND (related_node_id IS NULL OR public.graph_can_read_node_id(related_node_id))
  );

-- ─── 3. Outbox ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.graph_outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_kind text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS graph_outbox_pending_idx
  ON public.graph_outbox_events (processed_at, available_at)
  WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS graph_outbox_aggregate_idx
  ON public.graph_outbox_events (aggregate_type, aggregate_id);
CREATE INDEX IF NOT EXISTS graph_outbox_kind_idx
  ON public.graph_outbox_events (event_kind);

REVOKE ALL ON public.graph_outbox_events FROM PUBLIC;
REVOKE ALL ON public.graph_outbox_events FROM anon;
REVOKE ALL ON public.graph_outbox_events FROM authenticated;
GRANT ALL ON public.graph_outbox_events TO service_role;
ALTER TABLE public.graph_outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_outbox_events FORCE ROW LEVEL SECURITY;

-- ─── 4. Connected visibility using real edges ───────────────
CREATE OR REPLACE FUNCTION public.graph_viewer_connected_to(_node_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.graph_nodes viewer_node
    JOIN public.graph_edges e
      ON e.edge_kind = 'CONNECTED_TO'
     AND e.status = 'active'
     AND e.archived_at IS NULL
     AND (
       (e.source_node_id = viewer_node.id AND e.target_node_id = _node_id)
       OR (e.target_node_id = viewer_node.id AND e.source_node_id = _node_id)
     )
    WHERE viewer_node.node_kind = 'person'
      AND viewer_node.external_ref_type = 'user_profile'
      AND viewer_node.external_ref_id = auth.uid()::text
      AND viewer_node.status = 'active'
      AND viewer_node.archived_at IS NULL
  );
$$;
REVOKE ALL ON FUNCTION public.graph_viewer_connected_to(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_viewer_connected_to(uuid) TO authenticated, service_role;

-- Keep original param name '_node' to avoid ALTER-signature errors.
CREATE OR REPLACE FUNCTION public.graph_can_read_node(_node public.graph_nodes)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF _node.status <> 'active' OR _node.archived_at IS NOT NULL THEN RETURN false; END IF;
  IF _node.visibility_class = 'system' THEN RETURN false; END IF;
  IF uid IS NULL THEN RETURN false; END IF;
  IF _node.visibility_class = 'public' THEN RETURN true; END IF;
  IF _node.visibility_class = 'private' THEN
    RETURN public.graph_user_owns_node(_node);
  END IF;
  IF _node.visibility_class = 'connected' THEN
    IF public.graph_user_owns_node(_node) THEN RETURN true; END IF;
    RETURN public.graph_viewer_connected_to(_node.id);
  END IF;
  IF _node.visibility_class IN ('association','community','tenant') THEN
    RETURN public.graph_user_in_scope(_node.tenant_scope_type, _node.tenant_scope_id);
  END IF;
  RETURN false;
END;
$$;

-- ─── 5. Write RPCs ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.graph_register_node(
  _node_kind text, _external_ref_type text, _external_ref_id text,
  _tenant_scope_type text, _tenant_scope_id uuid,
  _visibility_class text, _metadata jsonb, _registry_version integer
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); existing_id uuid; new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  IF _visibility_class = 'system' THEN RAISE EXCEPTION 'VISIBILITY_INVALID' USING ERRCODE='22023'; END IF;

  SELECT id INTO existing_id FROM public.graph_nodes
   WHERE node_kind=_node_kind AND external_ref_type=_external_ref_type AND external_ref_id=_external_ref_id;
  IF existing_id IS NOT NULL THEN RETURN existing_id; END IF;

  INSERT INTO public.graph_nodes (
    node_kind, external_ref_type, external_ref_id,
    tenant_scope_type, tenant_scope_id,
    visibility_class, status, metadata, registry_version
  ) VALUES (
    _node_kind, _external_ref_type, _external_ref_id,
    COALESCE(_tenant_scope_type,'global'), _tenant_scope_id,
    COALESCE(_visibility_class,'private'), 'active',
    COALESCE(_metadata,'{}'::jsonb), _registry_version
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
REVOKE ALL ON FUNCTION public.graph_register_node(text,text,text,text,uuid,text,jsonb,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_register_node(text,text,text,text,uuid,text,jsonb,integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.graph_archive_node(_node_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); nrow public.graph_nodes;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  SELECT * INTO nrow FROM public.graph_nodes WHERE id=_node_id;
  IF nrow.id IS NULL THEN RAISE EXCEPTION 'NODE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF NOT public.graph_user_owns_node(nrow) THEN
    RAISE EXCEPTION 'WRITE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  UPDATE public.graph_nodes SET status='archived', archived_at=now()
   WHERE id=_node_id AND archived_at IS NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.graph_restore_node(_node_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); nrow public.graph_nodes;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  SELECT * INTO nrow FROM public.graph_nodes WHERE id=_node_id;
  IF nrow.id IS NULL THEN RAISE EXCEPTION 'NODE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  IF NOT public.graph_user_owns_node(nrow) THEN
    RAISE EXCEPTION 'WRITE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  UPDATE public.graph_nodes SET status='active', archived_at=NULL WHERE id=_node_id;
END; $$;

REVOKE ALL ON FUNCTION public.graph_archive_node(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.graph_restore_node(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_archive_node(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.graph_restore_node(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.graph_record_timeline_event(
  _event_kind text, _subject_node_id uuid, _related_node_id uuid, _edge_id uuid,
  _actor_node_id uuid, _actor_user_id uuid,
  _tenant_scope_type text, _tenant_scope_id uuid,
  _visibility_class text, _summary_key text,
  _metadata jsonb, _registry_version integer,
  _dedupe_key text, _collapse_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF _dedupe_key IS NOT NULL THEN
    SELECT id INTO new_id FROM public.graph_timeline_events
      WHERE dedupe_key=_dedupe_key AND archived_at IS NULL LIMIT 1;
    IF new_id IS NOT NULL THEN RETURN new_id; END IF;
  END IF;
  BEGIN
    INSERT INTO public.graph_timeline_events (
      event_kind, subject_node_id, related_node_id, edge_id,
      actor_node_id, actor_user_id, tenant_scope_type, tenant_scope_id,
      visibility_class, summary_key, metadata, registry_version,
      dedupe_key, collapse_key
    ) VALUES (
      _event_kind, _subject_node_id, _related_node_id, _edge_id,
      _actor_node_id, _actor_user_id, COALESCE(_tenant_scope_type,'global'), _tenant_scope_id,
      COALESCE(_visibility_class,'private'), _summary_key,
      COALESCE(_metadata,'{}'::jsonb), _registry_version,
      _dedupe_key, _collapse_key
    ) RETURNING id INTO new_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO new_id FROM public.graph_timeline_events
      WHERE dedupe_key=_dedupe_key AND archived_at IS NULL LIMIT 1;
  END;
  RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.graph_record_timeline_event(text,uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,jsonb,integer,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.graph_record_timeline_event(text,uuid,uuid,uuid,uuid,uuid,text,uuid,text,text,jsonb,integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.graph_emit_outbox_event(
  _event_kind text, _aggregate_type text, _aggregate_id uuid,
  _payload jsonb, _idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  BEGIN
    INSERT INTO public.graph_outbox_events (event_kind, aggregate_type, aggregate_id, payload, idempotency_key)
    VALUES (_event_kind, _aggregate_type, _aggregate_id, COALESCE(_payload,'{}'::jsonb), _idempotency_key)
    RETURNING id INTO new_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT id INTO new_id FROM public.graph_outbox_events WHERE idempotency_key=_idempotency_key LIMIT 1;
  END;
  RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.graph_emit_outbox_event(text,text,uuid,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.graph_emit_outbox_event(text,text,uuid,jsonb,text) TO service_role;

CREATE OR REPLACE FUNCTION public.graph_create_edge(
  _edge_kind text, _source_node_id uuid, _target_node_id uuid,
  _directionality text, _visibility_class text,
  _tenant_scope_type text, _tenant_scope_id uuid,
  _metadata jsonb, _registry_version integer,
  _idempotency_key text, _timeline_emit boolean, _timeline_summary_key text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing_id uuid; new_edge_id uuid; actor_node uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  IF _source_node_id = _target_node_id THEN
    RAISE EXCEPTION 'SELF_EDGE_FORBIDDEN' USING ERRCODE='22023';
  END IF;
  IF _visibility_class = 'system' THEN
    RAISE EXCEPTION 'VISIBILITY_INVALID' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.graph_nodes WHERE id=_source_node_id AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'SOURCE_NODE_NOT_FOUND' USING ERRCODE='P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.graph_nodes WHERE id=_target_node_id AND archived_at IS NULL) THEN
    RAISE EXCEPTION 'TARGET_NODE_NOT_FOUND' USING ERRCODE='P0002';
  END IF;

  IF _idempotency_key IS NOT NULL THEN
    SELECT id INTO existing_id FROM public.graph_edges
      WHERE created_by_user_id=uid AND edge_kind=_edge_kind AND idempotency_key=_idempotency_key LIMIT 1;
    IF existing_id IS NOT NULL THEN RETURN existing_id; END IF;
  END IF;

  SELECT id INTO existing_id FROM public.graph_edges
    WHERE edge_kind=_edge_kind AND source_node_id=_source_node_id AND target_node_id=_target_node_id
      AND status='active' AND archived_at IS NULL LIMIT 1;
  IF existing_id IS NOT NULL THEN RETURN existing_id; END IF;

  INSERT INTO public.graph_edges (
    edge_kind, source_node_id, target_node_id, directionality,
    visibility_class, tenant_scope_type, tenant_scope_id,
    status, metadata, registry_version, created_by_user_id, idempotency_key
  ) VALUES (
    _edge_kind, _source_node_id, _target_node_id, COALESCE(_directionality,'directed'),
    COALESCE(_visibility_class,'private'), COALESCE(_tenant_scope_type,'global'), _tenant_scope_id,
    'active', COALESCE(_metadata,'{}'::jsonb), _registry_version, uid, _idempotency_key
  ) RETURNING id INTO new_edge_id;

  SELECT id INTO actor_node FROM public.graph_nodes
    WHERE node_kind='person' AND external_ref_type='user_profile' AND external_ref_id=uid::text LIMIT 1;

  IF COALESCE(_timeline_emit,false) THEN
    PERFORM public.graph_record_timeline_event(
      _edge_kind, _source_node_id, _target_node_id, new_edge_id,
      actor_node, uid, COALESCE(_tenant_scope_type,'global'), _tenant_scope_id,
      COALESCE(_visibility_class,'private'),
      COALESCE(_timeline_summary_key, 'graph.timeline.' || lower(_edge_kind)),
      '{}'::jsonb, _registry_version, 'edge:' || new_edge_id::text, null
    );
  END IF;

  PERFORM public.graph_emit_outbox_event(
    'graph_edge_created', 'graph_edge', new_edge_id,
    jsonb_build_object('edgeKind', _edge_kind, 'sourceNodeId', _source_node_id, 'targetNodeId', _target_node_id),
    'edge_created:' || new_edge_id::text
  );
  RETURN new_edge_id;
END; $$;
REVOKE ALL ON FUNCTION public.graph_create_edge(text,uuid,uuid,text,text,text,uuid,jsonb,integer,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_create_edge(text,uuid,uuid,text,text,text,uuid,jsonb,integer,text,boolean,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.graph_archive_edge(_edge_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); srow public.graph_nodes; trow public.graph_nodes; sid uuid; tid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  SELECT source_node_id, target_node_id INTO sid, tid FROM public.graph_edges WHERE id=_edge_id;
  IF sid IS NULL THEN RAISE EXCEPTION 'EDGE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  SELECT * INTO srow FROM public.graph_nodes WHERE id=sid;
  SELECT * INTO trow FROM public.graph_nodes WHERE id=tid;
  IF NOT (public.graph_user_owns_node(srow) OR public.graph_user_owns_node(trow)) THEN
    RAISE EXCEPTION 'WRITE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  UPDATE public.graph_edges SET status='archived', archived_at=now() WHERE id=_edge_id AND archived_at IS NULL;
  UPDATE public.graph_timeline_events SET archived_at=now() WHERE edge_id=_edge_id AND archived_at IS NULL;
  PERFORM public.graph_emit_outbox_event(
    'graph_edge_archived', 'graph_edge', _edge_id,
    jsonb_build_object('edgeId', _edge_id),
    'edge_archived:' || _edge_id::text || ':' || extract(epoch from now())::text
  );
END; $$;

CREATE OR REPLACE FUNCTION public.graph_restore_edge(_edge_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); srow public.graph_nodes; trow public.graph_nodes; sid uuid; tid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  SELECT source_node_id, target_node_id INTO sid, tid FROM public.graph_edges WHERE id=_edge_id;
  IF sid IS NULL THEN RAISE EXCEPTION 'EDGE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  SELECT * INTO srow FROM public.graph_nodes WHERE id=sid;
  SELECT * INTO trow FROM public.graph_nodes WHERE id=tid;
  IF NOT (public.graph_user_owns_node(srow) OR public.graph_user_owns_node(trow)) THEN
    RAISE EXCEPTION 'WRITE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  UPDATE public.graph_edges SET status='active', archived_at=NULL WHERE id=_edge_id;
  PERFORM public.graph_emit_outbox_event(
    'graph_edge_restored', 'graph_edge', _edge_id,
    jsonb_build_object('edgeId', _edge_id),
    'edge_restored:' || _edge_id::text || ':' || extract(epoch from now())::text
  );
END; $$;

REVOKE ALL ON FUNCTION public.graph_archive_edge(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.graph_restore_edge(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_archive_edge(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.graph_restore_edge(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.graph_update_edge_metadata(_edge_id uuid, _metadata jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uid uuid := auth.uid(); srow public.graph_nodes; trow public.graph_nodes; sid uuid; tid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'UNAUTHENTICATED' USING ERRCODE='28000'; END IF;
  SELECT source_node_id, target_node_id INTO sid, tid FROM public.graph_edges WHERE id=_edge_id;
  IF sid IS NULL THEN RAISE EXCEPTION 'EDGE_NOT_FOUND' USING ERRCODE='P0002'; END IF;
  SELECT * INTO srow FROM public.graph_nodes WHERE id=sid;
  SELECT * INTO trow FROM public.graph_nodes WHERE id=tid;
  IF NOT (public.graph_user_owns_node(srow) OR public.graph_user_owns_node(trow)) THEN
    RAISE EXCEPTION 'WRITE_FORBIDDEN' USING ERRCODE='42501';
  END IF;
  UPDATE public.graph_edges SET metadata=COALESCE(_metadata,'{}'::jsonb), updated_at=now() WHERE id=_edge_id;
END; $$;
REVOKE ALL ON FUNCTION public.graph_update_edge_metadata(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graph_update_edge_metadata(uuid,jsonb) TO authenticated, service_role;

-- ─── 6. Deny direct writes to authenticated ─────────────────
REVOKE INSERT, UPDATE, DELETE ON public.graph_nodes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.graph_edges FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.graph_timeline_events FROM authenticated;

-- ─── 7. BC-4.1V synthetic fixture cleanup ───────────────────
DELETE FROM public.graph_edges
 WHERE source_node_id IN (SELECT id FROM public.graph_nodes WHERE external_ref_id LIKE 'bc41v_synth_%')
    OR target_node_id IN (SELECT id FROM public.graph_nodes WHERE external_ref_id LIKE 'bc41v_synth_%');
DELETE FROM public.graph_nodes WHERE external_ref_id LIKE 'bc41v_synth_%';
