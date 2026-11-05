"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { SiteHeader } from "@/components/SiteHeader";
import { TtsApp } from "@/components/TtsApp";

export function TtsShell() {
  return (
    <AuthGuard>
      <div className="flex h-dvh flex-col overflow-hidden">
        <SiteHeader />
        <TtsApp />
      </div>
    </AuthGuard>
  );
}
