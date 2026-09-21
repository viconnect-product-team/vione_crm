ALTER TABLE public.guest_contacts
  ADD COLUMN IF NOT EXISTS owner_label text,
  ADD COLUMN IF NOT EXISTS owner_note text;

-- Chủ sở hữu chỉ được sửa hai cột riêng tư này (giới hạn ở cấp quyền cột),
-- dữ liệu gốc do khách chia sẻ vẫn bất biến từ phía client.
GRANT UPDATE (owner_label, owner_note) ON public.guest_contacts TO authenticated;

DROP POLICY IF EXISTS "Owners update their guest contact notes" ON public.guest_contacts;
CREATE POLICY "Owners update their guest contact notes"
  ON public.guest_contacts
  FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());