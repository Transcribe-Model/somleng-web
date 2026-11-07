"use client";

import { useEffect, useRef, useState } from "react";
import { cloneSpeech } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { estimateRemainingSeconds } from "@/lib/progress";
import { SpeechProgressPanel } from "@/components/SpeechProgressPanel";

const MAX_CHARS = 1000;
const MAX_RECORD_MS = 12_000;

function estimateCloneMs(charCount: number): number {
  const base = 8000;
  return Math.min(120_000, Math.max(base, base + charCount * 28));
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
    setReferenceFile(file);
    setReferencePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
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
      stopRecordingCleanup();
      setRecording(false);
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
  const hasReference = Boolean(referenceFile);
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

    const estimatedMs = estimateCloneMs(trimmed.length || 1);
    const id = window.setInterval(() => {
      const now = Date.now();
      setProgressNow(now);
      const elapsed = now - progressStartedAt;
      const ratio = Math.min(1, elapsed / estimatedMs);
      const next = Math.min(92, Math.round(8 + ratio * 84));
      setProgress((prev) => Math.max(prev, next));
    }, 200);

    return () => window.clearInterval(id);
  }, [loading, progressStartedAt, trimmed.length]);

  async function handleGenerate() {
    if (!canGenerate || !referenceFile) {
      if (!referenceFile) setError(t.ttsCloneNeedReference);
      else if (!consent) setError(t.ttsCloneNeedConsent);
      return;
    }

    setLoading(true);
    setProgress(5);
    setProgressStartedAt(Date.now());
    setError(null);

    try {
      const blob = await cloneSpeech(trimmed, referenceFile, {
        language,
        voiceConsent: consent,
        filename: referenceFile.name,
      });
      setProgress(100);
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ttsCloneFailed);
    } finally {
      setLoading(false);
      setProgressStartedAt(null);
      window.setTimeout(() => setProgress(0), 400);
    }
  }

  function progressLabel(): string {
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
    a.download = "cloned-speech.mp3";
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
                {referenceFile && !recording && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setReference(null);
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

              {referenceFile && referencePreviewUrl && (
                <div className="space-y-2 rounded-[6px] border border-border bg-bg-accent/50 p-3">
                  <p className="khmer-text text-sm font-medium text-text">
                    {t.ttsClonePreview}:{" "}
                    <span className="font-normal text-text-muted">
                      {referenceFile.name}
                    </span>
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
