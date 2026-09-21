CREATE TABLE public.member_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  member_code TEXT NOT NULL,
  event_id TEXT,
  event_title TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.member_checkins TO service_role;

ALTER TABLE public.member_checkins ENABLE ROW LEVEL SECURITY;