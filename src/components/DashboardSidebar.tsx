"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const LINKS = [
  { href: "/dashboard", labelKey: "dashboardOverview" as const, end: true },
  { href: "/dashboard/transcribe", labelKey: "transcribeNav" as const, end: false },
  { href: "/dashboard/tts", labelKey: "ttsNav" as const, end: false },
];

function linkActive(pathname: string, href: string, end: boolean): boolean {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { text: t } = useLanguage();

  async function handleSignOut() {
    await signOut();
    onClose();
    router.push("/login");
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" onClick={onClose} className="khmer-text text-lg font-bold text-white">
          សម្លេងខ្មែរ
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {LINKS.map((item) => {
          const active = linkActive(pathname, item.href, item.end);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "khmer-text rounded-[6px] px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {t[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        {user?.email && (
          <p className="mb-2 truncate text-xs text-white/60">{user.email}</p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="khmer-text text-sm font-medium text-white/80 transition hover:text-white"
        >
          {t.signOut}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 bg-navy text-white lg:flex lg:flex-col">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={onClose}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(16rem,85vw)] flex-col bg-navy text-white shadow-xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
