"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cloneSpeech,
  deleteSavedVoice,
  fetchSavedVoiceAudio,
  fetchSavedVoices,
  saveSpeechToHistory,
  saveVoice,
  type SavedVoiceSummary,
} from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { estimateRemainingSeconds } from "@/lib/progress";
import { SpeechProgressPanel } from "@/components/SpeechProgressPanel";
import { splitCloneText } from "@/lib/cloneChunks";
import { concatAudioBlobs } from "@/lib/wavConcat";

/** Long scripts are chunked; each GPU pass stays short on RTX 2050. */
const MAX_CHARS = 6000;
const CHUNK_TARGET = 280;
const CHUNK_MAX = 360;
const MAX_RECORD_MS = 12_000;

function estimateCloneMs(charCount: number, chunks = 1): number {
  const perChunk = Math.min(180_000, Math.max(12_000, 8000 + charCount * 28));
  return Math.min(45 * 60_000, perChunk * Math.max(1, chunks));
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export function VoiceCloneApp() {
  const { text: t } = useLanguage();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("km-KH");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStartedAt, setProgressStartedAt] = useState<number | null>(null);
  const [progressNow, setProgressNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState<string | null>(
    null,
  );
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [savedVoices, setSavedVoices] = useState<SavedVoiceSummary[]>([]);
  const [selectedSavedVoiceId, setSelectedSavedVoiceId] = useState<string | null>(
    null,
  );
  const [selectedSavedName, setSelectedSavedName] = useState<string | null>(null);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [saveName, setSaveName] = useState("");
  const [savingVoice, setSavingVoice] = useState(false);
  const [chunkLabel, setChunkLabel] = useState<string | null>(null);
  const [chunkTotal, setChunkTotal] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languages = [
    { code: "km-KH", label: t.languageKhmer },
    { code: "en-US", label: t.languageEnglish },
  ];

  const loadVoices = useCallback(async () => {
    try {
      const voices = await fetchSavedVoices();
      setSavedVoices(voices);
    } catch {
      setSavedVoices([]);
    } finally {
      setLoadingVoices(false);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
  }, [loadVoices]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (referencePreviewUrl) URL.revokeObjectURL(referencePreviewUrl);
    };
  }, [referencePreviewUrl]);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    const el = audioRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {
      /* autoplay may be blocked */
    });
  }, [audioUrl]);

  function stopRecordingCleanup() {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function setReference(file: File | null) {
    setSelectedSavedVoiceId(null);
    setSelectedSavedName(null);
    setReferenceFile(file);
    setReferencePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function selectSavedVoice(voice: SavedVoiceSummary) {
    setError(null);
    setReferenceFile(null);
    setSelectedSavedVoiceId(voice.id);
    setSelectedSavedName(voice.name);
    try {
      const blob = await fetchSavedVoiceAudio(voice.id);
      const url = URL.createObjectURL(blob);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.loadFailed);
      setSelectedSavedVoiceId(null);
      setSelectedSavedName(null);
    }
  }

  function handleFileSelect(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setReference(file);
  }

  async function startRecording() {
    setError(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(t.ttsCloneUnsupportedMic);
      return;
    }

    const mimeType = pickRecorderMimeType();
    if (typeof MediaRecorder === "undefined") {
      setError(t.ttsCloneUnsupportedMic);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (blob.size > 0) {
          const ext = type.includes("mp4")
            ? "m4a"
            : type.includes("ogg")
              ? "ogg"
              : "webm";
          setReference(new File([blob], `recording.${ext}`, { type }));
        }

        setRecording(false);
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        if (recordTimeoutRef.current) {
          clearTimeout(recordTimeoutRef.current);
          recordTimeoutRef.current = null;
        }
      };

      recorder.start(250);
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
      recordTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORD_MS);
    } catch {
      setError(t.ttsCloneMicDenied);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopRecordingCleanup();
      setRecording(false);
    }
  }

  const trimmed = text.trim();
  const overLimit = text.length > MAX_CHARS;
  const hasReference = Boolean(referenceFile || selectedSavedVoiceId);
  const canGenerate =
    hasReference &&
    consent &&
    trimmed.length > 0 &&
    !overLimit &&
    !loading &&
    !recording;

  const activeStep = !hasReference ? 1 : !consent ? 2 : 3;

  useEffect(() => {
    if (!loading || progressStartedAt == null) return;

    const estimatedMs = estimateCloneMs(
      Math.ceil((trimmed.length || 1) / Math.max(1, chunkTotal)),
      chunkTotal,
    );
    const id = window.setInterval(() => {
      const now = Date.now();
      setProgressNow(now);
      const elapsed = now - progressStartedAt;
      const ratio = Math.min(1, elapsed / estimatedMs);
      const next = Math.min(92, Math.round(8 + ratio * 84));
      setProgress((prev) => Math.max(prev, next));
    }, 200);

    return () => window.clearInterval(id);
  }, [loading, progressStartedAt, trimmed.length, chunkTotal]);

  async function handleGenerate() {
    if (!canGenerate) {
      if (!hasReference) setError(t.ttsCloneNeedReference);
      else if (!consent) setError(t.ttsCloneNeedConsent);
      return;
    }

    const chunks = splitCloneText(trimmed, CHUNK_TARGET, CHUNK_MAX);
    if (chunks.length === 0) return;

    setLoading(true);
    setProgress(5);
    setProgressStartedAt(Date.now());
    setChunkTotal(chunks.length);
    setChunkLabel(t.cloneChunkProgress(1, chunks.length));
    setError(null);

    const baseOptions = {
      language,
      voiceConsent: consent,
      savedVoiceId: selectedSavedVoiceId ?? undefined,
      referenceAudio: selectedSavedVoiceId
        ? undefined
        : (referenceFile ?? undefined),
      filename: referenceFile?.name,
      persist: false as const,
    };

    try {
      const parts: Blob[] = [];
      for (let i = 0; i < chunks.length; i++) {
        setChunkLabel(t.cloneChunkProgress(i + 1, chunks.length));
        setProgress(Math.min(88, Math.round(((i + 0.15) / chunks.length) * 88)));
        const part = await cloneSpeech(chunks[i]!, baseOptions);
        parts.push(part);
        setProgress(Math.min(90, Math.round(((i + 1) / chunks.length) * 90)));
      }

      setChunkLabel(t.cloneStitching);
      setProgress(93);
      const combined =
        parts.length === 1 ? parts[0]! : await concatAudioBlobs(parts);

      try {
        await saveSpeechToHistory({
          text: trimmed,
          language,
          jobType: "clone",
          engine: "voxcpm2",
          audio: combined,
          filename: "cloned-speech.wav",
        });
      } catch (persistError) {
        console.warn("clone history save failed:", persistError);
      }

      setProgress(100);
      const nextUrl = URL.createObjectURL(combined);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ttsCloneFailed);
    } finally {
      setLoading(false);
      setProgressStartedAt(null);
      setChunkLabel(null);
      window.setTimeout(() => setProgress(0), 400);
    }
  }

  async function handleSaveVoice() {
    if (!referenceFile || savingVoice) return;
    const name = saveName.trim();
    if (!name) {
      setError(t.cloneSaveVoiceName);
      return;
    }

    setSavingVoice(true);
    setError(null);
    try {
      const voice = await saveVoice(name, referenceFile, referenceFile.name);
      setSaveName("");
      await loadVoices();
      await selectSavedVoice(voice);
      setReferenceFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ttsCloneFailed);
    } finally {
      setSavingVoice(false);
    }
  }

  async function handleDeleteVoice(id: string) {
    setError(null);
    try {
      await deleteSavedVoice(id);
      if (selectedSavedVoiceId === id) {
        setSelectedSavedVoiceId(null);
        setSelectedSavedName(null);
        setReferencePreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setConsent(false);
      }
      await loadVoices();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ttsCloneFailed);
    }
  }

  function progressLabel(): string {
    if (chunkLabel) return chunkLabel;
    if (progress < 25) return t.ttsPreparing;
    if (progress < 85) return t.ttsCloning;
    return t.ttsFinalizing;
  }

  const progressEtaSeconds =
    loading && progressStartedAt != null
      ? estimateRemainingSeconds(progressStartedAt, progress, progressNow)
      : null;

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "cloned-speech.wav";
    a.click();
  }

  const steps = [
    { n: 1, label: t.cloneStepReference },
    { n: 2, label: t.cloneStepConsent },
    { n: 3, label: t.cloneStepSpeak },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bg-subtle">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="khmer-text text-xs font-semibold uppercase tracking-[0.14em] text-navy/55">
            {t.cloneNav}
          </p>
          <h1 className="khmer-text mt-2 text-3xl font-bold text-navy sm:text-4xl">
            {t.cloneTitle}
          </h1>
          <p className="khmer-text mt-2 text-sm leading-relaxed text-text-muted sm:text-base">
            {t.cloneSubtitle}
          </p>
        </div>

        <ol className="mb-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => {
            const done =
              (step.n === 1 && hasReference) ||
              (step.n === 2 && consent) ||
              (step.n === 3 && Boolean(audioUrl));
            const current = activeStep === step.n;
            return (
              <li
                key={step.n}
                className={[
                  "rounded-[6px] border px-4 py-3 transition",
                  current
                    ? "border-navy/40 bg-navy text-white"
                    : done
                      ? "border-navy/20 bg-white text-navy"
                      : "border-border bg-white/70 text-text-muted",
                ].join(" ")}
              >
                <p className="khmer-text text-xs font-semibold opacity-80">
                  {t.cloneStepOf(step.n, steps.length)}
                </p>
                <p className="khmer-text mt-1 text-sm font-semibold">{step.label}</p>
              </li>
            );
          })}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="space-y-5">
            <section
              className={[
                "gov-card space-y-4 p-5 sm:p-6",
                activeStep === 1 ? "ring-1 ring-navy/20" : "",
              ].join(" ")}
            >
              <div>
                <h2 className="khmer-text text-base font-semibold text-navy">
                  1. {t.cloneStepReference}
                </h2>
                <p className="khmer-text mt-1 text-sm text-text-muted">
                  {t.ttsCloneHint}
                </p>
              </div>

              <div className="space-y-2">
                <p className="khmer-text text-sm font-medium text-text">
                  {t.cloneSavedVoices}
                </p>
                {loadingVoices ? (
                  <p className="khmer-text text-sm text-text-muted">{t.loading}</p>
                ) : savedVoices.length === 0 ? (
                  <p className="khmer-text text-sm text-text-muted">
                    {t.cloneSavedVoicesEmpty}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {savedVoices.map((voice) => {
                      const active = selectedSavedVoiceId === voice.id;
                      return (
                        <li
                          key={voice.id}
                          className={[
                            "flex items-center gap-2 rounded-[6px] border px-3 py-2",
                            active
                              ? "border-navy/40 bg-navy/5"
                              : "border-border bg-white",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            disabled={loading || recording}
                            onClick={() => void selectSavedVoice(voice)}
                            className="khmer-text min-w-0 flex-1 text-left text-sm font-medium text-navy"
                          >
                            {voice.name}
                            <span className="mt-0.5 block truncate text-xs font-normal text-text-muted">
                              {voice.original_filename || t.cloneUseSaved}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={loading || recording}
                            onClick={() => void handleDeleteVoice(voice.id)}
                            className="khmer-text shrink-0 rounded px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          >
                            {t.cloneDeleteVoice}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <p className="khmer-text text-sm font-medium text-text">
                {t.cloneNewReference}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading || recording}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  {referenceFile ? t.ttsCloneChangeFile : t.ttsCloneUpload}
                </button>
                {!recording ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={startRecording}
                    className="btn-secondary"
                  >
                    {t.ttsCloneRecord}
                  </button>
                ) : (
                  <button type="button" onClick={stopRecording} className="btn-primary">
                    {t.ttsCloneStop} ({recordSeconds}s)
                  </button>
                )}
                {hasReference && !recording && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setReference(null);
                      setSelectedSavedVoiceId(null);
                      setSelectedSavedName(null);
                      setConsent(false);
                    }}
                    className="btn-secondary"
                  >
                    {t.ttsCloneClear}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm"
                className="hidden"
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />

              {recording && (
                <p className="khmer-text text-sm font-medium text-navy">
                  {t.ttsCloneRecording}
                </p>
              )}

              {hasReference && referencePreviewUrl && (
                <div className="space-y-2 rounded-[6px] border border-border bg-bg-accent/50 p-3">
                  <p className="khmer-text text-sm font-medium text-text">
                    {selectedSavedVoiceId
                      ? `${t.cloneSelectedSaved}: ${selectedSavedName ?? ""}`
                      : `${t.ttsClonePreview}: ${referenceFile?.name ?? ""}`}
                  </p>
                  <audio
                    controls
                    preload="metadata"
                    src={referencePreviewUrl}
                    className="h-10 w-full"
                  >
                    {t.audioUnsupported}
                  </audio>
                </div>
              )}

              {referenceFile && !selectedSavedVoiceId && !recording && (
                <div className="space-y-2 rounded-[6px] border border-dashed border-navy/25 bg-white p-3">
                  <p className="khmer-text text-sm font-medium text-navy">
                    {t.cloneSaveVoice}
                  </p>
                  <label className="block space-y-1.5">
                    <span className="khmer-text text-xs font-medium text-text-muted">
                      {t.cloneSaveVoiceName}
                    </span>
                    <input
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      disabled={loading || savingVoice}
                      placeholder={t.cloneSaveVoicePlaceholder}
                      className="gov-input"
                      maxLength={80}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={loading || savingVoice || !saveName.trim()}
                    onClick={() => void handleSaveVoice()}
                    className="btn-secondary"
                  >
                    {savingVoice ? t.cloneSavingVoice : t.cloneSaveVoiceAction}
                  </button>
                </div>
              )}
            </section>

            <section
              className={[
                "gov-card space-y-4 p-5 sm:p-6",
                activeStep === 2 ? "ring-1 ring-navy/20" : "",
                !hasReference ? "opacity-60" : "",
              ].join(" ")}
            >
              <h2 className="khmer-text text-base font-semibold text-navy">
                2. {t.cloneStepConsent}
              </h2>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={loading || recording || !hasReference}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="khmer-text text-sm leading-relaxed text-text">
                  {t.ttsCloneConsent}
                </span>
              </label>
            </section>

            <section
              className={[
                "gov-card space-y-4 p-5 sm:p-6",
                activeStep === 3 ? "ring-1 ring-navy/20" : "",
                !(hasReference && consent) ? "opacity-60" : "",
              ].join(" ")}
            >
              <h2 className="khmer-text text-base font-semibold text-navy">
                3. {t.cloneStepSpeak}
              </h2>

              <label className="block space-y-1.5">
                <span className="khmer-text text-sm font-medium text-text">
                  {t.language}
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={loading || recording || !(hasReference && consent)}
                  className="gov-input"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="khmer-text text-sm font-medium text-text">
                    {t.ttsComposeLabel}
                  </span>
                  <span
                    className={[
                      "text-xs tabular-nums",
                      overLimit ? "font-semibold text-red-700" : "text-text-muted",
                    ].join(" ")}
                  >
                    {t.ttsCharCount(text.length, MAX_CHARS)}
                  </span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading || recording || !(hasReference && consent)}
                  rows={8}
                  dir="auto"
                  placeholder={t.ttsPlaceholder}
                  className="gov-input khmer-text min-h-[12rem] resize-y leading-relaxed"
                />
                {overLimit && (
                  <p className="khmer-text text-sm text-red-700">
                    {t.ttsOverLimit(MAX_CHARS)}
                  </p>
                )}
                {!overLimit && text.trim().length > CHUNK_MAX && (
                  <p className="khmer-text text-xs leading-relaxed text-text-muted">
                    {t.cloneLongHint}{" "}
                    (
                    {splitCloneText(text.trim(), CHUNK_TARGET, CHUNK_MAX).length}{" "}
                    parts)
                  </p>
                )}
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="btn-primary w-full sm:w-auto"
              >
                {loading ? t.ttsCloning : t.cloneGenerate}
              </button>
            </section>

            {error && (
              <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {error}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            {loading && (
              <SpeechProgressPanel
                label={progressLabel()}
                progress={progress}
                etaSeconds={progressEtaSeconds}
              />
            )}

            <div className="gov-card p-5 sm:p-6">
              <h2 className="khmer-text text-sm font-semibold text-navy">
                {t.ttsResult}
              </h2>
              {audioUrl ? (
                <div className="mt-4 space-y-4">
                  <audio
                    ref={audioRef}
                    controls
                    preload="metadata"
                    src={audioUrl}
                    className="h-10 w-full"
                  >
                    {t.audioUnsupported}
                  </audio>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={loading || recording}
                    className="btn-secondary w-full"
                  >
                    {t.ttsDownload}
                  </button>
                </div>
              ) : (
                <p className="khmer-text mt-3 text-sm leading-relaxed text-text-muted">
                  {t.cloneResultEmpty}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
