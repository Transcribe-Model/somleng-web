"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { text: t, language, setLanguage } = useLanguage();

  return (
    <AuthGuard>
      <div className="flex h-dvh overflow-hidden bg-bg-subtle">
        <DashboardSidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-[6px] text-navy hover:bg-bg-accent"
              aria-label={t.dashboardMenu}
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="khmer-text flex-1 text-sm font-semibold text-navy">សម្លេងខ្មែរ</span>
            <div className="flex items-center rounded-full border border-border bg-bg-accent p-1">
              {(["km", "en"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-semibold transition",
                    language === option ? "bg-white text-navy shadow-sm" : "text-text-muted",
                  ].join(" ")}
                >
                  {option === "km" ? "ខ្មែរ" : "EN"}
                </button>
              ))}
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
