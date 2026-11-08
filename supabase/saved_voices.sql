-- Run in Supabase SQL Editor / linked CLI for Som Leng Khmer
create extension if not exists "pgcrypto";

create table if not exists public.saved_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  audio_path text not null,
  original_filename text,
  created_at timestamptz not null default now()
);

create index if not exists saved_voices_user_created_idx
  on public.saved_voices (user_id, created_at desc);

alter table public.saved_voices enable row level security;

-- Server uses service role; keep RLS on with no public policies.
