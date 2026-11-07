# MMS Default TTS + VoxCPM Clone Design

**Status:** Approved (Option C)  
**Date:** 2026-11-07

## Goal

Make default Khmer TTS stable on YOURMOM’s 4GB RTX 2050 by using Meta MMS VITS for `/v1/audio/speech`, while keeping VoxCPM2 only for voice clone.

## Decision

| Path | Engine | Model (default) |
|------|--------|-----------------|
| Default TTS `POST /v1/audio/speech` | MMS VITS | `facebook/mms-tts-khm` |
| Voice clone `POST /v1/audio/clone` (+ v2 jobs) | VoxCPM2 | `openbmb/VoxCPM2` |
| STT | faster-whisper | `PhanithLIM/whisper-small-khmer-ct2` |

## GPU policy

Active model enum: `none | whisper | mms | voxcpm2`

- Whisper ↔ VoxCPM remain exclusive.
- Loading VoxCPM unloads Whisper **and** MMS (free VRAM for ~2B model).
- Loading Whisper unloads VoxCPM; MMS may stay warm (small).
- Loading MMS unloads VoxCPM only.

## Config

- `MMS_TTS_MODEL` (default `facebook/mms-tts-khm`)
- Existing `VOXCPM_*` / `WHISPER_*` unchanged
- Optional `MMS_WARMUP=1` on startup

## API surface

- Next.js clients unchanged (`/api/tts` → `/v1/audio/speech`)
- `/health` adds `tts_engine`, `clone_engine`, and reports `active_model`

## License note

`facebook/mms-tts-khm` is **CC-BY-NC-4.0**. Acceptable for current non-commercial / demo use. Before commercial launch, swap default TTS to an Apache/MIT Khmer voice (or route paid traffic through VoxCPM only).

## Out of scope

- UI changes
- STT changes
- Commercial-license model hunt
