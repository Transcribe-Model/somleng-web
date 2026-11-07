"use client";

import { useEffect, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  estimateRemainingSeconds,
} from "@/lib/progress";
import { SpeechProgressPanel } from "@/components/SpeechProgressPanel";

const MAX_CHARS = 4500;

function estimateTtsMs(charCount: number): number {
  const base = 3500;
  return Math.min(120_000, Math.max(base, base + charCount * 12));
}

export function TtsApp() {
  const { text: t } = useLanguage();
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("km-KH");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStartedAt, setProgressStartedAt] = useState<number | null>(null);
  const [progressNow, setProgressNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (!audioUrl) return;
    const el = audioRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {
      /* autoplay may be blocked */
    });
  }, [audioUrl]);

  const trimmed = text.trim();
  const overLimit = text.length > MAX_CHARS;
  const canSpeak = trimmed.length > 0 && !overLimit && !loading;

  useEffect(() => {
    if (!loading || progressStartedAt == null) return;

    const estimatedMs = estimateTtsMs(trimmed.length || 1);
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

  async function handleSpeak() {
    if (!canSpeak) return;

    setLoading(true);
    setProgress(5);
    setProgressStartedAt(Date.now());
    setError(null);

    try {
      const blob = await synthesizeSpeech(trimmed, language);
      setProgress(100);
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.ttsFailed);
    } finally {
      setLoading(false);
      setProgressStartedAt(null);
      window.setTimeout(() => setProgress(0), 400);
    }
  }

  function progressLabel(): string {
    if (progress < 20) return t.ttsPreparing;
    if (progress < 85) return t.ttsSynthesizing;
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
    a.download = "speech.mp3";
    a.click();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-bg-subtle">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="khmer-text text-xs font-semibold uppercase tracking-[0.14em] text-navy/55">
            {t.ttsModeDefault}
          </p>
          <h1 className="khmer-text mt-2 text-3xl font-bold text-navy sm:text-4xl">
            {t.ttsTitle}
          </h1>
          <p className="khmer-text mt-2 text-sm leading-relaxed text-text-muted sm:text-base">
            {t.ttsSubtitle}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <section className="gov-card space-y-5 p-5 sm:p-6">
            <label className="block space-y-1.5">
              <span className="khmer-text text-sm font-medium text-text">
                {t.language}
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
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
                disabled={loading}
                rows={12}
                dir="auto"
                placeholder={t.ttsPlaceholder}
                className="gov-input khmer-text min-h-[16rem] resize-y leading-relaxed"
              />
              {overLimit && (
                <p className="khmer-text text-sm text-red-700">
                  {t.ttsOverLimit(MAX_CHARS)}
                </p>
              )}
            </label>

            <button
              type="button"
              onClick={handleSpeak}
              disabled={!canSpeak}
              className="btn-primary w-full sm:w-auto"
            >
              {loading ? t.ttsSpeaking : t.ttsSpeak}
            </button>

            {error && (
              <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {error}
              </div>
            )}
          </section>

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
                    disabled={loading}
                    className="btn-secondary w-full"
                  >
                    {t.ttsDownload}
                  </button>
                </div>
              ) : (
                <p className="khmer-text mt-3 text-sm leading-relaxed text-text-muted">
                  {t.ttsResultEmpty}
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
