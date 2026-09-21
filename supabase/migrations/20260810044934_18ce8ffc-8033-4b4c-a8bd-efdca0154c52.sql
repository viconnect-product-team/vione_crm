-- 1) Quản trị viên nền tảng (platform admin) có thể quản lý hồ sơ hội viên
-- (quyền xem đã có sẵn, nay bổ sung quyền thêm/sửa/xóa tương ứng)
DROP POLICY IF EXISTS members_admin_insert ON public.members;
CREATE POLICY members_admin_insert ON public.members FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS members_admin_update ON public.members;
CREATE POLICY members_admin_update ON public.members FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS members_admin_delete ON public.members;
CREATE POLICY members_admin_delete ON public.members FOR DELETE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));

-- 2) Sự kiện: platform admin xem được mọi sự kiện và quản lý được sự kiện
DROP POLICY IF EXISTS events_select_assoc ON public.events;
CREATE POLICY events_select_assoc ON public.events FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR public.is_member_of(association_id));
DROP POLICY IF EXISTS events_admin_insert ON public.events;
CREATE POLICY events_admin_insert ON public.events FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS events_admin_update ON public.events;
CREATE POLICY events_admin_update ON public.events FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS events_admin_delete ON public.events;
CREATE POLICY events_admin_delete ON public.events FOR DELETE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));

-- 3) Tin tức: cùng nguyên tắc như sự kiện
DROP POLICY IF EXISTS news_select_assoc ON public.news;
CREATE POLICY news_select_assoc ON public.news FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR public.is_member_of(association_id));
DROP POLICY IF EXISTS news_admin_insert ON public.news;
CREATE POLICY news_admin_insert ON public.news FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS news_admin_update ON public.news;
CREATE POLICY news_admin_update ON public.news FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'))
  WITH CHECK (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));
DROP POLICY IF EXISTS news_admin_delete ON public.news;
CREATE POLICY news_admin_delete ON public.news FOR DELETE TO authenticated
  USING (public.is_platform_admin() OR public.has_assoc_role(association_id, 'admin'));

-- 4) Loại vé sự kiện: platform admin xem được
DROP POLICY IF EXISTS event_ticket_types_select_assoc ON public.event_ticket_types;
CREATE POLICY event_ticket_types_select_assoc ON public.event_ticket_types FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR public.is_member_of(association_id));

-- 5) Trigger ghi nhật ký đổi trạng thái danh thiếp: không còn lỗi khi thẻ
-- chưa gắn hiệp hội — tự suy ra hiệp hội từ hồ sơ hội viên/chủ thẻ, bỏ qua nếu không xác định được
CREATE OR REPLACE FUNCTION public.log_business_card_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assoc uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_assoc := COALESCE(
      NEW.association_id,
      OLD.association_id,
      (SELECT m.association_id FROM public.members m WHERE m.id = NEW.member_id LIMIT 1),
      (SELECT m.association_id FROM public.members m WHERE m.user_id = NEW.owner_user_id
         ORDER BY m.created_at ASC LIMIT 1)
    );
    IF v_assoc IS NOT NULL THEN
      INSERT INTO public.business_card_audit
        (association_id, card_id, event_type, actor_user_id, metadata)
      VALUES (
        v_assoc, NEW.id, 'status_change', auth.uid(),
        jsonb_build_object('from', OLD.status, 'to', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6) Hàm bảo đảm người dùng có hồ sơ hội viên trong hiệp hội đang hoạt động
-- (dùng khi đăng sản phẩm chợ lần đầu). Chỉ tạo cho chính người gọi,
-- chỉ khi họ là thành viên của hiệp hội đang hoạt động.
CREATE OR REPLACE FUNCTION public.ensure_my_member_profile()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assoc uuid := public.current_association_id();
  v_id text;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;
  IF v_assoc IS NULL OR NOT public.is_member_of(v_assoc) THEN
    RAISE EXCEPTION 'NOT_ASSOCIATION_MEMBER';
  END IF;

  SELECT m.id INTO v_id FROM public.members m
  WHERE m.user_id = auth.uid() AND m.association_id = v_assoc
  LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT COALESCE(NULLIF(p.full_name, ''), NULLIF(p.email, ''), 'Member')
  INTO v_name
  FROM public.profiles p WHERE p.id = auth.uid();

  v_id := 'M-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.members
    (id, code, name, type, level, industry, region, status, joined_at, fee_year, user_id, association_id)
  VALUES
    (v_id,
     'MBR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
     COALESCE(v_name, 'Member'),
     'company', 'memberLevel.small', 'ind.trade', 'region.south',
     'active', CURRENT_DATE, EXTRACT(YEAR FROM CURRENT_DATE)::int,
     auth.uid(), v_assoc);

  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ensure_my_member_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_member_profile() TO authenticated;

-- 7) Tài liệu: lưu đường dẫn tệp trong kho lưu trữ để hỗ trợ tải lên/tải xuống thật
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_path text;

-- 8) Quyền truy cập tệp tài liệu trong kho (bucket 'documents'):
-- quản trị hiệp hội/platform admin tải lên & xóa; thành viên hiệp hội được đọc
DROP POLICY IF EXISTS documents_files_admin_insert ON storage.objects;
CREATE POLICY documents_files_admin_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      public.is_platform_admin()
      OR public.has_assoc_role(((string_to_array(name, '/'))[1])::uuid, 'admin')
    )
  );
DROP POLICY IF EXISTS documents_files_member_read ON storage.objects;
CREATE POLICY documents_files_member_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      public.is_platform_admin()
      OR public.is_member_of(((string_to_array(name, '/'))[1])::uuid)
    )
  );
DROP POLICY IF EXISTS documents_files_admin_delete ON storage.objects;
CREATE POLICY documents_files_admin_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      public.is_platform_admin()
      OR public.has_assoc_role(((string_to_array(name, '/'))[1])::uuid, 'admin')
    )
  );