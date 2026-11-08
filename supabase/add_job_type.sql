-- Run in Supabase SQL Editor (project lhndcraheattkdrhxqjg)
-- Adds job_type so TTS / voice-clone rows can share transcription_jobs + History.

alter table public.transcription_jobs
  add column if not exists job_type text not null default 'transcribe';

create index if not exists transcription_jobs_job_type_idx
  on public.transcription_jobs (job_type);

comment on column public.transcription_jobs.job_type is
  'transcribe | tts | clone';
