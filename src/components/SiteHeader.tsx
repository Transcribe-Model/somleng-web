"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { km } from "@/lib/km";

const NAV = [
  { href: "/", label: km.home },
  { href: "/transcribe", label: km.transcribeNav },
  { href: "/#features", label: km.navFeatures },
  { href: "/#how-it-works", label: km.navHow },
  { href: "/login", label: km.signIn },
  { href: "/register", label: km.register },
];

function isActive(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push("/login");
  }

  const navItems = NAV.filter((item) => {
    if (user && (item.href === "/login" || item.href === "/register")) return false;
    if (!user && item.href === "/login") return true;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 transition opacity-95 hover:opacity-100"
        >
          <Image
            src="/logo.png"
            alt="សម្លេងខ្មែរ"
            width={160}
            height={56}
            priority
            className="h-10 w-auto object-contain sm:h-12"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "khmer-text relative px-3 py-2 text-[0.9375rem] font-medium transition",
                  active ? "text-navy" : "text-text-muted hover:text-navy",
                ].join(" ")}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="khmer-text relative px-3 py-2 text-[0.9375rem] font-medium text-text-muted transition hover:text-navy"
            >
              {km.signOut}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/transcribe"
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition hover:bg-bg-accent"
            aria-label={km.searchAria}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-navy transition hover:bg-bg-accent lg:hidden"
            aria-label={km.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "khmer-text rounded-[6px] px-3 py-2.5 text-sm font-medium",
                    active ? "bg-bg-accent text-navy" : "text-text-muted",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            {!loading && user && (
              <>
                <p className="px-3 pt-2 text-xs text-text-muted">{user.email}</p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="khmer-text mt-1 rounded-[6px] px-3 py-2.5 text-left text-sm font-medium text-navy"
                >
                  {km.signOut}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
