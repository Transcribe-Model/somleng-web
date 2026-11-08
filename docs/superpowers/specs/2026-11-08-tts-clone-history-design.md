# TTS + Voice Clone History Storage

## Decision

Persist TTS and voice-clone outputs the **same way transcription already works**:

1. Upload generated audio to Somleng AI `/v1/files` (YOURMOM)
2. Insert a completed row into Supabase `transcription_jobs`
3. Show it in dashboard History (audio playback + text)

Do **not** introduce a separate Supabase Storage bucket — that would fork persistence patterns.

## Schema

Add column:

```sql
alter table public.transcription_jobs
  add column if not exists job_type text not null default 'transcribe';

create index if not exists transcription_jobs_job_type_idx
  on public.transcription_jobs (job_type);
```

`job_type`: `transcribe` | `tts` | `clone`

Reuse existing columns:

- `text` — input script (TTS/clone) or transcript (transcribe)
- `audio_path` — Somleng file id for playback/delete
- `original_filename` — e.g. `speech.wav`, `cloned-speech.wav`
- `language`, `engine` (`mms` / `voxcpm2`), `status: completed`

## API

After successful synthesis in `/api/tts` and `/api/voice-clone`:

1. `somlengAiUploadFile(blob, filename)`
2. Insert completed job via service role
3. Still return raw audio bytes to the client (unchanged UX)
4. Set response header `X-Job-Id` for optional clients

Persistence failures should be logged but **must not fail** the user-facing synthesis response once audio is already generated.

## History UI

- List includes `job_type` with a short label (Transcribe / TTS / Clone)
- Detail: always show audio when present; for TTS/clone show the script text (reuse transcript panel as “text”)
