"use client";

import { formatTimestamp } from "@/lib/api";
import type { Segment, TranscribeResponse } from "@/types/transcribe";
import { km } from "@/lib/km";

const SPEAKER_PALETTE = [
  { bar: "bg-navy", badge: "bg-navy text-cream", soft: "bg-navy/[0.06]" },
  { bar: "bg-gold", badge: "bg-gold text-navy-dark", soft: "bg-gold/10" },
  { bar: "bg-[#2f6b5a]", badge: "bg-[#2f6b5a] text-cream", soft: "bg-[#2f6b5a]/10" },
  { bar: "bg-[#6b4c7a]", badge: "bg-[#6b4c7a] text-cream", soft: "bg-[#6b4c7a]/10" },
  { bar: "bg-[#8b4a3a]", badge: "bg-[#8b4a3a] text-cream", soft: "bg-[#8b4a3a]/10" },
  { bar: "bg-[#3a5f8b]", badge: "bg-[#3a5f8b] text-cream", soft: "bg-[#3a5f8b]/10" },
];

function speakerIndex(speaker: string | null | undefined): number {
  if (!speaker) return 0;
  const match = speaker.match(/(\d+)/);
  return match ? Math.max(0, Number.parseInt(match[1], 10) - 1) : 0;
}

function paletteFor(speaker: string | null | undefined) {
  return SPEAKER_PALETTE[speakerIndex(speaker) % SPEAKER_PALETTE.length];
}

function formatLanguage(code: string | null): string {
  if (!code) return "";
  if (code.startsWith("km")) return km.languageKhmer;
  if (code.startsWith("en")) return km.languageEnglish;
  return code;
}

function uniqueSpeakers(segments: Segment[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const seg of segments) {
    if (!seg.speaker || seen.has(seg.speaker)) continue;
    seen.add(seg.speaker);
    ordered.push(seg.speaker);
  }
  return ordered;
}

export function formatSpeakerTranscript(result: TranscribeResponse): string {
  const labeled = result.segments.filter((s) => s.speaker && s.text.trim());
  if (labeled.length === 0) return result.text ?? "";
  return labeled.map((s) => `${s.speaker}: ${s.text.trim()}`).join("\n\n");
}

interface SpeakerTranscriptResultProps {
  result: TranscribeResponse;
  onCopy?: () => void;
  copied?: boolean;
}

export function SpeakerTranscriptResult({
  result,
  onCopy,
  copied,
}: SpeakerTranscriptResultProps) {
  const turns = result.segments.filter((s) => s.text.trim());
  const speakers = uniqueSpeakers(turns);
  const count = result.speaker_count ?? speakers.length;

  const metaParts: string[] = [];
  const lang = formatLanguage(result.language);
  if (lang) metaParts.push(lang);
  if (count > 0) metaParts.push(km.speakerCount(count));
  if (result.duration_seconds != null) {
    metaParts.push(formatTimestamp(result.duration_seconds));
  }

  return (
    <div className="animate-in space-y-4">
      <div className="gov-card overflow-hidden">
        <div className="border-b border-border bg-bg-subtle px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div>
                <h3 className="khmer-text text-sm font-semibold text-navy">
                  {km.speakerTranscriptTitle}
                </h3>
                <p className="khmer-text mt-0.5 text-xs text-text-muted">
                  {metaParts.join(" · ") || km.speakerTranscriptSubtitle}
                </p>
              </div>
              {speakers.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label={km.speakersLegend}>
                  {speakers.map((speaker) => {
                    const tone = paletteFor(speaker);
                    return (
                      <li
                        key={speaker}
                        className={[
                          "khmer-text inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                          tone.badge,
                        ].join(" ")}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-current opacity-80"
                          aria-hidden
                        />
                        {speaker}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="btn-secondary khmer-text shrink-0 px-3 py-1.5 text-sm"
              >
                {copied ? km.copied : km.copySpeakerText}
              </button>
            )}
          </div>
        </div>

        {turns.length === 0 ? (
          <p className="khmer-text px-6 py-8 text-center text-text-muted italic">
            {km.noSpeech}
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {turns.map((turn, i) => {
              const tone = paletteFor(turn.speaker);
              const prev = i > 0 ? turns[i - 1] : null;
              const sameSpeaker = prev?.speaker === turn.speaker;

              return (
                <li
                  key={i}
                  className={[
                    "relative flex gap-0 transition-colors",
                    tone.soft,
                  ].join(" ")}
                >
                  <span
                    className={["w-1 shrink-0 self-stretch", tone.bar].join(" ")}
                    aria-hidden
                  />
                  <div
                    className={[
                      "flex min-w-0 flex-1 gap-3 px-4 py-3.5 sm:gap-4 sm:px-5",
                      sameSpeaker ? "pt-2" : "",
                    ].join(" ")}
                  >
                    <div className="w-[5.5rem] shrink-0 sm:w-28">
                      {!sameSpeaker && turn.speaker ? (
                        <span
                          className={[
                            "khmer-text inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                            tone.badge,
                          ].join(" ")}
                        >
                          {turn.speaker}
                        </span>
                      ) : (
                        <span className="sr-only">{turn.speaker}</span>
                      )}
                      <p className="mt-1.5 font-mono text-[11px] tabular-nums text-gold">
                        {formatTimestamp(turn.start)}
                        {turn.end != null && (
                          <span className="text-text-muted">
                            {" "}
                            – {formatTimestamp(turn.end)}
                          </span>
                        )}
                      </p>
                    </div>
                    <p
                      className="khmer-text min-w-0 flex-1 text-base leading-relaxed text-text sm:text-lg"
                      dir="auto"
                    >
                      {turn.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

export function hasSpeakerLabels(result: TranscribeResponse): boolean {
  return result.segments.some((s) => Boolean(s.speaker));
}
