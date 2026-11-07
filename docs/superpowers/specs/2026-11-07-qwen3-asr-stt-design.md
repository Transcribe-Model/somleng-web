# Qwen3-ASR Khmer STT Upgrade

**Status:** Approved  
**Date:** 2026-11-07

## Goal

Replace Whisper-small as the primary Somleng AI STT engine with `seanghay/Qwen3-ASR-0.6B-Khmer` (Apache-2.0), matching / beating KamVox’s Khmer ASR quality while keeping server-side UX.

## Decision

| Path | Engine |
|------|--------|
| Primary STT | `seanghay/Qwen3-ASR-0.6B-Khmer` via `qwen-asr` |
| Fallback | Keep Whisper CT2 behind `STT_ENGINE=whisper` |
| TTS / clone | Unchanged (MMS + VoxCPM2) |

## GPU policy

Active models: `none | whisper | qwen_asr | mms | voxcpm2`

- Loading Qwen ASR unloads Whisper + VoxCPM (and MMS if VRAM tight).
- Loading VoxCPM unloads Qwen ASR.
- Whisper remains available as optional fallback only.

## Config

- `STT_ENGINE=qwen` (default) or `whisper`
- `QWEN_ASR_MODEL=seanghay/Qwen3-ASR-0.6B-Khmer`
- `QWEN_ASR_MAX_NEW_TOKENS=1024` (avoid long-clip truncation)

## Out of scope

- Browser WebGPU / ONNX path (KamVox-style)
- UI redesign
