"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { formatEtaSeconds } from "@/lib/progress";

export function SpeechProgressPanel({
  label,
  progress,
  etaSeconds,
}: {
  label: string;
  progress: number;
  etaSeconds: number | null;
}) {
  const { text: t } = useLanguage();

  return (
    <div className="rounded-[6px] border border-border bg-bg-accent px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
          <p className="khmer-text truncate text-sm font-medium text-navy">{label}</p>
        </div>
        <span className="khmer-text shrink-0 text-sm font-semibold text-navy tabular-nums">
          {t.progressLabel(progress)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-navy transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="khmer-text mt-2 text-xs text-text-muted">
        {etaSeconds != null
          ? t.estimatedRemaining(formatEtaSeconds(etaSeconds))
          : t.calculatingEta}
      </p>
    </div>
  );
}
