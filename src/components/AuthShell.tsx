"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuthShellProps {
  mode: "login" | "register";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ mode, title, subtitle, children }: AuthShellProps) {
  const isLogin = mode === "login";
  const { text: t } = useLanguage();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Left — branding */}
      <aside className="relative flex min-h-[16rem] flex-col items-center justify-center overflow-hidden bg-navy px-8 py-12 lg:min-h-dvh lg:w-1/2 lg:px-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 30%, rgba(184,142,79,0.22), transparent 70%)",
          }}
        />
        <div className="relative flex max-w-md flex-col items-center text-center">
          <BrandLogo size="lg" href="/" onDark />
          <p className="khmer-text mt-8 text-lg leading-relaxed text-text-light">
            {t.authWelcome}
          </p>
          <p className="khmer-text mt-3 text-sm text-white/60">{t.authTagline}</p>
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex min-h-0 flex-1 flex-col bg-bg lg:w-1/2">
        <div className="flex items-center justify-end gap-3 px-6 py-5 sm:px-10">
          <Link
            href="/login"
            className={[
              "khmer-text rounded-[6px] px-4 py-2 text-sm font-medium transition",
              isLogin
                ? "text-navy"
                : "text-text-muted hover:bg-bg-subtle hover:text-navy",
            ].join(" ")}
          >
            {t.signIn}
          </Link>
          <Link
            href="/register"
            className={[
              "khmer-text rounded-[6px] px-4 py-2 text-sm font-semibold transition",
              isLogin
                ? "bg-navy text-white hover:bg-navy-dark"
                : "bg-navy text-white ring-2 ring-gold/50",
            ].join(" ")}
          >
            {t.register}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10 lg:pb-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <BrandLogo size="md" href="/" />
            </div>

            <h1 className="khmer-text text-2xl font-bold text-navy sm:text-3xl">
              {title}
            </h1>
            <p className="khmer-text mt-2 text-sm text-text-muted sm:text-base">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
