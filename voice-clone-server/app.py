"""
Somleng AI — self-hosted STT + TTS + voice clone + local storage.

Runs on YOURMOM (Tailscale). GPU mutex keeps Qwen-ASR / Whisper / MMS / VoxCPM2
from fighting over the 4GB RTX 2050.

  - Default TTS  → Meta MMS VITS (facebook/mms-tts-khm) — small & stable
  - Voice clone  → VoxCPM2 — loaded only when cloning
  - STT          → Qwen3-ASR-0.6B-Khmer (default); Whisper CT2 fallback

  python -m uvicorn app:app --host 127.0.0.1 --port 8090
"""

from __future__ import annotations

import gc
import io
import json
import os
import re
import shutil
import tempfile
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Literal

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response

# ── Config ──────────────────────────────────────────────────────────────────

VOXCPM_MODEL = os.environ.get("VOXCPM_MODEL", "openbmb/VoxCPM2")
MMS_TTS_MODEL = os.environ.get("MMS_TTS_MODEL", "facebook/mms-tts-khm")
MMS_TTS_MODEL_EN = os.environ.get("MMS_TTS_MODEL_EN", "facebook/mms-tts-eng")
STT_ENGINE = os.environ.get("STT_ENGINE", "qwen").strip().lower()  # qwen | whisper
QWEN_ASR_MODEL = os.environ.get(
    "QWEN_ASR_MODEL", "seanghay/Qwen3-ASR-0.6B-Khmer"
)
QWEN_ASR_MAX_NEW_TOKENS = int(os.environ.get("QWEN_ASR_MAX_NEW_TOKENS", "1024"))
WHISPER_MODEL = os.environ.get(
    "WHISPER_MODEL", "PhanithLIM/whisper-small-khmer-ct2"
)
WHISPER_COMPUTE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8_float16")
API_KEY = (
    os.environ.get("SOMLENG_AI_API_KEY")
    or os.environ.get("VOICE_CLONE_API_KEY")
    or ""
).strip()
DEFAULT_CFG = float(os.environ.get("VOXCPM_CFG", "2.0"))
DEFAULT_TIMESTEPS = int(os.environ.get("VOXCPM_TIMESTEPS", "10"))

BASE_DIR = Path(os.environ.get("SOMLENG_AI_DATA", Path(__file__).resolve().parent / "data"))
UPLOAD_DIR = BASE_DIR / "uploads"
JOB_DIR = BASE_DIR / "jobs"
META_DIR = BASE_DIR / "file_meta"

for d in (UPLOAD_DIR, JOB_DIR, META_DIR):
    d.mkdir(parents=True, exist_ok=True)

os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

app = FastAPI(title="Somleng AI", version="2.2.0")

ActiveModel = Literal["none", "whisper", "qwen_asr", "mms", "voxcpm2"]

_gpu_lock = threading.RLock()
_active_model: ActiveModel = "none"
_voxcpm_model: Any = None
# MMS caches one loaded checkpoint; swap when language changes.
_mms_model: Any = None
_mms_tokenizer: Any = None
_mms_loaded_id: str | None = None
_whisper_model: Any = None
_qwen_asr_model: Any = None

_clone_jobs: dict[str, dict[str, Any]] = {}
_clone_jobs_lock = threading.Lock()


# ── Auth / helpers ──────────────────────────────────────────────────────────

def _require_auth(authorization: str | None) -> None:
    if not API_KEY:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = authorization.removeprefix("Bearer ").strip()
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _device_info() -> dict[str, Any]:
    try:
        import torch

        if torch.cuda.is_available():
            idx = torch.cuda.current_device()
            return {
                "device": "cuda",
                "name": torch.cuda.get_device_name(idx),
                "vram_gb": round(
                    torch.cuda.get_device_properties(idx).total_memory / (1024**3), 1
                ),
            }
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return {"device": "mps", "name": "Apple MPS"}
    except Exception as exc:  # pragma: no cover
        return {"device": "unknown", "error": str(exc)}
    return {"device": "cpu"}


def _disk_free_gb() -> float:
    usage = shutil.disk_usage(BASE_DIR)
    return round(usage.free / (1024**3), 1)


def _cuda_empty() -> None:
    try:
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
    except Exception:
        pass
    gc.collect()


def _unload_voxcpm() -> None:
    global _voxcpm_model, _active_model
    if _voxcpm_model is not None:
        print("[somleng-ai] unloading VoxCPM2")
        _voxcpm_model = None
        _cuda_empty()
    if _active_model == "voxcpm2":
        _active_model = "none"


def _unload_mms() -> None:
    global _mms_model, _mms_tokenizer, _mms_loaded_id, _active_model
    if _mms_model is not None or _mms_tokenizer is not None:
        print("[somleng-ai] unloading MMS TTS")
        _mms_model = None
        _mms_tokenizer = None
        _mms_loaded_id = None
        _cuda_empty()
    if _active_model == "mms":
        _active_model = "none"


def _mms_repo_for_language(language: str | None) -> str:
    code = (language or "km-KH").lower()
    if code.startswith("en"):
        return MMS_TTS_MODEL_EN
    return MMS_TTS_MODEL


def _unload_whisper() -> None:
    global _whisper_model, _active_model
    if _whisper_model is not None:
        print("[somleng-ai] unloading Whisper")
        _whisper_model = None
        _cuda_empty()
    if _active_model == "whisper":
        _active_model = "none"


def _unload_qwen_asr() -> None:
    global _qwen_asr_model, _active_model
    if _qwen_asr_model is not None:
        print("[somleng-ai] unloading Qwen ASR")
        _qwen_asr_model = None
        _cuda_empty()
    if _active_model == "qwen_asr":
        _active_model = "none"


def _ensure_voxcpm() -> Any:
    global _voxcpm_model, _active_model
    with _gpu_lock:
        # VoxCPM needs almost all of the 4GB card — clear everything else.
        if _active_model == "whisper" or _whisper_model is not None:
            _unload_whisper()
        if _active_model == "qwen_asr" or _qwen_asr_model is not None:
            _unload_qwen_asr()
        if _active_model == "mms" or _mms_model is not None:
            _unload_mms()
        if _voxcpm_model is not None:
            _active_model = "voxcpm2"
            return _voxcpm_model

        import torch
        from voxcpm import VoxCPM

        print(f"[somleng-ai] loading VoxCPM2 {VOXCPM_MODEL} ...")
        started = time.time()
        model = VoxCPM.from_pretrained(VOXCPM_MODEL, load_denoiser=False)
        if not torch.cuda.is_available():
            model.tts_model = model.tts_model.to(torch.float32)
        else:
            props = torch.cuda.get_device_properties(0)
            print(
                f"[somleng-ai] CUDA {props.name} "
                f"{props.total_memory / (1024**3):.1f}GB"
            )
        _voxcpm_model = model
        _active_model = "voxcpm2"
        print(f"[somleng-ai] VoxCPM2 ready in {time.time() - started:.1f}s")
        return _voxcpm_model


def _ensure_mms(language: str | None = None) -> tuple[Any, Any]:
    """Load Meta MMS VITS for default TTS. Unloads VoxCPM / Qwen ASR."""
    global _mms_model, _mms_tokenizer, _mms_loaded_id, _active_model
    repo_id = _mms_repo_for_language(language)
    with _gpu_lock:
        if _active_model == "voxcpm2" or _voxcpm_model is not None:
            _unload_voxcpm()
        if _active_model == "qwen_asr" or _qwen_asr_model is not None:
            _unload_qwen_asr()
        if (
            _mms_model is not None
            and _mms_tokenizer is not None
            and _mms_loaded_id == repo_id
        ):
            _active_model = "mms"
            return _mms_model, _mms_tokenizer

        if _mms_model is not None and _mms_loaded_id != repo_id:
            _unload_mms()

        import torch
        from transformers import AutoTokenizer, VitsModel

        print(f"[somleng-ai] loading MMS TTS {repo_id} ...")
        started = time.time()
        tokenizer = AutoTokenizer.from_pretrained(repo_id)
        model = VitsModel.from_pretrained(repo_id)
        if torch.cuda.is_available():
            model = model.to("cuda")
        model.eval()
        _mms_tokenizer = tokenizer
        _mms_model = model
        _mms_loaded_id = repo_id
        _active_model = "mms"
        print(f"[somleng-ai] MMS TTS ready in {time.time() - started:.1f}s")
        return _mms_model, _mms_tokenizer


def _ensure_qwen_asr() -> Any:
    """Load Qwen3-ASR Khmer. Unloads VoxCPM / Whisper / MMS for VRAM headroom."""
    global _qwen_asr_model, _active_model
    with _gpu_lock:
        if _active_model == "voxcpm2" or _voxcpm_model is not None:
            _unload_voxcpm()
        if _active_model == "whisper" or _whisper_model is not None:
            _unload_whisper()
        if _active_model == "mms" or _mms_model is not None:
            _unload_mms()
        if _qwen_asr_model is not None:
            _active_model = "qwen_asr"
            return _qwen_asr_model

        import torch
        from qwen_asr import Qwen3ASRModel

        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if device.startswith("cuda") else torch.float32
        print(f"[somleng-ai] loading Qwen ASR {QWEN_ASR_MODEL} on {device} ...")
        started = time.time()
        model = Qwen3ASRModel.from_pretrained(
            QWEN_ASR_MODEL,
            dtype=dtype,
            device_map=device,
            max_inference_batch_size=1,
            max_new_tokens=QWEN_ASR_MAX_NEW_TOKENS,
        )
        _qwen_asr_model = model
        _active_model = "qwen_asr"
        print(f"[somleng-ai] Qwen ASR ready in {time.time() - started:.1f}s")
        return _qwen_asr_model


def _ensure_whisper() -> Any:
    global _whisper_model, _active_model
    with _gpu_lock:
        if _active_model == "voxcpm2" or _voxcpm_model is not None:
            _unload_voxcpm()
        if _active_model == "qwen_asr" or _qwen_asr_model is not None:
            _unload_qwen_asr()
        # MMS (~36M) can stay warm beside Whisper on 4GB.
        if _whisper_model is not None:
            _active_model = "whisper"
            return _whisper_model

        from faster_whisper import WhisperModel

        print(f"[somleng-ai] loading Whisper {WHISPER_MODEL} ({WHISPER_COMPUTE}) ...")
        started = time.time()
        try:
            import torch

            device = "cuda" if torch.cuda.is_available() else "cpu"
        except Exception:
            device = "cpu"
        compute = WHISPER_COMPUTE if device == "cuda" else "int8"
        model = WhisperModel(WHISPER_MODEL, device=device, compute_type=compute)
        _whisper_model = model
        _active_model = "whisper"
        print(f"[somleng-ai] Whisper ready in {time.time() - started:.1f}s on {device}")
        return _whisper_model


def _wav_bytes(wav: np.ndarray, sample_rate: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, wav, sample_rate, format="WAV")
    return buf.getvalue()


def _save_upload_bytes(data: bytes, filename: str) -> dict[str, Any]:
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload")
    file_id = str(uuid.uuid4())
    ext = Path(filename or "audio.bin").suffix or ".bin"
    path = UPLOAD_DIR / f"{file_id}{ext}"
    path.write_bytes(data)
    meta = {
        "id": file_id,
        "filename": filename or path.name,
        "path": str(path),
        "size": len(data),
        "created_at": time.time(),
    }
    (META_DIR / f"{file_id}.json").write_text(json.dumps(meta), encoding="utf-8")
    return meta


def _load_file_meta(file_id: str) -> dict[str, Any]:
    meta_path = META_DIR / f"{file_id}.json"
    if not meta_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return json.loads(meta_path.read_text(encoding="utf-8"))


def _job_path(job_id: str) -> Path:
    return JOB_DIR / f"{job_id}.json"


def _write_job(job_id: str, payload: dict[str, Any]) -> None:
    _job_path(job_id).write_text(json.dumps(payload), encoding="utf-8")


def _read_job(job_id: str) -> dict[str, Any]:
    path = _job_path(job_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Job not found")
    return json.loads(path.read_text(encoding="utf-8"))


def _language_to_whisper(code: str | None) -> str | None:
    if not code:
        return "km"
    lower = code.lower()
    if lower.startswith("km"):
        return "km"
    if lower.startswith("en"):
        return "en"
    return lower.split("-")[0]


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    info = _device_info()
    return {
        "status": "ok",
        "service": "somleng-ai",
        "tts_engine": "mms",
        "clone_engine": "voxcpm2",
        "stt_engine": STT_ENGINE if STT_ENGINE in {"qwen", "whisper"} else "qwen",
        "mms_tts_model": MMS_TTS_MODEL,
        "mms_tts_model_en": MMS_TTS_MODEL_EN,
        "voxcpm_model": VOXCPM_MODEL,
        "qwen_asr_model": QWEN_ASR_MODEL,
        "whisper_model": WHISPER_MODEL,
        "active_model": _active_model,
        "disk_free_gb": _disk_free_gb(),
        "auth_required": bool(API_KEY),
        "diarization": False,
        "license_note": (
            "Default TTS (MMS) is CC-BY-NC-4.0; swap before commercial use. "
            "STT (Qwen3-ASR Khmer) is Apache-2.0."
        ),
        **info,
    }


# ── File storage ────────────────────────────────────────────────────────────

@app.post("/v1/files")
async def upload_file(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
):
    _require_auth(authorization)
    data = await file.read()
    meta = _save_upload_bytes(data, file.filename or "audio.bin")
    return {
        "id": meta["id"],
        "filename": meta["filename"],
        "size": meta["size"],
        "audio_path": meta["id"],
    }


@app.get("/v1/files/{file_id}")
def get_file(file_id: str, authorization: str | None = Header(default=None)):
    _require_auth(authorization)
    meta = _load_file_meta(file_id)
    path = Path(meta["path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(
        path,
        filename=meta.get("filename") or path.name,
        media_type="application/octet-stream",
    )


@app.delete("/v1/files/{file_id}")
def delete_file(file_id: str, authorization: str | None = Header(default=None)):
    _require_auth(authorization)
    meta_path = META_DIR / f"{file_id}.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        try:
            Path(meta["path"]).unlink(missing_ok=True)
        except OSError:
            pass
        meta_path.unlink(missing_ok=True)
    return Response(status_code=204)


# ── STT (Whisper) ───────────────────────────────────────────────────────────

def _load_audio_for_whisper(file_path: str) -> np.ndarray:
    """Load audio as 16kHz mono float32 — avoids PyAV metadata_errors mismatch."""
    import subprocess

    # Prefer soundfile for wav/flac; fall back to ffmpeg → wav
    try:
        audio, sr = sf.read(file_path, always_2d=False)
        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        if sr != 16000:
            # Lightweight linear resample
            duration = audio.shape[0] / float(sr)
            target = int(duration * 16000)
            x_old = np.linspace(0.0, 1.0, num=audio.shape[0], endpoint=False)
            x_new = np.linspace(0.0, 1.0, num=target, endpoint=False)
            audio = np.interp(x_new, x_old, audio).astype(np.float32)
        return audio
    except Exception:
        pass

    fd, tmp = tempfile.mkstemp(suffix=".wav", prefix="whisper_")
    os.close(fd)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                file_path,
                "-ac",
                "1",
                "-ar",
                "16000",
                "-f",
                "wav",
                tmp,
            ],
            check=True,
            capture_output=True,
        )
        audio, _sr = sf.read(tmp, always_2d=False)
        audio = np.asarray(audio, dtype=np.float32)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        return audio
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def _clean_transcript_text(text: str) -> str:
    """Drop broken UTF-8 leftovers and collapse whitespace."""
    cleaned = (text or "").replace("\ufffd", "").replace("�", "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _collect_segments(
    segments_iter: Any,
    *,
    time_offset: float = 0.0,
) -> tuple[list[dict[str, Any]], list[str], float]:
    segments: list[dict[str, Any]] = []
    texts: list[str] = []
    max_end = 0.0
    for seg in segments_iter:
        text = _clean_transcript_text(seg.text or "")
        if not text:
            continue
        start = float(seg.start) + time_offset if seg.start is not None else None
        end = float(seg.end) + time_offset if seg.end is not None else None
        texts.append(text)
        segments.append(
            {
                "start": start,
                "end": end,
                "text": text,
                "speaker": None,
            }
        )
        if end is not None and end > max_end:
            max_end = end
    return segments, texts, max_end


def _transcribe_chunked(
    model: Any,
    audio: np.ndarray,
    base_kwargs: dict[str, Any],
    *,
    sample_rate: int = 16000,
    window_s: float = 20.0,
    overlap_s: float = 5.0,
) -> tuple[list[dict[str, Any]], Any]:
    """Transcribe fixed <30s overlapping windows and keep exclusive midpoints.

    Whisper truncates Khmer at its internal ~30s boundary. Short overlapping
    windows avoid that cut; midpoint selection discards damaged edges.
    """
    duration = float(len(audio) / sample_rate)
    pad = np.zeros(int(sample_rate * 1.2), dtype=np.float32)
    kwargs = {
        **base_kwargs,
        "vad_filter": False,
        "condition_on_previous_text": False,
        "word_timestamps": False,
    }

    def _run(chunk: np.ndarray, time_offset: float = 0.0) -> tuple[list[dict[str, Any]], Any]:
        segments_iter, info = model.transcribe(np.concatenate([chunk, pad]), **kwargs)
        segs, _texts, _max_end = _collect_segments(
            segments_iter, time_offset=time_offset
        )
        return segs, info

    if duration <= window_s + 1.0:
        segs, info = _run(audio)
        return segs, info

    stride = max(1.0, window_s - overlap_s)
    half = overlap_s / 2.0
    windows: list[tuple[float, float, list[dict[str, Any]]]] = []
    info: Any = None
    start = 0.0
    while start < duration:
        end = min(duration, start + window_s)
        if duration - start <= window_s * 1.2:
            end = duration
        start_i = int(start * sample_rate)
        end_i = int(end * sample_rate)
        segs, info = _run(audio[start_i:end_i], time_offset=start)
        windows.append((start, end, segs))
        if end >= duration - 1e-3:
            break
        start += stride

    print(f"[somleng-ai] STT windows={len(windows)} window={window_s}s overlap={overlap_s}s")

    merged: list[dict[str, Any]] = []
    for idx, (win_start, win_end, segs) in enumerate(windows):
        is_first = idx == 0
        is_last = idx == len(windows) - 1
        keep_lo = win_start if is_first else win_start + half
        keep_hi = win_end if is_last else win_end - half
        for seg in segs:
            s = seg.get("start")
            e = seg.get("end")
            if s is None or e is None:
                if is_first:
                    merged.append(seg)
                continue
            mid = (float(s) + float(e)) / 2.0
            if keep_lo - 1e-3 <= mid <= keep_hi + 1e-3:
                merged.append(seg)

    merged.sort(key=lambda s: (s.get("start") is None, s.get("start") or 0.0))
    return merged, info


def _qwen_max_tokens_for_duration(duration_s: float) -> int:
    # Roughly ~12–20 Khmer chars/sec of speech; leave headroom for long clips.
    estimate = int(max(256, duration_s * 24))
    return int(min(max(QWEN_ASR_MAX_NEW_TOKENS, estimate), 4096))


def _transcribe_with_qwen(
    audio: np.ndarray, *, sample_rate: int = 16000
) -> tuple[str, list[dict[str, Any]], float]:
    """Run Qwen3-ASR Khmer and return (text, segments, duration)."""
    duration = float(len(audio) / sample_rate)
    model = _ensure_qwen_asr()

    # Bump generation budget for this clip when the loaded default is too small.
    max_tokens = _qwen_max_tokens_for_duration(duration)
    try:
        if hasattr(model, "max_new_tokens"):
            model.max_new_tokens = max_tokens
    except Exception:
        pass

    with _gpu_lock:
        results = model.transcribe(audio=(audio, sample_rate))

    raw = ""
    if results:
        first = results[0]
        raw = getattr(first, "text", None) or str(first)
    text = _clean_transcript_text(raw)
    # Drop optional language prefix if the parser left one.
    text = re.sub(
        r"^(?:language\s+)?(?:Khmer|English|km|en)\s*",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()
    text = _clean_transcript_text(text)

    segments: list[dict[str, Any]] = []
    if text:
        segments.append(
            {
                "start": 0.0,
                "end": duration,
                "text": text,
                "speaker": None,
            }
        )
    return text, segments, duration


def _transcribe_with_whisper(
    audio: np.ndarray, language: str | None
) -> tuple[str, list[dict[str, Any]], float, str | None]:
    """Legacy Whisper path (fallback / STT_ENGINE=whisper)."""
    model = _ensure_whisper()
    lang = _language_to_whisper(language)
    silence_pad = np.zeros(int(16000 * 1.0), dtype=np.float32)
    audio = np.concatenate([audio, silence_pad])
    audio_duration = float(len(audio) / 16000.0)
    reported_duration = max(0.0, audio_duration - 1.0)

    transcribe_kwargs: dict[str, Any] = {
        "language": lang,
        "task": "transcribe",
        "beam_size": 5,
        "best_of": 5,
        "patience": 1.2,
        "temperature": (0.0, 0.2, 0.4, 0.6),
        "condition_on_previous_text": False,
        "vad_filter": False,
        "word_timestamps": False,
        "compression_ratio_threshold": 2.6,
        "no_speech_threshold": 0.5,
    }

    segments, info = _transcribe_chunked(
        model,
        audio,
        transcribe_kwargs,
        window_s=20.0,
        overlap_s=5.0,
    )

    if audio_duration > 12.0:
        tail_seconds = 20.0
        start_sample = int(max(0.0, (audio_duration - tail_seconds) * 16000))
        time_offset = start_sample / 16000.0
        tail_audio = np.concatenate(
            [audio[start_sample:], np.zeros(int(16000 * 1.5), dtype=np.float32)]
        )
        tail_iter, _tail_info = model.transcribe(
            tail_audio,
            **{
                **transcribe_kwargs,
                "vad_filter": False,
                "condition_on_previous_text": False,
            },
        )
        tail_segments, _tail_texts, _tail_end = _collect_segments(
            tail_iter, time_offset=time_offset
        )
        if tail_segments:
            cut = time_offset + 6.0
            keep_before = [
                s
                for s in segments
                if s.get("end") is None or float(s["end"]) < cut
            ]
            tail_keep = [
                s
                for s in tail_segments
                if s.get("start") is None or float(s["start"]) >= cut
            ]
            if tail_keep:
                segments = keep_before + tail_keep
                segments.sort(
                    key=lambda s: (s.get("start") is None, s.get("start") or 0.0)
                )

    max_end = max(
        (float(s["end"]) for s in segments if s.get("end") is not None),
        default=0.0,
    )
    duration = max(
        float(getattr(info, "duration", 0) or 0) if info is not None else 0.0,
        max_end,
        reported_duration,
    )
    full_text = _clean_transcript_text(
        " ".join(s["text"] for s in segments if s.get("text"))
    )
    detected = getattr(info, "language", lang) if info is not None else lang
    return full_text, segments, duration, detected


def _run_transcribe_job(job_id: str, file_path: str, language: str | None) -> None:
    try:
        job = _read_job(job_id)
        job["status"] = "processing"
        job["progress_percent"] = 10
        _write_job(job_id, job)

        audio = _load_audio_for_whisper(file_path)
        engine = STT_ENGINE if STT_ENGINE in {"qwen", "whisper"} else "qwen"
        job["progress_percent"] = 30
        _write_job(job_id, job)

        if engine == "qwen":
            # Light pad helps final syllable; Qwen chunks long audio internally.
            silence_pad = np.zeros(int(16000 * 0.4), dtype=np.float32)
            padded = np.concatenate([audio, silence_pad])
            job["progress_percent"] = 50
            _write_job(job_id, job)
            full_text, segments, duration = _transcribe_with_qwen(padded)
            duration = max(duration - 0.4, float(len(audio) / 16000.0))
            detected_lang = _language_to_whisper(language) or "km"
        else:
            job["progress_percent"] = 50
            _write_job(job_id, job)
            full_text, segments, duration, detected_lang = _transcribe_with_whisper(
                audio, language
            )

        job["progress_percent"] = 90
        _write_job(job_id, job)

        job.update(
            {
                "status": "completed",
                "progress_percent": 100,
                "text": full_text,
                "segments": segments,
                "duration_seconds": duration,
                "language": detected_lang,
                "engine": engine,
                "error": None,
            }
        )
        _write_job(job_id, job)
    except Exception as exc:
        try:
            job = _read_job(job_id)
        except Exception:
            job = {"id": job_id}
        job.update(
            {
                "status": "failed",
                "progress_percent": 0,
                "error": str(exc),
            }
        )
        _write_job(job_id, job)


@app.post("/v1/audio/transcribe/jobs")
async def transcribe_job_create(
    file_id: str | None = Form(default=None),
    language: str = Form("km-KH"),
    file: UploadFile | None = File(default=None),
    authorization: str | None = Header(default=None),
):
    _require_auth(authorization)

    if file is not None and file.filename:
        data = await file.read()
        meta = _save_upload_bytes(data, file.filename)
        resolved_id = meta["id"]
        file_path = meta["path"]
        original_filename = meta["filename"]
    elif file_id:
        meta = _load_file_meta(file_id)
        resolved_id = meta["id"]
        file_path = meta["path"]
        original_filename = meta.get("filename")
        if not Path(file_path).exists():
            raise HTTPException(status_code=404, detail="Audio file missing")
    else:
        raise HTTPException(status_code=400, detail="file_id or file is required")

    job_id = str(uuid.uuid4())
    payload = {
        "id": job_id,
        "status": "queued",
        "progress_percent": 5,
        "file_id": resolved_id,
        "original_filename": original_filename,
        "language": language,
        "text": None,
        "segments": [],
        "duration_seconds": None,
        "error": None,
        "created_at": time.time(),
    }
    _write_job(job_id, payload)

    thread = threading.Thread(
        target=_run_transcribe_job,
        args=(job_id, file_path, language),
        daemon=True,
    )
    thread.start()
    return {"id": job_id, "job_id": job_id, "status": "queued", "file_id": resolved_id}


@app.get("/v1/audio/transcribe/jobs/{job_id}")
def transcribe_job_status(
    job_id: str, authorization: str | None = Header(default=None)
):
    _require_auth(authorization)
    job = _read_job(job_id)
    return job


# ── TTS preset (MMS) + clone (VoxCPM2) ──────────────────────────────────────

def _synthesize_clone(
    text: str, reference_path: str, cfg: float, timesteps: int
) -> tuple[np.ndarray, int]:
    with _gpu_lock:
        model = _ensure_voxcpm()
        wav = model.generate(
            text=text,
            reference_wav_path=reference_path,
            cfg_value=cfg,
            inference_timesteps=timesteps,
        )
        sr = int(getattr(model.tts_model, "sample_rate", 48000))
        return np.asarray(wav), sr


def _synthesize_preset(
    text: str, language: str | None = None
) -> tuple[np.ndarray, int]:
    """Default TTS via Meta MMS VITS (small, stable on 4GB)."""
    import torch

    with _gpu_lock:
        model, tokenizer = _ensure_mms(language)
        inputs = tokenizer(text, return_tensors="pt")
        if next(model.parameters()).is_cuda:
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            waveform = model(**inputs).waveform
        wav = waveform.squeeze().detach().float().cpu().numpy()
        sr = int(getattr(model.config, "sampling_rate", 16000))
        return np.asarray(wav), sr


def _read_upload_to_temp(upload: UploadFile) -> str:
    suffix = os.path.splitext(upload.filename or "ref.wav")[1] or ".wav"
    fd, path = tempfile.mkstemp(suffix=suffix, prefix="ref_")
    os.close(fd)
    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Reference audio is empty")
    with open(path, "wb") as f:
        f.write(data)
    return path


@app.post("/v1/audio/speech")
async def preset_speech(
    text: str = Form(...),
    language: str = Form("km-KH"),
    cfg_value: float = Form(DEFAULT_CFG),
    inference_timesteps: int = Form(DEFAULT_TIMESTEPS),
    authorization: str | None = Header(default=None),
):
    _require_auth(authorization)
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Text is required")
    # cfg/timesteps kept for API compatibility; MMS does not use them.
    _ = (cfg_value, inference_timesteps)

    try:
        wav, sr = _synthesize_preset(cleaned, language)
        audio = _wav_bytes(wav, sr)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"TTS failed: {exc}") from exc

    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Content-Disposition": 'inline; filename="speech.wav"'},
    )


@app.post("/v1/audio/clone")
async def clone_sync(
    text: str = Form(...),
    reference_audio: UploadFile = File(...),
    voice_consent: str = Form("true"),
    cfg_value: float = Form(DEFAULT_CFG),
    inference_timesteps: int = Form(DEFAULT_TIMESTEPS),
    authorization: str | None = Header(default=None),
):
    _require_auth(authorization)
    if voice_consent.lower() not in {"true", "1", "yes", "on"}:
        raise HTTPException(status_code=400, detail="voice_consent must be true")

    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Text is required")

    ref_path = _read_upload_to_temp(reference_audio)
    try:
        wav, sr = _synthesize_clone(cleaned, ref_path, cfg_value, inference_timesteps)
        audio = _wav_bytes(wav, sr)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Clone failed: {exc}") from exc
    finally:
        try:
            os.remove(ref_path)
        except OSError:
            pass

    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Content-Disposition": 'inline; filename="cloned-speech.wav"'},
    )


def _run_clone_job(
    job_id: str, text: str, ref_path: str, cfg: float, timesteps: int
) -> None:
    try:
        wav, sr = _synthesize_clone(text, ref_path, cfg, timesteps)
        audio = _wav_bytes(wav, sr)
        with _clone_jobs_lock:
            _clone_jobs[job_id] = {
                "status": "completed",
                "audio": audio,
                "content_type": "audio/wav",
                "error": None,
            }
    except Exception as exc:
        with _clone_jobs_lock:
            _clone_jobs[job_id] = {
                "status": "failed",
                "audio": None,
                "content_type": None,
                "error": str(exc),
            }
    finally:
        try:
            os.remove(ref_path)
        except OSError:
            pass


@app.post("/v2/audio/clone/jobs")
async def clone_job_create(
    input: str = Form(...),
    reference_audio: UploadFile = File(...),
    model: str = Form("voxcpm2"),
    voice_consent: str = Form("true"),
    cfg_value: float = Form(DEFAULT_CFG),
    inference_timesteps: int = Form(DEFAULT_TIMESTEPS),
    authorization: str | None = Header(default=None),
):
    _require_auth(authorization)
    _ = model
    if voice_consent.lower() not in {"true", "1", "yes", "on"}:
        raise HTTPException(status_code=400, detail="voice_consent must be true")

    cleaned = input.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="input is required")

    ref_path = _read_upload_to_temp(reference_audio)
    job_id = str(uuid.uuid4())
    with _clone_jobs_lock:
        _clone_jobs[job_id] = {
            "status": "processing",
            "audio": None,
            "content_type": None,
            "error": None,
        }

    threading.Thread(
        target=_run_clone_job,
        args=(job_id, cleaned, ref_path, cfg_value, inference_timesteps),
        daemon=True,
    ).start()
    return JSONResponse({"job_id": job_id, "status": "processing"})


@app.get("/v2/audio/jobs/{job_id}")
def clone_job_status(job_id: str, authorization: str | None = Header(default=None)):
    _require_auth(authorization)
    with _clone_jobs_lock:
        job = _clone_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    payload: dict[str, Any] = {"status": job["status"]}
    if job["error"]:
        payload["error"] = job["error"]
    return payload


@app.get("/v2/audio/jobs/{job_id}/audio")
def clone_job_audio(job_id: str, authorization: str | None = Header(default=None)):
    _require_auth(authorization)
    with _clone_jobs_lock:
        job = _clone_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "completed" or not job["audio"]:
        raise HTTPException(status_code=409, detail="Audio not ready")
    return Response(
        content=job["audio"],
        media_type=job["content_type"] or "audio/wav",
        headers={"Content-Disposition": 'inline; filename="cloned-speech.wav"'},
    )


@app.on_event("startup")
def startup() -> None:
    print(f"[somleng-ai] data dir: {BASE_DIR}")
    print(f"[somleng-ai] STT engine: {STT_ENGINE} ({QWEN_ASR_MODEL if STT_ENGINE != 'whisper' else WHISPER_MODEL})")
    print(f"[somleng-ai] default TTS: MMS ({MMS_TTS_MODEL})")
    print(f"[somleng-ai] clone engine: VoxCPM2 ({VOXCPM_MODEL})")
    if os.environ.get("MMS_WARMUP", "0") == "1":
        _ensure_mms()
    if os.environ.get("VOXCPM_WARMUP", "0") == "1":
        _ensure_voxcpm()
    if os.environ.get("QWEN_ASR_WARMUP", "0") == "1":
        _ensure_qwen_asr()
    if os.environ.get("WHISPER_WARMUP", "0") == "1":
        _ensure_whisper()
