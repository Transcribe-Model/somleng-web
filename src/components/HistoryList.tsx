"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { formatDate, formatTimestamp } from "@/lib/api";
import { jobStatusBadge, km } from "@/lib/km";
import {
  estimateRemainingSeconds,
  formatEtaSeconds,
  resolveJobProgressPercent,
} from "@/lib/progress";
import type { JobStatus, JobSummary } from "@/types/transcribe";

interface HistoryListProps {
  jobs: JobSummary[];
  selectedId: string | null;
  loading?: boolean;
  onSelect: (job: JobSummary) => void;
  onDelete: (job: JobSummary) => Promise<void>;
}

function statusColor(status: JobStatus): string {
  switch (status) {
    case "completed":
      return "bg-success/15 text-success";
    case "failed":
      return "bg-red-100 text-red-700";
    case "processing":
    case "queued":
      return "bg-bg-accent text-navy";
    default:
      return "bg-bg-accent text-text-muted";
  }
}

function isInProgress(status: JobStatus): boolean {
  return status === "queued" || status === "processing";
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export function HistoryList({
  jobs,
  selectedId,
  loading,
  onSelect,
  onDelete,
}: HistoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JobSummary | null>(null);

  function requestDelete(job: JobSummary) {
    if (deletingId) return;
    setPendingDelete(job);
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingId) return;

    const job = pendingDelete;
    setDeletingId(job.id);
    try {
      await onDelete(job);
      setPendingDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="khmer-text px-2 py-4 text-center text-sm text-text-muted">
        {km.noHistory}
      </p>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={pendingDelete != null}
        title={km.deleteTitle}
        message={km.deleteConfirm}
        detail={pendingDelete?.original_filename ?? km.untitledAudio}
        confirmLabel={km.delete}
        cancelLabel={km.cancel}
        loading={deletingId != null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deletingId) setPendingDelete(null);
        }}
      />

      <ul className="space-y-1">
      {jobs.map((job) => {
        const active = job.id === selectedId;
        const inProgress = isInProgress(job.status);
        const isDeleting = deletingId === job.id;
        const percent = resolveJobProgressPercent(
          job.status,
          job.progress_percent ?? 0,
        );
        const startedAt = job.created_at
          ? new Date(job.created_at).getTime()
          : null;
        const eta =
          inProgress && startedAt
            ? estimateRemainingSeconds(startedAt, percent)
            : null;

        return (
          <li
            key={job.id}
            className={[
              "rounded-[6px] transition",
              active ? "bg-bg-accent ring-1 ring-navy/20" : "hover:bg-bg-subtle",
            ].join(" ")}
          >
            <div className="flex items-start gap-1">
              <button
                type="button"
                onClick={() => onSelect(job)}
                disabled={isDeleting}
                className="min-w-0 flex-1 px-3 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium text-navy">
                    {job.original_filename ?? km.untitledAudio}
                  </p>
                  <span
                    className={[
                      "khmer-text shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                      statusColor(job.status),
                    ].join(" ")}
                  >
                    {jobStatusBadge(job.status)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                  <span>{formatDate(job.created_at)}</span>
                  {job.duration_seconds != null && (
                    <>
                      <span>·</span>
                      <span>{formatTimestamp(job.duration_seconds)}</span>
                    </>
                  )}
                </div>

                {inProgress && (
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="khmer-text text-xs text-text-muted">
                        {km.progressLabel(percent)}
                      </span>
                      {eta != null && (
                        <span className="khmer-text text-xs text-text-muted">
                          {km.estimatedRemaining(formatEtaSeconds(eta))}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-navy transition-[width] duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {!inProgress && job.text_preview && (
                  <p className="khmer-text mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
                    {job.text_preview}
                  </p>
                )}
              </button>

              <button
                type="button"
                onClick={() => requestDelete(job)}
                disabled={isDeleting || deletingId != null}
                aria-label={km.delete}
                title={km.delete}
                className="khmer-text mt-3 mr-2 shrink-0 rounded p-2 text-text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="block h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                ) : (
                  <TrashIcon />
                )}
              </button>
            </div>
          </li>
        );
      })}
      </ul>
    </>
  );
}
