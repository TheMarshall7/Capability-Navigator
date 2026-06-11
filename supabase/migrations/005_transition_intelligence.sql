-- ============================================================
-- Migration 005 — Transition Intelligence Layer
-- Public transition views, outcome opt-in, readiness snapshots
-- ============================================================

-- ─── Outcomes: public sharing opt-in ─────────────────────────────────────────

ALTER TABLE public.outcomes
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS headline text;


-- ─── Public transitions view (anonymised — security boundary) ────────────────
-- Exposes ONLY anonymised fields for completed, opted-in transitions.
-- Never exposes user_id, id, email, name, what_didnt, or salary_change_pct.

CREATE OR REPLACE VIEW public.public_transitions AS
SELECT
  original_role,
  new_role,
  time_taken_months,
  salary_change,
  what_worked,
  headline,
  created_at
FROM public.outcomes
WHERE is_public = true
  AND made_the_move = 'yes';


-- ─── Transition stats view (aggregated role pairs) ───────────────────────────

CREATE OR REPLACE VIEW public.transition_stats AS
SELECT
  original_role,
  new_role,
  count(*) AS transition_count,
  avg(time_taken_months) AS avg_months,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY time_taken_months) AS median_months
FROM public.outcomes
WHERE is_public = true
  AND made_the_move = 'yes'
GROUP BY original_role, new_role;


-- ─── Readiness snapshots (score history for dashboard widget) ────────────────

CREATE TABLE IF NOT EXISTS public.readiness_snapshots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score           integer NOT NULL,
  components_json jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.readiness_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own readiness snapshots" ON public.readiness_snapshots
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX readiness_snapshots_user_time_idx
  ON public.readiness_snapshots(user_id, created_at DESC);


-- ─── Anon read access (landing page + public /transitions) ───────────────────
-- Views are the only public surface — outcomes table stays RLS-protected.

GRANT SELECT ON public.public_transitions TO anon;
GRANT SELECT ON public.transition_stats TO anon;
