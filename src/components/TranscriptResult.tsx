"use client";

import { useState } from "react";
import { formatTimestamp } from "@/lib/api";
import type { TranscribeResponse } from "@/types/transcribe";
import { km } from "@/lib/km";

function formatLanguage(code: string | null): string {
  if (!code) return "";
  if (code.startsWith("km")) return km.languageKhmer;
  if (code.startsWith("en")) return km.languageEnglish;
  return code;
}

function resultMeta(result: TranscribeResponse): string {
  const parts: string[] = [];
  const lang = formatLanguage(result.language);
  if (lang) parts.push(lang);
  if (result.duration_seconds != null) {
    parts.push(formatTimestamp(result.duration_seconds));
  }
  return parts.join(" · ");
}

function SegmentsDropdown({ result }: { result: TranscribeResponse }) {
  const [open, setOpen] = useState(false);

  if (result.segments.length === 0) return null;

  return (
    <div className="gov-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-bg-subtle"
      >
        <span className="khmer-text text-sm font-semibold text-navy">
          {km.segments}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {result.segments.length}
          </span>
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

export function TranscriptResult({
  result,
  onCopy,
  copied,
  embedded = false,
}: TranscriptResultProps) {
  if (embedded) {
    return (
      <div className="animate-in space-y-6">
        <div className="gov-card p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <p className="khmer-text text-xs text-text-muted">{resultMeta(result)}</p>
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="btn-secondary khmer-text shrink-0 px-3 py-1.5 text-sm"
              >
                {copied ? km.copied : km.copyText}
              </button>
            )}
          </div>
          <p
            className="khmer-text text-xl leading-relaxed text-text md:text-2xl"
            dir="auto"
          >
            {result.text || (
              <span className="text-text-muted italic">{km.noSpeech}</span>
            )}
          </p>
        </div>

        <SegmentsDropdown result={result} />
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      <div className="gov-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="khmer-text text-sm font-semibold text-navy">
              {km.transcriptionResult}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{resultMeta(result)}</p>
          </div>
          <button type="button" onClick={onCopy} className="btn-secondary khmer-text">
            {copied ? km.copied : km.copyText}
          </button>
        </div>

        <p
          className="khmer-text text-xl leading-relaxed text-text md:text-2xl"
          dir="auto"
        >
          {result.text || (
            <span className="text-text-muted italic">{km.noSpeech}</span>
          )}
        </p>
      </div>

      <SegmentsDropdown result={result} />
    </div>
  );
}
