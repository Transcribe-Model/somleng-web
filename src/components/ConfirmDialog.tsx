"use client";

import { km } from "@/lib/km";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  detail?: string | null;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel,
  cancelLabel,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={cancelLabel}
        className="fixed inset-0 z-[60] bg-navy/30 backdrop-blur-[1px]"
        onClick={loading ? undefined : onCancel}
      />

      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="gov-card w-full max-w-md p-6 shadow-xl animate-in">
          <h2
            id="confirm-dialog-title"
            className="khmer-text text-lg font-semibold text-navy"
          >
            {title}
          </h2>
          <p className="khmer-text mt-3 text-sm leading-relaxed text-text-muted">
            {message}
          </p>
          {detail && (
            <p className="mt-3 truncate rounded-[6px] border border-border bg-bg-subtle px-3 py-2 text-sm font-medium text-navy">
              {detail}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary khmer-text sm:min-w-[7rem]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="btn-danger khmer-text sm:min-w-[7rem]"
            >
              {loading ? km.deleting : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
