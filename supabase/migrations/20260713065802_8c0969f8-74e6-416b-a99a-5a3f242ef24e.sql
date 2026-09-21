-- BC-2.1A — Business Card Ownership Foundation (additive only, NO cutover).
-- Adds nullable owner_user_id + indexes. Legacy member_id / association_id
-- and all existing RLS policies remain authoritative and unchanged.

-- 1. Additive column (nullable, no NOT NULL, no unique constraint).
--    FK per project convention (members.user_id -> auth.users). Use SET NULL
--    (never CASCADE): a deleted user must not delete a card association
--    moderation may still need.
ALTER TABLE public.member_business_cards
  ADD COLUMN IF NOT EXISTS owner_user_id uuid NULL
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Indexes (owner lookup paths + published public slug path).
CREATE INDEX IF NOT EXISTS mbc_owner_idx
  ON public.member_business_cards (owner_user_id);
CREATE INDEX IF NOT EXISTS mbc_owner_status_idx
  ON public.member_business_cards (owner_user_id, status);
CREATE INDEX IF NOT EXISTS mbc_owner_assoc_idx
  ON public.member_business_cards (owner_user_id, association_id);
CREATE INDEX IF NOT EXISTS mbc_pub_slug_status_idx
  ON public.member_business_cards (slug, status)
  WHERE status = 'published' AND public_mode = 'public';

-- 3. GRANT review: existing grants on member_business_cards already cover the
--    new column (column-level privileges inherit from table grants). No change.
-- 4. RLS review: policies are unchanged; legacy policies remain authoritative.
--    owner_user_id is NOT referenced by any policy in this phase.

-- Rollback (documented, run manually if reverting BC-2.1A):
--   DROP INDEX IF EXISTS public.mbc_pub_slug_status_idx;
--   DROP INDEX IF EXISTS public.mbc_owner_assoc_idx;
--   DROP INDEX IF EXISTS public.mbc_owner_status_idx;
--   DROP INDEX IF EXISTS public.mbc_owner_idx;
--   ALTER TABLE public.member_business_cards DROP COLUMN IF EXISTS owner_user_id;
