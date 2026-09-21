
CREATE OR REPLACE FUNCTION public.tg_meeting_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_kind text;
  v_payload jsonb;
  v_ikey text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'MEETING_CREATED';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_kind := 'MEETING_' || upper(NEW.status::text);
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
$fn$;

DO $$
DECLARE
  u uuid := '93de8236-fafd-45c4-97b9-2a0e2dc3db83';
  assoc uuid := '6b4c9901-ddf1-439c-826f-4c7f9fc836e9';
  peer1 uuid := '4f15cc7d-6e30-4192-ac9c-290ace8ea71d';
  peer2 uuid := '200d9302-c5b6-4f2c-8eca-9c51cf6284fc';
  peer3 uuid := 'dc038648-67cf-455b-a93e-489ad421b25a';
  peer4 uuid := 'a58e5cff-28d3-4439-9c50-a787731c1323';
  ident uuid;
  cid uuid;
  mid uuid;
  n integer;
  nm text; ttl text; comp text; slg text;
  names text[] := ARRAY['Trần Minh Quân','Lê Thu Hà','Phạm Anh Tuấn','Nguyễn Bảo Ngọc','Đỗ Hoàng Long','Vũ Khánh Linh','Bùi Đức Thắng','Hoàng Mai Phương'];
  titles text[] := ARRAY['Tổng giám đốc','Giám đốc Tài chính','Giám đốc Công nghệ','Trưởng phòng Kinh doanh','Chủ tịch HĐQT','Giám đốc Marketing','Giám đốc Vận hành','Giám đốc Nhân sự'];
  comps text[] := ARRAY['Uranus Tech','An Phát Group','Sao Việt Logistics','Minh Long Invest','Đại Việt Energy','NextGen Retail','Thành Đạt Construction','Hòa Bình Pharma'];
BEGIN
  SELECT id INTO ident FROM public.business_identities WHERE owner_user_id = u;
  IF ident IS NULL THEN
    INSERT INTO public.business_identities (owner_user_id, display_name, headline, job_title, company_name, bio, primary_email, primary_phone, website, linkedin_url, address, city, country_code, preferred_locale, status)
    VALUES (u, 'James Nguyễn', 'Kết nối doanh nghiệp - Đầu tư - Công nghệ', 'Tổng giám đốc', 'Uranus Technology JSC',
         'Hơn 15 năm xây dựng hệ sinh thái kết nối doanh nghiệp tại Việt Nam.',
         'jamesnguyen@uranustech.vn', '+84 901 234 567', 'https://uranustech.vn', 'https://linkedin.com/in/jamesnguyen',
         '72 Lê Thánh Tôn, Quận 1', 'TP. Hồ Chí Minh', 'VN', 'vi', 'active')
    RETURNING id INTO ident;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.members WHERE association_id = assoc AND user_id = u) THEN
    INSERT INTO public.members (id, code, name, contact, email, phone, type, level, industry, region, status, joined_at, fee_year, fee_paid, address, website, about, association_id, user_id)
    VALUES ('VIONE-JAMES','VIONE-JAMES','Uranus Technology JSC','James Nguyễn','jamesnguyen@uranustech.vn','+84 901 234 567','company','memberLevel.medium','ind.it','region.south','active', current_date - 400, 2026, true, '72 Lê Thánh Tôn, Quận 1', 'https://uranustech.vn','Nền tảng kết nối doanh nghiệp ViOne.', assoc, u);
  END IF;

  FOR n IN 1..8 LOOP
    nm := names[n]; ttl := titles[n]; comp := comps[n];
    slg := 'vione-demo-' || n;
    SELECT id INTO cid FROM public.member_business_cards WHERE slug = slg;
    IF cid IS NULL THEN
      INSERT INTO public.member_business_cards (association_id, slug, card_kind, status, public_mode, display_name, professional_title, company_name, headline, bio, website, work_email, work_phone, address, published_at)
      VALUES (assoc, slg, 'primary', 'published', 'public', nm, ttl, comp,
              ttl || ' tại ' || comp, 'Thành viên cộng đồng doanh nghiệp ViOne.',
              'https://demo' || n || '.vn', 'contact' || n || '@vione.vn', '+84 90' || n || ' 000 00' || n,
              'Hà Nội', now() - (n || ' days')::interval)
      RETURNING id INTO cid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.saved_business_cards WHERE owner_user_id = u AND target_card_id = cid) THEN
      INSERT INTO public.saved_business_cards (owner_user_id, target_card_id, saved_at, favorite, tags, source, company, industry, meeting_place, importance, last_contact_at, archived)
      VALUES (u, cid, now() - (n * 6 || ' days')::interval, n <= 2, ARRAY['demo'], 'profile', comp,
              CASE WHEN n % 2 = 0 THEN 'ind.it' ELSE 'ind.trade' END,
              'Hội nghị ViOne 2026', 3, now() - (n * 4 || ' days')::interval, false);
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM public.guest_contacts WHERE owner_user_id = u) THEN
    INSERT INTO public.guest_contacts (owner_user_id, source_identity_id, display_name, phone, email, company_name, title, source, client_token, first_shared_at, last_shared_at)
    VALUES
      (u, ident,'Ngô Thanh Sơn','+84 912 345 678','son.ngo@vietbuild.vn','VietBuild JSC','Giám đốc Dự án','share', gen_random_uuid()::text, now() - interval '9 days', now() - interval '9 days'),
      (u, ident,'Đặng Thu Trang','+84 934 567 890','trang.dang@greenfarm.vn','GreenFarm Co.','Trưởng phòng Xuất khẩu','share', gen_random_uuid()::text, now() - interval '20 days', now() - interval '5 days'),
      (u, ident,'Lý Gia Bảo','+84 977 123 456','bao.ly@fintechone.vn','FintechOne','Đồng sáng lập','share', gen_random_uuid()::text, now() - interval '2 days', now() - interval '2 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_connections WHERE requester_user_id = u OR recipient_user_id = u) THEN
    INSERT INTO public.user_connections (requester_user_id, recipient_user_id, status, source_type, requested_at, responded_at)
    VALUES
      (u, peer3, 'accepted', 'business_card', now() - interval '30 days', now() - interval '29 days'),
      (peer4, u, 'accepted', 'event', now() - interval '15 days', now() - interval '14 days'),
      (peer1, u, 'pending', 'qr', now() - interval '2 days', NULL),
      (peer2, u, 'pending', 'business_card', now() - interval '8 hours', NULL);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.business_meetings WHERE organizer_user_id = u) THEN
    INSERT INTO public.business_meetings (created_by_user_id, organizer_user_id, title, description, meeting_type, status, timezone, source_type, association_id, scheduling_mode, scheduled_start_at, scheduled_end_at, scheduled_timezone)
    VALUES (u, u, 'Cà phê kết nối với Trần Minh Quân', 'Trao đổi cơ hội hợp tác phân phối.', 'in_person', 'draft', 'Asia/Ho_Chi_Minh', 'saved_card', assoc, 'scheduled', date_trunc('day', now()) + interval '9 hours', date_trunc('day', now()) + interval '10 hours', 'Asia/Ho_Chi_Minh')
    RETURNING id INTO mid;
    INSERT INTO public.business_meeting_participants (meeting_id, user_id, role, response_status)
    VALUES (mid, u, 'organizer', 'accepted'), (mid, peer3, 'required', 'accepted');
    UPDATE public.business_meetings SET status = 'confirmed' WHERE id = mid;
    INSERT INTO public.business_meeting_follow_ups (meeting_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at)
    VALUES (mid, u, u, 'Gửi hồ sơ năng lực Uranus Tech', 'Kèm bảng giá 2026.', 'open', 'high', now() + interval '1 day');

    INSERT INTO public.business_meetings (created_by_user_id, organizer_user_id, title, description, meeting_type, status, timezone, source_type, association_id, scheduling_mode, scheduled_start_at, scheduled_end_at, scheduled_timezone)
    VALUES (u, u, 'Họp trực tuyến với An Phát Group', 'Rà soát điều khoản hợp tác.', 'video_call', 'draft', 'Asia/Ho_Chi_Minh', 'association', assoc, 'scheduled', date_trunc('day', now()) + interval '1 day 14 hours', date_trunc('day', now()) + interval '1 day 15 hours', 'Asia/Ho_Chi_Minh')
    RETURNING id INTO mid;
    INSERT INTO public.business_meeting_participants (meeting_id, user_id, role, response_status)
    VALUES (mid, u, 'organizer', 'accepted'), (mid, peer4, 'required', 'pending');
    UPDATE public.business_meetings SET status = 'confirmed' WHERE id = mid;
    INSERT INTO public.business_meeting_follow_ups (meeting_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at)
    VALUES (mid, u, u, 'Chốt lịch ký biên bản ghi nhớ', NULL, 'open', 'normal', now() - interval '1 day');

    INSERT INTO public.business_meetings (created_by_user_id, organizer_user_id, title, description, meeting_type, status, timezone, source_type, association_id, scheduling_mode, scheduled_start_at, scheduled_end_at, scheduled_timezone)
    VALUES (u, u, 'Networking sáng thứ Sáu - CLB Doanh nhân', NULL, 'networking', 'draft', 'Asia/Ho_Chi_Minh', 'event', assoc, 'scheduled', now() + interval '4 days', now() + interval '4 days 2 hours', 'Asia/Ho_Chi_Minh')
    RETURNING id INTO mid;
    INSERT INTO public.business_meeting_participants (meeting_id, user_id, role, response_status)
    VALUES (mid, u, 'organizer', 'accepted');
    UPDATE public.business_meetings SET status = 'confirmed' WHERE id = mid;
    INSERT INTO public.business_meeting_follow_ups (meeting_id, created_by_user_id, owner_user_id, title, description, status, priority, due_at)
    VALUES (mid, u, u, 'Chuẩn bị 30 danh thiếp NFC', NULL, 'open', 'normal', now() + interval '3 days');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.business_notifications WHERE recipient_user_id = u) THEN
    INSERT INTO public.business_notifications (recipient_user_id, source_domain, source_record_id, event_kind, notification_kind, title_key, body_key, action_label_key, priority, status, delivered_at, dedupe_key, safe_display_data)
    VALUES
      (u,'connection', gen_random_uuid()::text, 'connection_request_received','connection_request_received','bc.notif.kind.connection_request_received.title','bc.notif.kind.connection_request_received.body','bc.notif.kind.connection_request_received.action','high','delivered', now() - interval '8 hours','demo-conn-1','{"counterpartDisplayName":"Hieu PU"}'::jsonb),
      (u,'connection', gen_random_uuid()::text, 'connection_request_received','connection_request_received','bc.notif.kind.connection_request_received.title','bc.notif.kind.connection_request_received.body','bc.notif.kind.connection_request_received.action','high','delivered', now() - interval '2 days','demo-conn-2','{"counterpartDisplayName":"Nguyễn Văn Nam"}'::jsonb),
      (u,'connection', gen_random_uuid()::text, 'connection_request_accepted','connection_request_accepted','bc.notif.kind.connection_request_accepted.title','bc.notif.kind.connection_request_accepted.body','bc.notif.kind.connection_request_accepted.action','normal','delivered', now() - interval '3 days','demo-conn-3','{"counterpartDisplayName":"Nam NV"}'::jsonb);
  END IF;

  INSERT INTO public.events (id, name, date, location, capacity, registered, status, type, association_id)
  SELECT * FROM (VALUES
    ('vione-ev-1','Diễn đàn Kết nối Doanh nghiệp ViOne 2026', current_date + 7, 'GEM Center, TP.HCM', 300, 148, 'upcoming', 'Hội nghị', assoc),
    ('vione-ev-2','Cà phê Doanh nhân sáng thứ Sáu', current_date + 3, 'Landmark 81, TP.HCM', 60, 41, 'upcoming', 'Networking', assoc),
    ('vione-ev-3','Hội thảo Chuyển đổi số cho SME', current_date + 18, 'Khách sạn Rex, TP.HCM', 150, 62, 'upcoming', 'Hội thảo', assoc),
    ('vione-ev-4','Gala Thường niên Hiệp hội', current_date + 45, 'Riverside Palace', 500, 210, 'upcoming', 'Sự kiện', assoc)
  ) v(id,name,date,location,capacity,registered,status,type,association_id)
  WHERE NOT EXISTS (SELECT 1 FROM public.events e WHERE e.id = v.id);

  INSERT INTO public.opportunities (id, poster_id, title, description, type, budget_min, budget_max, region, industry, deadline, status, views, emoji, association_id)
  SELECT * FROM (VALUES
    ('vione-op-1','VIONE-JAMES','Tìm nhà phân phối thiết bị công nghệ khu vực miền Bắc','Cần đối tác có kênh phân phối B2B, ưu tiên đã làm ngành CNTT.','partnership', 500000000::bigint, 2000000000::bigint, 'region.north','ind.it', now() + interval '25 days','open', 132, '🤝', assoc),
    ('vione-op-2','VIONE-JAMES','Hợp tác triển khai giải pháp ERP cho doanh nghiệp sản xuất','Tìm đơn vị tư vấn triển khai đồng hành 12 tháng.','service', 300000000::bigint, 900000000::bigint, 'region.south','ind.manufacturing', now() + interval '40 days','open', 88, '⚙️', assoc),
    ('vione-op-3','VIONE-JAMES','Kêu gọi đầu tư vòng hạt giống - nền tảng kết nối doanh nghiệp','Định giá thương lượng, ưu tiên nhà đầu tư chiến lược.','investment', 5000000000::bigint, 15000000000::bigint, 'region.south','ind.finance', now() + interval '60 days','open', 254, '🚀', assoc),
    ('vione-op-4','VIONE-JAMES','Thuê văn phòng hạng A khu trung tâm Quận 1','Diện tích 300-500m2, nhận bàn giao trong quý tới.','sourcing', 200000000::bigint, 400000000::bigint, 'region.south','ind.realestate', now() + interval '15 days','open', 46, '🏢', assoc)
  ) v(id,poster_id,title,description,type,budget_min,budget_max,region,industry,deadline,status,views,emoji,association_id)
  WHERE NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = v.id);
END $$;
