CREATE TABLE public.community_opportunity_followup_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  association_id uuid NOT NULL,
  opportunity_id text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('link','file')),
  title text,
  url text,
  storage_path text,
  mime_type text,
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coa_user_opp ON public.community_opportunity_followup_attachments (user_id, opportunity_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.community_opportunity_followup_attachments TO authenticated;
GRANT ALL ON public.community_opportunity_followup_attachments TO service_role;

ALTER TABLE public.community_opportunity_followup_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coa_select_own" ON public.community_opportunity_followup_attachments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "coa_insert_own" ON public.community_opportunity_followup_attachments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "coa_delete_own" ON public.community_opportunity_followup_attachments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "opp_attach_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'opportunity-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "opp_attach_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'opportunity-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "opp_attach_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'opportunity-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);