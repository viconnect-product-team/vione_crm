CREATE UNIQUE INDEX IF NOT EXISTS demo_requests_slot_unique
  ON public.demo_requests (preferred_date, preferred_slot)
  WHERE preferred_date IS NOT NULL AND preferred_slot IS NOT NULL;