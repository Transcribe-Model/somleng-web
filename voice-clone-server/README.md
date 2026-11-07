# Somleng AI (self-hosted STT + TTS + clone)

Runs on `YOURMOM` over Tailscale. GPU mutex coordinates Qwen-ASR / Whisper (STT), MMS (default TTS), and VoxCPM2 (voice clone) on the RTX 2050 4GB.

| Feature | Engine | Default model |
|---------|--------|---------------|
| STT | Qwen3-ASR Khmer (default) | `seanghay/Qwen3-ASR-0.6B-Khmer` |
| STT fallback | faster-whisper | `PhanithLIM/whisper-small-khmer-ct2` |
| Default TTS | Meta MMS VITS | `facebook/mms-tts-khm` |
| Voice clone | VoxCPM2 | `openbmb/VoxCPM2` |

**Licenses:** Qwen3-ASR Khmer is **Apache-2.0**. MMS default TTS is **CC-BY-NC-4.0** (swap before commercial launch).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | status, `stt_engine`, `tts_engine`, `clone_engine` |
| POST | `/v1/files` | upload audio |
| GET/DELETE | `/v1/files/{id}` | fetch / delete |
| POST | `/v1/audio/transcribe/jobs` | start STT job |
| GET | `/v1/audio/transcribe/jobs/{id}` | poll STT |
| POST | `/v1/audio/speech` | preset TTS (MMS) |
| POST | `/v1/audio/clone` | voice clone (VoxCPM2) |

## Run (Windows)

```powershell
cd C:\Users\bunkh\project\voice-clone-server
.\.venv\Scripts\activate
pip install -r requirements.txt
# CUDA torch must stay installed after pip installs
python -m uvicorn app:app --host 127.0.0.1 --port 8090
```

Scheduled task: `SomlengVoiceClone`  
Tailscale Serve (tailnet): `https://yourmom.tail02a453.ts.net:8443` → `127.0.0.1:8090`

## Env

```
STT_ENGINE=qwen
QWEN_ASR_MODEL=seanghay/Qwen3-ASR-0.6B-Khmer
QWEN_ASR_MAX_NEW_TOKENS=1024
QWEN_ASR_WARMUP=0
MMS_TTS_MODEL=facebook/mms-tts-khm
MMS_TTS_MODEL_EN=facebook/mms-tts-eng
MMS_WARMUP=0
VOXCPM_MODEL=openbmb/VoxCPM2
WHISPER_MODEL=PhanithLIM/whisper-small-khmer-ct2
WHISPER_COMPUTE_TYPE=int8_float16
SOMLENG_AI_API_KEY=   # optional
```

Set `STT_ENGINE=whisper` to force the legacy Whisper path.

## Next.js

```
SOMLENG_AI_BASE_URL=https://yourmom.tail02a453.ts.net:8443
```
