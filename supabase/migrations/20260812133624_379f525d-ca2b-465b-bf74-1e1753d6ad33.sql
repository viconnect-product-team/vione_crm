DO $$
DECLARE u uuid; m1 uuid; m2 uuid; d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
BEGIN
FOREACH u IN ARRAY ARRAY['e3de1319-d8fa-4b8f-ae09-59f4733e6168'::uuid,'93de8236-fafd-45c4-97b9-2a0e2dc3db83'::uuid] LOOP
  DELETE FROM public.business_meeting_follow_ups WHERE owner_user_id = u AND title LIKE '[DEMO]%';
  DELETE FROM public.business_meetings WHERE organizer_user_id = u AND title LIKE '[DEMO]%';

  INSERT INTO public.business_meetings (created_by_user_id, organizer_user_id, title, description, meeting_type, status, timezone, scheduling_mode, scheduled_start_at, scheduled_end_at, scheduled_timezone)
  VALUES (u, u, '[DEMO] Cà phê chiến lược với Trần Minh Khoa', 'Trao đổi cơ hội hợp tác phân phối khu vực miền Nam.', 'in_person', 'confirmed', 'Asia/Ho_Chi_Minh', 'scheduled',
    ((d::text || ' 10:30')::timestamp at time zone 'Asia/Ho_Chi_Minh'),
    ((d::text || ' 11:30')::timestamp at time zone 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh')
  RETURNING id INTO m1;

  INSERT INTO public.business_meetings (created_by_user_id, organizer_user_id, title, description, meeting_type, status, timezone, scheduling_mode, scheduled_start_at, scheduled_end_at, scheduled_timezone)
  VALUES (u, u, '[DEMO] Họp trực tuyến với Nguyễn Thu Hà', 'Rà soát đề xuất đầu tư vòng hạt giống.', 'video_call', 'confirmed', 'Asia/Ho_Chi_Minh', 'scheduled',
    ((d::text || ' 14:00')::timestamp at time zone 'Asia/Ho_Chi_Minh'),
    ((d::text || ' 15:00')::timestamp at time zone 'Asia/Ho_Chi_Minh'), 'Asia/Ho_Chi_Minh')
  RETURNING id INTO m2;

  INSERT INTO public.business_meeting_follow_ups (meeting_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at)
  VALUES
    (m1, u, u, '[DEMO] Gửi hồ sơ năng lực cho Trần Minh Khoa', 'Kèm báo giá sơ bộ.', 'open', 'high', now() + interval '6 hours'),
    (m2, u, u, '[DEMO] Chốt lịch demo sản phẩm', 'Xác nhận với đội kỹ thuật.', 'open', 'normal', now() + interval '2 days');
END LOOP;
END $$;