# Saved Voices (reuse clone reference)

## Goal

Let users save a short reference recording and reuse it for later voice clones without re-recording.

## Storage

- Audio: Somleng AI `/v1/files` (same as History)
- Metadata: Supabase `saved_voices` (private per `user_id`)

```sql
create table public.saved_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  audio_path text not null,
  original_filename text,
  created_at timestamptz not null default now()
);
```

## API

- `GET /api/voices` — list current user's voices
- `POST /api/voices` — multipart `name` + `reference_audio`
- `DELETE /api/voices/[id]` — delete row + Somleng file
- `GET /api/voices/[id]/audio` — preview stream
- `POST /api/voice-clone` — accept `saved_voice_id` **or** `reference_audio`

## UI (`/dashboard/clone`)

Step 1: pick a saved voice **or** record/upload a new one; optional “Save voice” with name.
