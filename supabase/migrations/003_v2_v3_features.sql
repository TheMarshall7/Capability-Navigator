-- ============================================================
-- Migration 003 — V2/V3 Features
-- Milestone tracking, outcome recording, AI coach history
-- ============================================================

-- ─── Milestones ──────────────────────────────────────────────────────────────
-- Auto-generated from roadmap JSON on first view, then toggled by user.
-- Each pathway gets its own milestone set.

CREATE TABLE IF NOT EXISTS public.milestones (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pathway_id   uuid NOT NULL REFERENCES public.career_pathways(id) ON DELETE CASCADE,
  label        text NOT NULL,
  phase        text NOT NULL CHECK (phase IN ('immediate', '3-month', '6-month', '12-month')),
  sort_order   integer NOT NULL DEFAULT 0,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own milestones" ON public.milestones
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX milestones_user_pathway_idx ON public.milestones(user_id, pathway_id);
CREATE INDEX milestones_completed_idx ON public.milestones(user_id, completed);


-- ─── Outcomes ────────────────────────────────────────────────────────────────
-- The seed of the V3 transition database.
-- Even sparse data from early users becomes valuable at scale.

CREATE TABLE IF NOT EXISTS public.outcomes (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pathway_title       text,                         -- what they were aiming for
  made_the_move       text CHECK (made_the_move IN ('yes', 'in_progress', 'not_yet')),
  original_role       text,                         -- where they started
  new_role            text,                         -- where they ended up
  time_taken_months   integer,
  salary_change       text CHECK (salary_change IN ('increased', 'same', 'decreased', 'unknown')),
  salary_change_pct   integer,                      -- approximate % change
  what_worked         text,
  what_didnt          text,
  would_recommend     boolean,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id)    -- one outcome record per user, upserted over time
);

ALTER TABLE public.outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own outcomes" ON public.outcomes
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ─── Coach messages ───────────────────────────────────────────────────────────
-- Persist conversation history so the coach has context across sessions.
-- Limit enforced at API level (last 20 messages sent to model).

CREATE TABLE IF NOT EXISTS public.coach_messages (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own coach messages" ON public.coach_messages
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX coach_messages_user_time_idx ON public.coach_messages(user_id, created_at DESC);


-- ─── Verify ──────────────────────────────────────────────────────────────────
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--   AND tablename IN ('milestones', 'outcomes', 'coach_messages');
