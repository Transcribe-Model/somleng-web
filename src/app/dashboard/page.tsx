"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const CARDS = [
  {
    href: "/dashboard/transcribe",
    titleKey: "transcribeNav" as const,
    descKey: "transcribeCardDesc" as const,
  },
  {
    href: "/dashboard/tts",
    titleKey: "ttsNav" as const,
    descKey: "ttsCardDesc" as const,
  },
  {
    href: "/dashboard/clone",
    titleKey: "cloneNav" as const,
    descKey: "cloneCardDesc" as const,
  },
  {
    href: "/dashboard/history",
    titleKey: "historyNav" as const,
    descKey: "historyCardDesc" as const,
  },
];

export default function DashboardPage() {
  const { text: t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 min-h-0 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="khmer-text text-2xl font-bold text-navy">{t.dashboardTitle}</h1>
      <p className="khmer-text mt-1 text-sm text-text-muted">{t.dashboardSubtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="gov-card block p-5 transition hover:border-navy/30 hover:shadow-sm"
          >
            <h2 className="khmer-text text-lg font-semibold text-navy">{t[card.titleKey]}</h2>
            <p className="khmer-text mt-2 text-sm text-text-muted">{t[card.descKey]}</p>
            <span className="khmer-text mt-4 inline-flex text-sm font-semibold text-navy">
              {t.dashboardOpen} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
