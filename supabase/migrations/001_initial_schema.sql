-- ============================================================
-- Capability Navigator — Database Schema
-- Supabase / PostgreSQL
-- Run: supabase db push (or paste directly in Supabase SQL editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── users ───────────────────────────────────────────────────────────────────
-- Managed by Supabase Auth. This table extends auth.users.
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  created_at  timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can insert own data" on public.users for insert with check (auth.uid() = id);
create policy "Users can update own data" on public.users for update using (auth.uid() = id);
-- Read policy defined alongside share_links below (allows public read of name via share link)

-- ─── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.users(id) on delete cascade,
  "current_role"     text,
  experience_range   text,
  situation          text,
  city               text,
  country            text,
  work_arrangements  text[] default '{}',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can manage own profile" on public.profiles
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index profiles_user_id_idx on public.profiles(user_id);

-- ─── cv_uploads ───────────────────────────────────────────────────────────────
create table if not exists public.cv_uploads (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  file_url        text,
  file_name       text not null,
  extracted_text  text,
  created_at      timestamptz default now(),
  unique (user_id)  -- one active CV per user; upserted on re-upload
);

alter table public.cv_uploads enable row level security;
create policy "Users can manage own CVs" on public.cv_uploads
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index cv_uploads_user_id_idx on public.cv_uploads(user_id);

-- ─── questionnaire_answers ────────────────────────────────────────────────────
-- Stored as key-value pairs. Flexible — supports adding questions without schema changes.
create table if not exists public.questionnaire_answers (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  question_key   text not null,
  answer_value   jsonb not null,  -- jsonb supports text, arrays, numbers
  created_at     timestamptz default now(),
  unique(user_id, question_key)   -- one answer per question per user
);

alter table public.questionnaire_answers enable row level security;
create policy "Users can manage own answers" on public.questionnaire_answers
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index questionnaire_answers_user_id_idx on public.questionnaire_answers(user_id);

-- ─── capability_reports ───────────────────────────────────────────────────────
create table if not exists public.capability_reports (
  id                           uuid primary key default uuid_generate_v4(),
  user_id                      uuid not null references public.users(id) on delete cascade,
  summary                      text not null,
  core_capabilities_json       jsonb not null default '[]',
  hidden_strengths_json        jsonb not null default '[]',
  work_style_summary           text,
  cv_underrepresentation_summary text,
  created_at                   timestamptz default now()
);

alter table public.capability_reports enable row level security;
create policy "Users can manage own reports" on public.capability_reports
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own reports" on public.capability_reports
  for delete using (auth.uid() = user_id);
-- Read policy is defined alongside share_links below (allows public read via share link)

create index capability_reports_user_id_idx on public.capability_reports(user_id);

-- ─── career_pathways ─────────────────────────────────────────────────────────
create table if not exists public.career_pathways (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  report_id                uuid references public.capability_reports(id) on delete cascade,
  title                    text not null,
  match_reason             text,
  capability_overlap       integer check (capability_overlap between 0 and 100),
  missing_skills_json      jsonb default '[]',
  difficulty               text check (difficulty in ('Low', 'Medium', 'High')),
  estimated_transition_time text,
  first_step               text,
  roadmap_json             jsonb default '{}',
  created_at               timestamptz default now()
);

alter table public.career_pathways enable row level security;
create policy "Users can manage own pathways" on public.career_pathways
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index career_pathways_user_id_idx on public.career_pathways(user_id);
create index career_pathways_report_id_idx on public.career_pathways(report_id);

-- ─── feedback ─────────────────────────────────────────────────────────────────
create table if not exists public.feedback (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  accuracy_score           integer check (accuracy_score between 1 and 5),
  revealed_new_possibilities text check (revealed_new_possibilities in ('Yes', 'No', 'Somewhat')),
  would_share              text check (would_share in ('Yes', 'No', 'Maybe')),
  most_accurate            text,
  wrong_or_missing         text,
  created_at               timestamptz default now(),
  unique (user_id)  -- one submission per user; upserted on resubmit
);

alter table public.feedback enable row level security;
create policy "Users can manage own feedback" on public.feedback
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── share_links ──────────────────────────────────────────────────────────────
create table if not exists public.share_links (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  report_id   uuid references public.capability_reports(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  visibility  text not null default 'private' check (visibility in ('private', 'shareable', 'mentor')),
  created_at  timestamptz default now(),
  unique (user_id)  -- one primary share link per user; updated in place
);

alter table public.share_links enable row level security;
-- Users can manage their own share links
create policy "Users can manage own share links" on public.share_links
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public can read non-private links by token (for /p/[token] route)
create policy "Public can read shareable links by token" on public.share_links
  for select using (visibility in ('shareable', 'mentor'));

-- Allow public read of capability_reports when accessed via a valid share link
create policy "Public can read shared reports" on public.capability_reports
  for select using (
    auth.uid() = user_id  -- owner always has access
    or exists (           -- non-owner can read if a public share link points to this report
      select 1 from public.share_links sl
      where sl.report_id = id
      and sl.visibility in ('shareable', 'mentor')
    )
  );

-- Allow public read of user name via share link (name only — no email)
create policy "Public can read name via share link" on public.users
  for select using (
    auth.uid() = id  -- owner
    or exists (      -- someone with a valid share link can read the owner's name
      select 1 from public.share_links sl
      where sl.user_id = id
      and sl.visibility in ('shareable', 'mentor')
    )
  );

create index share_links_token_idx on public.share_links(token);
create index share_links_user_id_idx on public.share_links(user_id);

-- ─── mentor_feedback ─────────────────────────────────────────────────────────
-- No auth required for reviewers in V1
create table if not exists public.mentor_feedback (
  id                        uuid primary key default uuid_generate_v4(),
  share_link_id             uuid not null references public.share_links(id) on delete cascade,
  agreement_level           text check (agreement_level in ('Strongly agree', 'Mostly agree', 'Unsure', 'Disagree')),
  perceived_strengths       text,
  suggested_career_direction text,
  created_at                timestamptz default now()
);

-- Mentor feedback is public insert (no account required)
alter table public.mentor_feedback enable row level security;
create policy "Anyone can submit mentor feedback" on public.mentor_feedback
  for insert with check (true);
create policy "Share link owners can read mentor feedback" on public.mentor_feedback
  for select using (
    exists (
      select 1 from public.share_links sl
      where sl.id = share_link_id and sl.user_id = auth.uid()
    )
  );

-- ─── Auto-create users row on sign-up ────────────────────────────────────────
-- Fires on every new auth.users row (email, OAuth, magic link, etc.)
-- Keeps public.users in sync without relying on client-side inserts.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name  = case when excluded.name != '' then excluded.name else public.users.name end;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Helper function: updated_at trigger ─────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─── Storage bucket for CV uploads ───────────────────────────────────────────
-- Run in Supabase Dashboard → Storage, or via CLI:
-- supabase storage create cv-uploads --public false
insert into storage.buckets (id, name, public) values ('cv-uploads', 'cv-uploads', false)
on conflict do nothing;

create policy "Users can upload their own CV" on storage.objects
  for insert with check (bucket_id = 'cv-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read their own CV" on storage.objects
  for select using (bucket_id = 'cv-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own CV" on storage.objects
  for delete using (bucket_id = 'cv-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
