CREATE TABLE public.relationship_intelligence_preferences (
  viewer_user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendations_enabled boolean NOT NULL DEFAULT true,
  reconnect_enabled boolean NOT NULL DEFAULT true,
  reconnect_cadence text NOT NULL DEFAULT 'auto' CHECK (reconnect_cadence IN ('auto','more_often','normal','less_often')),
  preferred_contact_action text NOT NULL DEFAULT 'auto' CHECK (preferred_contact_action IN ('auto','call','email')),
  behavioral_adaptation_enabled boolean NOT NULL DEFAULT true,
  policy_version text NOT NULL DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_intelligence_preferences TO authenticated;
GRANT ALL ON public.relationship_intelligence_preferences TO service_role;

ALTER TABLE public.relationship_intelligence_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers can read their own intel preferences"
  ON public.relationship_intelligence_preferences FOR SELECT TO authenticated
  USING (viewer_user_id = auth.uid());

CREATE POLICY "Viewers can create their own intel preferences"
  ON public.relationship_intelligence_preferences FOR INSERT TO authenticated
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY "Viewers can update their own intel preferences"
  ON public.relationship_intelligence_preferences FOR UPDATE TO authenticated
  USING (viewer_user_id = auth.uid())
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY "Viewers can delete their own intel preferences"
  ON public.relationship_intelligence_preferences FOR DELETE TO authenticated
  USING (viewer_user_id = auth.uid());

CREATE TRIGGER update_relationship_intelligence_preferences_updated_at
BEFORE UPDATE ON public.relationship_intelligence_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.relationship_intelligence_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('recommendation_opened','recommendation_dismissed','action_call_selected','action_email_selected','action_person_opened','action_moment_selected')),
  recommendation_type text CHECK (recommendation_type IN ('reconnect')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX relationship_intelligence_interactions_viewer_time_idx
  ON public.relationship_intelligence_interactions (viewer_user_id, occurred_at DESC);

GRANT SELECT, INSERT, DELETE ON public.relationship_intelligence_interactions TO authenticated;
GRANT ALL ON public.relationship_intelligence_interactions TO service_role;

ALTER TABLE public.relationship_intelligence_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers can read their own intel interactions"
  ON public.relationship_intelligence_interactions FOR SELECT TO authenticated
  USING (viewer_user_id = auth.uid());

CREATE POLICY "Viewers can record their own intel interactions"
  ON public.relationship_intelligence_interactions FOR INSERT TO authenticated
  WITH CHECK (viewer_user_id = auth.uid());

CREATE POLICY "Viewers can delete their own intel interactions"
  ON public.relationship_intelligence_interactions FOR DELETE TO authenticated
  USING (viewer_user_id = auth.uid());