"use client";

import { useState } from "react";
import { useLanguage, type TranslationText } from "@/contexts/LanguageContext";
import { formatTimestamp } from "@/lib/api";
import type { Segment, TranscribeResponse } from "@/types/transcribe";
import { km } from "@/lib/km";

function formatLanguage(code: string | null, langText: TranslationText = km): string {
  if (!code) return "";
  if (code.startsWith("km")) return langText.languageKhmer;
  if (code.startsWith("en")) return langText.languageEnglish;
  return code;
}

function resultMeta(result: TranscribeResponse, langText: TranslationText = km): string {
  const parts: string[] = [];
  const lang = formatLanguage(result.language, langText);
  if (lang) parts.push(lang);
  if (result.duration_seconds != null) {
    parts.push(formatTimestamp(result.duration_seconds));
  }
  const speakers = new Set(
    result.segments.map((s) => s.speaker).filter(Boolean),
  );
  if (speakers.size > 0) {
    parts.push(langText.speakerCount(speakers.size));
  }
  return parts.join(" · ");
}

function hasSpeakerLabels(segments: Segment[]): boolean {
  return segments.some((s) => Boolean(s.speaker));
}

function speakerAccent(speaker: string | null | undefined): string {
  if (!speaker) return "border-border bg-bg-subtle text-navy";
  const n = Number.parseInt(speaker, 10);
  if (n % 2 === 0) {
    return "border-gold/40 bg-gold/10 text-navy";
  }
  return "border-navy/20 bg-navy/5 text-navy";
}

function SpeakerConversation({ segments, langText }: { segments: Segment[]; langText: TranslationText }) {
  return (
    <div className="space-y-4">
      {segments.map((seg, i) => (
        <article
          key={i}
          className={[
            "rounded-[6px] border px-4 py-3",
            speakerAccent(seg.speaker),
          ].join(" ")}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="khmer-text text-sm font-semibold">
              {seg.speaker ? langText.speakerLabel(seg.speaker) : langText.unknownSpeaker}
            </span>
            {(seg.start != null || seg.end != null) && (
              <span className="font-mono text-xs text-text-muted">
                {formatTimestamp(seg.start)}
                {seg.end != null && ` – ${formatTimestamp(seg.end)}`}
              </span>
            )}
          </div>
          <p className="khmer-text text-base leading-relaxed text-text md:text-lg" dir="auto">
            {seg.text}
          </p>
        </article>
      ))}
    </div>
  );
}

function PlainTranscript({ text, langText }: { text: string; langText: TranslationText }) {
  return (
    <p className="khmer-text text-lg leading-relaxed text-text md:text-xl" dir="auto">
      {text || <span className="text-text-muted italic">{langText.noSpeech}</span>}
    </p>
  );
}

function SegmentsDropdown({ result, langText }: { result: TranscribeResponse; langText: TranslationText }) {
  const [open, setOpen] = useState(false);
  if (result.segments.length === 0) return null;
  if (hasSpeakerLabels(result.segments)) return null;

  return (
    <div className="gov-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-bg-subtle"
      >
        <span className="khmer-text text-sm font-semibold text-navy">
          {langText.segments}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{result.segments.length}</span>
          <svg
            className={[
              "h-4 w-4 shrink-0 text-navy/60 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border px-6 pb-4">
          {result.segments.map((seg, i) => (
            <li key={i} className="flex gap-4 py-3 first:pt-4 last:pb-0">
              <span className="shrink-0 pt-0.5 font-mono text-xs text-gold">
                {formatTimestamp(seg.start)}
                {seg.end != null && ` – ${formatTimestamp(seg.end)}`}
              </span>
              <span className="khmer-text text-base text-text" dir="auto">
                {seg.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface TranscriptResultProps {
  result: TranscribeResponse;
  onCopy?: () => void;
  copied?: boolean;
  embedded?: boolean;
}

export function formatTranscriptForCopy(result: TranscribeResponse, langText: TranslationText = km): string {
  if (hasSpeakerLabels(result.segments)) {
    return result.segments
      .map((seg) => {
        const who = seg.speaker ? langText.speakerLabel(seg.speaker) : langText.unknownSpeaker;
        const time =
          seg.start != null
            ? `[${formatTimestamp(seg.start)}${seg.end != null ? ` – ${formatTimestamp(seg.end)}` : ""}] `
            : "";
        return `${who} ${time}\n${seg.text}`;
      })
      .join("\n\n");
  }
  return result.text || "";
}

export function TranscriptResult({
  result,
  onCopy,
  copied,
  embedded = false,
}: TranscriptResultProps) {
  const { text: langText } = useLanguage();
  const showSpeakers = hasSpeakerLabels(result.segments);

  const body = showSpeakers ? (
    <SpeakerConversation segments={result.segments} langText={langText} />
  ) : (
    <PlainTranscript text={result.text} langText={langText} />
  );

  if (embedded) {
    return (
      <div className="animate-in space-y-6">
        <div className="gov-card p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="khmer-text text-xs text-text-muted">{resultMeta(result, langText)}</p>
              {showSpeakers && (
                <p className="khmer-text mt-1 text-sm font-medium text-navy">
                  {langText.speakerTranscript}
                </p>
              )}
            </div>
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="btn-secondary khmer-text shrink-0 px-3 py-1.5 text-sm"
              >
                {copied ? langText.copied : langText.copyText}
              </button>
            )}
          </div>
          {body}
        </div>

        <SegmentsDropdown result={result} langText={langText} />
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      <div className="gov-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="khmer-text text-sm font-semibold text-navy">
              {showSpeakers ? langText.speakerTranscript : langText.transcriptionResult}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{resultMeta(result, langText)}</p>
          </div>
          <button type="button" onClick={onCopy} className="btn-secondary khmer-text">
            {copied ? langText.copied : langText.copyText}
          </button>
        </div>
        {body}
      </div>

      <SegmentsDropdown result={result} langText={langText} />
    </div>
  );
}
