"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface AudioPlayerProps {
  src: string;
  filename?: string | null;
}

export function AudioPlayer({ src, filename }: AudioPlayerProps) {
  const { text: t } = useLanguage();
  return (
    <div className="gov-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="khmer-text text-sm font-semibold text-navy">{t.originalAudio}</p>
          {filename && (
            <p className="truncate text-xs text-text-muted">{filename}</p>
          )}
        </div>
      </div>
      <audio controls preload="metadata" src={src} className="h-10 w-full">
        {t.audioUnsupported}
      </audio>
    </div>
  );
}
