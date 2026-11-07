# MMS Default TTS Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Route default `/v1/audio/speech` through Meta MMS Khmer VITS; keep VoxCPM2 for clone only.

**Architecture:** Add MMS load/unload helpers beside Whisper/VoxCPM GPU mutex; change `_synthesize_preset` to use MMS; update health + README + requirements.

**Tech Stack:** FastAPI, transformers `VitsModel`, torch, existing VoxCPM/Whisper stack

---

### Task 1: Dependencies + docs

- [x] Add `transformers` to `voice-clone-server/requirements.txt`
- [x] Update README env/engine notes + CC-BY-NC license note

### Task 2: GPU mutex + MMS helpers in `app.py`

- [x] Add `MMS_TTS_MODEL` config
- [x] Extend `ActiveModel` with `mms`
- [x] Implement `_unload_mms` / `_ensure_mms`
- [x] Ensure VoxCPM load unloads MMS; Whisper load unloads VoxCPM only

### Task 3: Wire preset speech + health

- [x] `_synthesize_preset` → MMS
- [x] Health: `tts_engine`, `clone_engine`, `mms_tts_model`
- [x] Optional `MMS_WARMUP=1`

### Task 4: Deploy note

- [x] Remind: restart uvicorn on YOURMOM and `pip install transformers`
---