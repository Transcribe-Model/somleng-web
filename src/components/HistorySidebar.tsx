"use client";

import { HistoryList } from "@/components/HistoryList";
import { km } from "@/lib/km";
import type { JobSummary } from "@/types/transcribe";

interface HistorySidebarProps {
  open: boolean;
  jobs: JobSummary[];
  selectedId: string | null;
  loading?: boolean;
  onClose: () => void;
  onSelect: (job: JobSummary) => void;
  onDelete: (job: JobSummary) => Promise<void>;
}

export function HistorySidebar({
  open,
  jobs,
  selectedId,
  loading,
  onClose,
  onSelect,
  onDelete,
}: HistorySidebarProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={km.closeHistory}
        className="fixed inset-0 z-40 bg-navy/20 backdrop-blur-[1px] lg:bg-navy/10"
        onClick={onClose}
      />

      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-bg shadow-xl animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-sidebar-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2
              id="history-sidebar-title"
              className="khmer-text text-lg font-semibold text-navy"
            >
              {km.historyTitle}
            </h2>
            <p className="khmer-text mt-1 text-sm text-text-muted">
              {km.historySubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary khmer-text shrink-0 px-3 py-2"
            aria-label={km.closeHistory}
          >
            {km.closeHistory}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <HistoryList
            jobs={jobs}
            selectedId={selectedId}
            loading={loading}
            onSelect={(job) => {
              onSelect(job);
              onClose();
            }}
            onDelete={onDelete}
          />
        </div>
      </aside>
    </>
  );
}
