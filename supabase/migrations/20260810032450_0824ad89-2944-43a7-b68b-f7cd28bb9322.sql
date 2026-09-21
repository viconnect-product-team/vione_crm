CREATE TABLE public.relationship_recommendation_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id text NOT NULL,
  recommendation_type text NOT NULL,
  dismissed_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relationship_recommendation_dismissals_unique UNIQUE (owner_user_id, person_id, recommendation_type),
  CONSTRAINT relationship_recommendation_dismissals_person_id_format CHECK (person_id ~ '^[ucg]:[0-9a-fA-F-]{36}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_recommendation_dismissals TO authenticated;
GRANT ALL ON public.relationship_recommendation_dismissals TO service_role;

ALTER TABLE public.relationship_recommendation_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their own dismissals"
  ON public.relationship_recommendation_dismissals FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Owners can create their own dismissals"
  ON public.relationship_recommendation_dismissals FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can update their own dismissals"
  ON public.relationship_recommendation_dismissals FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their own dismissals"
  ON public.relationship_recommendation_dismissals FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());