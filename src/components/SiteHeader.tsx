"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { km } from "@/lib/km";

const NAV = [
  { href: "/", label: km.home },
  { href: "/transcribe", label: km.transcribeNav },
];

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

  const userLabel = user?.email?.split("@")[0] ?? km.account;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-1">
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "khmer-text rounded-[6px] px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-bg-accent text-navy"
                    : "text-text-muted hover:bg-bg-subtle hover:text-navy",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          {!loading && user ? (
            <>
              <span className="ml-2 max-w-[8rem] truncate px-2 text-sm text-text-muted">
                {userLabel}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="khmer-text rounded-[6px] border border-border px-3 py-2 text-sm font-medium text-navy transition hover:bg-bg-subtle"
              >
                {km.signOut}
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link
                  href="/login"
                  className="khmer-text ml-2 rounded-[6px] px-3 py-2 text-sm font-medium text-navy transition hover:bg-bg-subtle"
                >
                  {km.signIn}
                </Link>
                <Link
                  href="/register"
                  className="khmer-text rounded-[6px] bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark"
                >
                  {km.register}
                </Link>
              </>
            )
          )}

          {user && (
            <Link
              href="/transcribe"
              className="khmer-text ml-1 rounded-[6px] bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark"
            >
              {km.getStarted}
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-border text-navy md:hidden"
          aria-label={km.menu}
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
        <div className="border-t border-border bg-bg px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
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

            {!loading && user ? (
              <>
                <p className="px-3 pt-2 text-xs text-text-muted">{user.email}</p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="khmer-text mt-2 rounded-[6px] border border-border px-3 py-2.5 text-sm font-medium text-navy"
                >
                  {km.signOut}
                </button>
              </>
            ) : (
              !loading && (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="khmer-text mt-2 rounded-[6px] px-3 py-2.5 text-sm font-medium text-navy"
                  >
                    {km.signIn}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="khmer-text rounded-[6px] bg-navy px-3 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    {km.register}
                  </Link>
                </>
              )
            )}

            {user && (
              <Link
                href="/transcribe"
                onClick={() => setOpen(false)}
                className="khmer-text mt-2 rounded-[6px] bg-navy px-3 py-2.5 text-center text-sm font-semibold text-white"
              >
                {km.startTranscribe}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
