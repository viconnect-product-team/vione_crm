
-- ============================================================
-- BC-1.0 — Platform Identity Foundation
-- Additive, backward-compatible, rollback-safe.
-- ============================================================

-- 1. Enum for onboarding + account status (guarded creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='onboarding_status') THEN
    CREATE TYPE public.onboarding_status AS ENUM ('new','in_progress','completed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('active','suspended','deactivated');
  END IF;
END$$;

-- 2. user_profiles (Global Platform Profile) — NO association/member/fee data
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  professional_title text,
  company_name text,
  industry text,
  region text,
  bio text,
  locale text NOT NULL DEFAULT 'vi',
  timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  onboarding_status public.onboarding_status NOT NULL DEFAULT 'new',
  account_status public.account_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. GRANTs (owner-only, auth.uid() scoped → no anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 4. RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own platform profile" ON public.user_profiles;
CREATE POLICY "Users read own platform profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Users insert own platform profile" ON public.user_profiles;
CREATE POLICY "Users insert own platform profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own platform profile" ON public.user_profiles;
CREATE POLICY "Users update own platform profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own platform profile" ON public.user_profiles;
CREATE POLICY "Users delete own platform profile"
  ON public.user_profiles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status ON public.user_profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_industry ON public.user_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_user_profiles_region ON public.user_profiles(region);

-- 6. updated_at trigger (reuses shared function)
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. Backfill report table (audit of the one-time backfill)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.identity_backfill_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_label text NOT NULL,
  profiles_created integer NOT NULL DEFAULT 0,
  profiles_skipped integer NOT NULL DEFAULT 0,
  duplicate_mapping integer NOT NULL DEFAULT 0,
  missing_user integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.identity_backfill_reports TO authenticated;
GRANT ALL ON public.identity_backfill_reports TO service_role;

ALTER TABLE public.identity_backfill_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins read backfill reports" ON public.identity_backfill_reports;
CREATE POLICY "Platform admins read backfill reports"
  ON public.identity_backfill_reports FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- ============================================================
-- 8. BACKFILL — only where members.user_id maps to exactly one user,
--    and no user_profile already exists. Never overwrite, never guess.
-- ============================================================
DO $backfill$
DECLARE
  _created int := 0;
  _skipped int := 0;
  _dupes   int := 0;
  _missing int := 0;
BEGIN
  -- duplicate_mapping: user_ids linked to multiple member rows (ambiguous source)
  SELECT count(*) INTO _dupes FROM (
    SELECT user_id FROM public.members
    WHERE user_id IS NOT NULL
    GROUP BY user_id HAVING count(*) > 1
  ) d;

  -- missing_user: member rows with NULL user_id (cannot backfill identity)
  SELECT count(*) INTO _missing FROM public.members WHERE user_id IS NULL;

  -- profiles_skipped: eligible unique-mapped users that already have a profile
  SELECT count(*) INTO _skipped
  FROM (
    SELECT m.user_id
    FROM public.members m
    WHERE m.user_id IS NOT NULL
    GROUP BY m.user_id HAVING count(*) = 1
  ) u
  WHERE EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = u.user_id);

  -- Insert only unique-mapped users that lack a profile.
  WITH unique_members AS (
    SELECT m.user_id, min(m.name) AS name
    FROM public.members m
    WHERE m.user_id IS NOT NULL
    GROUP BY m.user_id
    HAVING count(*) = 1
  ), ins AS (
    INSERT INTO public.user_profiles (user_id, display_name, onboarding_status)
    SELECT um.user_id, um.name, 'completed'::public.onboarding_status
    FROM unique_members um
    WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.user_id = um.user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO _created FROM ins;

  INSERT INTO public.identity_backfill_reports
    (run_label, profiles_created, profiles_skipped, duplicate_mapping, missing_user, details)
  VALUES ('BC-1.0-initial', _created, _skipped, _dupes, _missing,
    jsonb_build_object('note','Backfill only for unique members.user_id with no existing profile'));
END
$backfill$;
