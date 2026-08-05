"use client";

import { useEffect, useState } from "react";
import type { JobStatus } from "@/types/transcribe";
import { jobStatusLabel } from "@/lib/api";
import { km } from "@/lib/km";
import {
  estimateRemainingSeconds,
  formatEtaSeconds,
  resolveJobProgressPercent,
} from "@/lib/progress";

interface JobProgressProps {
  status: JobStatus;
  progressPercent: number;
  startedAt: number | null;
}

export function JobProgress({
  status,
  progressPercent,
  startedAt,
}: JobProgressProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (status === "completed" || status === "failed") return null;

  const percent = resolveJobProgressPercent(status, progressPercent);
  const eta =
    startedAt != null
      ? estimateRemainingSeconds(startedAt, percent, now)
      : null;

  return (
    <div className="rounded-[6px] border border-border bg-bg-accent px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
          <p className="khmer-text truncate text-sm font-medium text-navy">
            {jobStatusLabel(status)}
          </p>
        </div>
        <span className="khmer-text shrink-0 text-sm font-semibold text-navy tabular-nums">
          {km.progressLabel(percent)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-navy transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="khmer-text mt-2 text-xs text-text-muted">
        {eta != null
          ? km.estimatedRemaining(formatEtaSeconds(eta))
          : km.calculatingEta}
      </p>
    </div>
  );
}
