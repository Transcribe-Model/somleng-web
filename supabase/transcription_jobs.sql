-- Run in Supabase SQL Editor for project lhndcraheattkdrhxqjg
create extension if not exists "pgcrypto";

create table if not exists public.transcription_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued',
  job_type text not null default 'transcribe',
  language text,
  model text,
  engine text,
  original_filename text,
  audio_path text,
  text text,
  segments jsonb not null default '[]'::jsonb,
  duration_seconds double precision,
  enable_diarization boolean not null default false,
  error_message text,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transcription_jobs_created_at_idx
  on public.transcription_jobs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transcription_jobs_set_updated_at on public.transcription_jobs;
create trigger transcription_jobs_set_updated_at
  before update on public.transcription_jobs
  for each row
  execute function public.set_updated_at();

alter table public.transcription_jobs enable row level security;

-- Service role bypasses RLS; no public policies needed for server-only access.
