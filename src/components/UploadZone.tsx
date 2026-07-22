"use client";

import { useCallback, useRef, useState } from "react";
import { km } from "@/lib/km";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile: File | null;
}

const ACCEPTED = "audio/*,.mp3,.wav,.m4a,.flac,.ogg,.webm";

export function UploadZone({
  onFileSelect,
  disabled,
  selectedFile,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (!disabled) handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={[
        "cursor-pointer rounded-[6px] border-2 border-dashed p-8 text-center transition-all",
        dragging
          ? "border-navy bg-bg-accent"
          : "border-border-strong bg-bg-subtle hover:border-navy/40 hover:bg-bg-accent/50",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-accent">
        <svg
          className="h-7 w-7 text-navy"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      {selectedFile ? (
        <>
          <p className="font-semibold text-text">{selectedFile.name}</p>
          <p className="khmer-text mt-1 text-sm text-text-muted">
            {(selectedFile.size / 1024).toFixed(1)} KB — {km.changeFile}
          </p>
        </>
      ) : (
        <>
          <p className="khmer-text font-semibold text-text">{km.dropAudio}</p>
          <p className="khmer-text mt-1 text-sm text-text-muted">{km.browseAudio}</p>
        </>
      )}
    </div>
  );
}
