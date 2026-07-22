"use client";

import { km } from "@/lib/km";

interface AudioPlayerProps {
  src: string;
  filename?: string | null;
}

export function AudioPlayer({ src, filename }: AudioPlayerProps) {
  return (
    <div className="gov-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="khmer-text text-sm font-semibold text-navy">{km.originalAudio}</p>
          {filename && (
            <p className="truncate text-xs text-text-muted">{filename}</p>
          )}
        </div>
      </div>
      <audio controls preload="metadata" src={src} className="h-10 w-full">
        {km.audioUnsupported}
      </audio>
    </div>
  );
}
