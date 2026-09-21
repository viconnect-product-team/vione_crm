
DO $$
DECLARE t text;
DECLARE member_tables text[] := ARRAY[
  'messages','connections','quote_requests','products',
  'opportunities','opportunity_interests','reviews','event_registrations'];
BEGIN
  FOREACH t IN ARRAY member_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_admin_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_admin_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_admin_delete', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t||'_member_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t||'_member_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', t||'_member_delete', t);
  END LOOP;
END $$;
