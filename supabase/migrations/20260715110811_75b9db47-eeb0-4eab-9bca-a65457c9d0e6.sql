
-- BC-7.5B — Relationship Timeline Domain Projection foundations.

-- 1) By-id read helper for graph_timeline_events. SECURITY INVOKER so
--    existing RLS on the table governs visibility (subject + related node).
CREATE OR REPLACE FUNCTION public.graph_timeline_event_get(_event_id uuid)
RETURNS SETOF public.graph_timeline_events
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT * FROM public.graph_timeline_events
  WHERE id = _event_id
    AND archived_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.graph_timeline_event_get(uuid) TO authenticated, service_role;

-- 2) Deterministic emitters into the graph outbox for lifecycle events.
--    Each emitter builds an idempotency_key that is stable per logical event
--    (aggregate + kind + state token), so replays never duplicate.

-- Introduction Delivery lifecycle
CREATE OR REPLACE FUNCTION public.tg_intro_delivery_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_payload jsonb;
  v_ikey text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'INTRO_DELIVERY_CREATED';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_kind := 'INTRO_DELIVERY_' || upper(NEW.status);
  ELSE
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'introductionRequestId', NEW.introduction_request_id,
    'requesterPersonNodeId', NEW.requester_person_node_id,
    'intermediaryPersonNodeId', NEW.intermediary_person_node_id,
    'targetPersonNodeId', NEW.target_person_node_id,
    'status', NEW.status
  );
  v_ikey := 'intro_delivery:' || NEW.id::text || ':' || v_kind;

  PERFORM public.graph_emit_outbox_event(
    v_kind, 'introduction_delivery', NEW.id, v_payload, v_ikey
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intro_delivery_outbox ON public.introduction_deliveries;
CREATE TRIGGER trg_intro_delivery_outbox
AFTER INSERT OR UPDATE OF status ON public.introduction_deliveries
FOR EACH ROW EXECUTE FUNCTION public.tg_intro_delivery_outbox();

-- Introduction Outcome lifecycle
CREATE OR REPLACE FUNCTION public.tg_intro_outcome_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_payload jsonb;
  v_ikey text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'INTRO_OUTCOME_CREATED';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_kind := 'INTRO_OUTCOME_' || upper(NEW.status);
  ELSE
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'introductionRequestId', NEW.introduction_request_id,
    'requesterPersonNodeId', NEW.requester_person_node_id,
    'targetPersonNodeId', NEW.target_person_node_id,
    'status', NEW.status
  );
  v_ikey := 'intro_outcome:' || NEW.id::text || ':' || v_kind;

  PERFORM public.graph_emit_outbox_event(
    v_kind, 'introduction_outcome', NEW.id, v_payload, v_ikey
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_intro_outcome_outbox ON public.introduction_outcomes;
CREATE TRIGGER trg_intro_outcome_outbox
AFTER INSERT OR UPDATE OF status ON public.introduction_outcomes
FOR EACH ROW EXECUTE FUNCTION public.tg_intro_outcome_outbox();

-- Business Meeting lifecycle
CREATE OR REPLACE FUNCTION public.tg_meeting_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_payload jsonb;
  v_ikey text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'MEETING_CREATED';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_kind := 'MEETING_' || upper(NEW.status);
  ELSE
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'meetingId', NEW.id,
    'organizerUserId', NEW.organizer_user_id,
    'meetingType', NEW.meeting_type,
    'status', NEW.status
  );
  v_ikey := 'meeting:' || NEW.id::text || ':' || v_kind;

  PERFORM public.graph_emit_outbox_event(
    v_kind, 'business_meeting', NEW.id, v_payload, v_ikey
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meeting_outbox ON public.business_meetings;
CREATE TRIGGER trg_meeting_outbox
AFTER INSERT OR UPDATE OF status ON public.business_meetings
FOR EACH ROW EXECUTE FUNCTION public.tg_meeting_outbox();

-- 3) Projection scan index
CREATE INDEX IF NOT EXISTS idx_graph_outbox_projection_pending
  ON public.graph_outbox_events (available_at)
  WHERE processed_at IS NULL;
