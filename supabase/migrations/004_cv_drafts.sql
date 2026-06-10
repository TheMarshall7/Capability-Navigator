-- ─── CV drafts (one tailored CV per pathway per user) ───────────────────────

CREATE TABLE IF NOT EXISTS public.cv_drafts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pathway_id   uuid NOT NULL REFERENCES public.career_pathways(id) ON DELETE CASCADE,
  content_json jsonb NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, pathway_id)
);

ALTER TABLE public.cv_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cv drafts" ON public.cv_drafts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX cv_drafts_user_pathway_idx ON public.cv_drafts(user_id, pathway_id);
