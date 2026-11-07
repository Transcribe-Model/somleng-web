# Split TTS and Voice Clone Design

**Status:** Approved (Approach A)  
**Date:** 2026-11-07

## Goal

Separate default text-to-speech and voice clone into two dashboard features with clearer UX.

## Routes

| Path | Feature |
|------|---------|
| `/dashboard/tts` | Default voice TTS only |
| `/dashboard/clone` | Voice clone only |

## UX

- **TTS:** two-column desktop (compose | result); no mode toggle
- **Clone:** stepped flow — reference → consent → text → generate → result
- Sidebar + overview + footer links for both

## Out of scope

- Backend API changes
- New models
