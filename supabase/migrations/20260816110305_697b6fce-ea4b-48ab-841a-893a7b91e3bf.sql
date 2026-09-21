UPDATE public.events e
SET registered = COALESCE((SELECT count(*) FROM public.event_registrations r WHERE r.event_id = e.id), 0),
    capacity = GREATEST(e.capacity, COALESCE((SELECT count(*) FROM public.event_registrations r WHERE r.event_id = e.id), 0) + 20);