"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { SiteHeader } from "@/components/SiteHeader";
import { TranscribeApp } from "@/components/TranscribeApp";

export function TranscribeShell() {
  return (
    <AuthGuard>
      <div className="flex h-dvh flex-col overflow-hidden">
        <SiteHeader />
        <TranscribeApp />
      </div>
    </AuthGuard>
  );
}
