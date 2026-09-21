CREATE POLICY "cjr_select_assoc_manager" ON public.community_join_requests
  FOR SELECT TO authenticated
  USING (public.is_assoc_manager(association_id));