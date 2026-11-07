"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

function getFooterColumns(t: ReturnType<typeof useLanguage>["text"]) {
  return [
    {
      title: t.footerNews,
      links: [
        { href: "/", label: t.home },
        { href: "/#features", label: t.navFeatures },
        { href: "/#how-it-works", label: t.navHow },
        { href: "/dashboard/transcribe", label: t.transcribeNav },
        { href: "/dashboard/tts", label: t.ttsNav },
        { href: "/dashboard/clone", label: t.cloneNav },
        { href: "/dashboard/history", label: t.historyNav },
        { href: "/login", label: t.signIn },
      ],
    },
    {
      title: t.footerArticles,
      links: [
        { href: "/#features", label: t.navFeatures },
        { href: "/dashboard/transcribe", label: t.transcribeNav },
        { href: "/dashboard/tts", label: t.ttsNav },
        { href: "/dashboard/clone", label: t.cloneNav },
        { href: "/dashboard/history", label: t.historyNav },
        { href: "/register", label: t.register },
        { href: "/#how-it-works", label: t.navHow },
        { href: "/", label: t.home },
      ],
    },
    {
      title: t.footerAbout,
      links: [
        { href: "/", label: t.home },
        { href: "/#features", label: t.navFeatures },
        { href: "/login", label: t.signIn },
        { href: "/register", label: t.register },
      ],
    },
  ] as const;
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-gold hover:text-gold"
    >
      {children}
    </a>
  );
}

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="khmer-text relative pb-3 text-sm font-semibold text-white">
      {children}
      <span className="absolute bottom-0 left-0 h-0.5 w-10 rounded-full bg-gold" />
    </h3>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { text: t } = useLanguage();
  const FOOTER_COLS = getFooterColumns(t);

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <p className="khmer-text max-w-xs text-sm leading-relaxed text-white/70">
              {t.footerTagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <SocialIcon href="https://facebook.com" label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.02H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.8 8.44-4.94 8.44-9.93z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://t.me" label="Telegram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21.94 2.3a1.25 1.25 0 00-1.28-.18L2.7 9.5c-.84.33-.83 1.54.02 1.85l4.4 1.6 1.7 5.45c.25.8 1.25 1.05 1.85.48l2.43-2.3 4.5 3.32c.7.52 1.7.13 1.9-.73l3.5-15.05a1.25 1.25 0 00-.66-1.82zM9.5 14.2l-.9 3.2-.95-3.05 8.2-5.05L9.5 14.2z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://youtube.com" label="YouTube">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 00.5 6.2 31.6 31.6 0 000 12a31.6 31.6 0 00.5 5.8 3.02 3.02 0 002.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 002.12-2.14A31.6 31.6 0 00-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="/#features" label="RSS">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M6.18 15.64a2.18 2.18 0 11.04 0zm0-4.36a6.54 6.54 0 016.54 6.54h-2.18a4.36 4.36 0 00-4.36-4.36v-2.18zm0-4.37A10.9 10.9 0 0117.1 17.82h-2.18A8.73 8.73 0 006.18 9.09V6.91z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <ColumnTitle>{col.title}</ColumnTitle>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="khmer-text text-sm text-white/65 transition hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-3">
            <ColumnTitle>{t.footerContact}</ColumnTitle>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${t.footerEmail}`} className="transition hover:text-gold">
                  {t.footerEmail}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.49a1 1 0 01-.5 1.21l-2.26 1.13a11.04 11.04 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
                </svg>
                <a href={`tel:${t.footerPhoneTel}`} className="transition hover:text-gold">
                  {t.footerPhone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="khmer-text">{t.footerAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative mt-8 pt-6 text-center">
          <div className="absolute inset-x-0 top-0 flex items-center">
            <span className="h-px flex-1 bg-white/15" />
            <span className="mx-3 h-1.5 w-1.5 rotate-45 bg-gold/80" />
            <span className="h-px flex-1 bg-white/15" />
          </div>
          <p className="khmer-text text-xs text-white/45">
            © {year} សម្លេងខ្មែរ | {t.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
