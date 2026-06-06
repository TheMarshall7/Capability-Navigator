-- ============================================================
-- Migration 002 — Bug fixes
-- Run this after 001_initial_schema.sql
-- ============================================================

-- ─── 1. Missing unique constraints for upsert operations ─────────────────────

-- One active CV per user (upsert replaces on re-upload)
ALTER TABLE public.cv_uploads
  DROP CONSTRAINT IF EXISTS cv_uploads_user_id_unique,
  ADD CONSTRAINT cv_uploads_user_id_unique UNIQUE (user_id);

-- One feedback submission per user
ALTER TABLE public.feedback
  DROP CONSTRAINT IF EXISTS feedback_user_id_unique,
  ADD CONSTRAINT feedback_user_id_unique UNIQUE (user_id);

-- One primary share link per user
ALTER TABLE public.share_links
  DROP CONSTRAINT IF EXISTS share_links_user_id_unique,
  ADD CONSTRAINT share_links_user_id_unique UNIQUE (user_id);


-- ─── 2. RLS: allow users to insert their own row ──────────────────────────────
-- Without this, the users table INSERT fails under RLS even for the
-- authenticated user themselves.

DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ─── 3. Auto-create user row on sign-up ──────────────────────────────────────
-- Supabase best practice: use a trigger on auth.users rather than inserting
-- from the client. This fires server-side so it works with email confirmation,
-- OAuth, and any other auth method — no client-side upsert needed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name  = CASE
                  WHEN EXCLUDED.name != '' THEN EXCLUDED.name
                  ELSE public.users.name
                END;
  RETURN NEW;
END;
$$;

-- Drop and recreate so it's idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─── 4. Verify everything looks right ────────────────────────────────────────
-- Run these SELECTs manually to confirm after applying the migration:
--
-- SELECT conname, contype FROM pg_constraint
--   WHERE conrelid IN ('cv_uploads'::regclass, 'feedback'::regclass, 'share_links'::regclass)
--   AND contype = 'u';
--
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- ─── 5. Public read policies for /p/[token] share page ───────────────────────
-- Without these, unauthenticated visitors hit a blank 404.

DROP POLICY IF EXISTS "Public can read shareable links by token" ON public.share_links;
CREATE POLICY "Public can read shareable links by token" ON public.share_links
  FOR SELECT USING (visibility IN ('shareable', 'mentor'));

DROP POLICY IF EXISTS "Public can read shared reports" ON public.capability_reports;
CREATE POLICY "Public can read shared reports" ON public.capability_reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.share_links sl
      WHERE sl.report_id = id AND sl.visibility IN ('shareable', 'mentor')
    )
  );

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Public can read name via share link" ON public.users;
CREATE POLICY "Public can read name via share link" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.share_links sl
      WHERE sl.user_id = id AND sl.visibility IN ('shareable', 'mentor')
    )
  );
