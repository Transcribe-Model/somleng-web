"use client";

import { useEffect, useRef, useState } from "react";
import { cloneSpeech, synthesizeSpeech } from "@/lib/api";
import { km } from "@/lib/km";

const MAX_CHARS = 4500;
const MAX_RECORD_MS = 12_000;

const LANGUAGES = [
  { code: "km-KH", label: km.languageKhmer },
  { code: "en-US", label: km.languageEnglish },
];

type VoiceMode = "default" | "clone";

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

export function TtsApp() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("km-KH");
  const [mode, setMode] = useState<VoiceMode>("default");
  const [loading, setLoading] = useState(false);
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
      /* autoplay may be blocked; controls remain available */
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
      setError(km.ttsCloneUnsupportedMic);
      return;
    }

    const mimeType = pickRecorderMimeType();
    if (typeof MediaRecorder === "undefined") {
      setError(km.ttsCloneUnsupportedMic);
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
      setError(km.ttsCloneMicDenied);
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
  const canSpeak =
    trimmed.length > 0 &&
    !overLimit &&
    !loading &&
    !recording &&
    (mode === "default" || (Boolean(referenceFile) && consent));

  async function handleSpeak() {
    if (!canSpeak) return;

    if (mode === "clone") {
      if (!referenceFile) {
        setError(km.ttsCloneNeedReference);
        return;
      }
      if (!consent) {
        setError(km.ttsCloneNeedConsent);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const blob =
        mode === "clone" && referenceFile
          ? await cloneSpeech(trimmed, referenceFile, {
              language,
              voiceConsent: consent,
              filename: referenceFile.name,
            })
          : await synthesizeSpeech(trimmed, language);

      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : mode === "clone"
            ? km.ttsCloneFailed
            : km.ttsFailed,
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = mode === "clone" ? "cloned-speech.mp3" : "speech.mp3";
    a.click();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bg-subtle">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="khmer-text text-2xl font-bold text-navy">{km.ttsTitle}</h1>
          <p className="khmer-text mt-1 text-sm text-text-muted">{km.ttsSubtitle}</p>
        </div>

        <div className="gov-card space-y-5 p-5 sm:p-6">
          <fieldset className="space-y-2">
            <legend className="khmer-text text-sm font-medium text-text">
              {km.ttsModeLabel}
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading || recording}
                onClick={() => setMode("default")}
                className={[
                  "khmer-text rounded-[6px] border px-3 py-2 text-sm font-medium transition",
                  mode === "default"
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-text hover:bg-bg-accent",
                ].join(" ")}
              >
                {km.ttsModeDefault}
              </button>
              <button
                type="button"
                disabled={loading || recording}
                onClick={() => setMode("clone")}
                className={[
                  "khmer-text rounded-[6px] border px-3 py-2 text-sm font-medium transition",
                  mode === "clone"
                    ? "border-navy bg-navy text-white"
                    : "border-border bg-white text-text hover:bg-bg-accent",
                ].join(" ")}
              >
                {km.ttsModeClone}
              </button>
            </div>
          </fieldset>

          <label className="block space-y-1.5">
            <span className="khmer-text text-sm font-medium text-text">{km.language}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading || recording}
              className="gov-input"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          {mode === "clone" && (
            <div className="space-y-3 rounded-[6px] border border-border bg-bg-accent/40 p-4">
              <p className="khmer-text text-sm text-text-muted">{km.ttsCloneHint}</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading || recording}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                >
                  {referenceFile ? km.ttsCloneChangeFile : km.ttsCloneUpload}
                </button>
                {!recording ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={startRecording}
                    className="btn-secondary"
                  >
                    {km.ttsCloneRecord}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="btn-primary"
                  >
                    {km.ttsCloneStop} ({recordSeconds}s)
                  </button>
                )}
                {referenceFile && !recording && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setReference(null)}
                    className="btn-secondary"
                  >
                    {km.ttsCloneClear}
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
                  {km.ttsCloneRecording}
                </p>
              )}

              {referenceFile && referencePreviewUrl && (
                <div className="space-y-2">
                  <p className="khmer-text text-sm font-medium text-text">
                    {km.ttsClonePreview}:{" "}
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
                    {km.audioUnsupported}
                  </audio>
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={loading || recording}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1"
                />
                <span className="khmer-text text-sm text-text">{km.ttsCloneConsent}</span>
              </label>
            </div>
          )}

          <label className="block space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="khmer-text text-sm font-medium text-text">{km.ttsTitle}</span>
              <span
                className={[
                  "text-xs tabular-nums",
                  overLimit ? "font-semibold text-red-700" : "text-text-muted",
                ].join(" ")}
              >
                {km.ttsCharCount(text.length, MAX_CHARS)}
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading || recording}
              rows={10}
              dir="auto"
              placeholder={km.ttsPlaceholder}
              className="gov-input khmer-text min-h-[12rem] resize-y leading-relaxed"
            />
            {overLimit && (
              <p className="khmer-text text-sm text-red-700">{km.ttsOverLimit(MAX_CHARS)}</p>
            )}
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={!canSpeak}
              className="btn-primary"
            >
              {loading
                ? mode === "clone"
                  ? km.ttsCloning
                  : km.ttsSpeaking
                : km.ttsSpeak}
            </button>
            {audioUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={loading || recording}
                className="btn-secondary"
              >
                {km.ttsDownload}
              </button>
            )}
          </div>

          {error && (
            <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          )}
        </div>

        {audioUrl && (
          <div className="gov-card mt-6 p-4">
            <p className="khmer-text mb-3 text-sm font-semibold text-navy">
              {km.ttsResult}
            </p>
            <audio
              ref={audioRef}
              controls
              preload="metadata"
              src={audioUrl}
              className="h-10 w-full"
            >
              {km.audioUnsupported}
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
