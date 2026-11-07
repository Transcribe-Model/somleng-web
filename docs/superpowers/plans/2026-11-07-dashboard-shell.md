# Dashboard Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After login, land users on `/dashboard` with a labeled collapsible sidebar and tool cards; keep the marketing top nav only on the landing page.

**Architecture:** Add an auth-gated `/dashboard` App Router tree with `DashboardShell` (sidebar + content). Reuse existing `TranscribeApp` and `TtsApp` under `/dashboard/transcribe` and `/dashboard/tts`. Replace old `/transcribe` and `/tts` pages with redirects. Marketing header/footer stay on `/` via `SiteLayout`.

**Tech Stack:** Next.js App Router, React client components, existing `AuthGuard` / `useAuth` / `useLanguage` / Tailwind utilities already in the project.

**Spec:** `docs/superpowers/specs/2026-11-07-dashboard-shell-design.md`

**Note on tests:** This repo has no unit test runner for UI. Verification steps are manual browser checks + `curl` redirect checks. Do not add a new test framework in this plan.

---

## File map

| File | Responsibility |
|---|---|
| `src/lib/km.ts` | Add dashboard i18n keys to both `km` and `en` |
| `src/components/DashboardSidebar.tsx` | Sidebar links, mobile drawer, sign out |
| `src/components/DashboardShell.tsx` | AuthGuard + sidebar chrome + main slot |
| `src/app/dashboard/layout.tsx` | Wrap dashboard routes in `DashboardShell` |
| `src/app/dashboard/page.tsx` | Overview tool cards |
| `src/app/dashboard/transcribe/page.tsx` | Render `TranscribeApp` |
| `src/app/dashboard/tts/page.tsx` | Render `TtsApp` |
| `src/app/transcribe/page.tsx` | Redirect to `/dashboard/transcribe` |
| `src/app/tts/page.tsx` | Redirect to `/dashboard/tts` |
| `src/app/login/page.tsx` | Redirect to `/dashboard` |
| `src/app/register/page.tsx` | Redirect to `/dashboard` |
| `src/components/SiteHeader.tsx` | Marketing nav only; Dashboard when logged in |
| `src/components/SiteFooter.tsx` | Point tool links at `/dashboard/...` |
| `src/app/page.tsx` | CTAs → `/login` or `/dashboard` |
| `src/components/TranscribeShell.tsx` | Delete or stop using (layout owns chrome) |
| `src/components/TtsShell.tsx` | Delete or stop using (layout owns chrome) |

---

### Task 1: Add dashboard i18n strings

**Files:**
- Modify: `src/lib/km.ts`

- [ ] **Step 1: Add keys to the Khmer `km` object**

Near `home` / `transcribeNav` / `ttsNav`, add:

```ts
dashboardNav: "ផ្ទាំងគ្រប់គ្រង",
dashboardTitle: "ផ្ទាំងគ្រប់គ្រង",
dashboardSubtitle: "ជ្រើសរើសឧបករណ៍ដើម្បីចាប់ផ្តើម",
dashboardOpen: "បើក",
dashboardOverview: "ទិដ្ឋភាពទូទៅ",
dashboardMenu: "ម៉ឺនុយ",
transcribeCardDesc: "បញ្ចូលសំឡេង ហើយបម្លែងទៅជាអត្ថបទខ្មែរ ឬអង់គ្លេស",
ttsCardDesc: "វាយអត្ថបទ ហើយស្តាប់ ឬទាញយកជា MP3",
```

- [ ] **Step 2: Add matching keys to the English `en` object**

```ts
dashboardNav: "Dashboard",
dashboardTitle: "Dashboard",
dashboardSubtitle: "Choose a tool to get started",
dashboardOpen: "Open",
dashboardOverview: "Overview",
dashboardMenu: "Menu",
transcribeCardDesc: "Upload audio and convert it to Khmer or English text",
ttsCardDesc: "Type text, then listen or download as MP3",
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/km.ts
git commit -m "Add dashboard i18n strings for app shell"
```

---

### Task 2: Build DashboardSidebar

**Files:**
- Create: `src/components/DashboardSidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardSidebar.tsx
git commit -m "Add dashboard sidebar with mobile drawer"
```

---

### Task 3: Build DashboardShell + dashboard layout

**Files:**
- Create: `src/components/DashboardShell.tsx`
- Create: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Create `DashboardShell`**

```tsx
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
```

- [ ] **Step 2: Create dashboard layout**

```tsx
import { DashboardShell } from "@/components/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardShell.tsx src/app/dashboard/layout.tsx
git commit -m "Add auth-gated dashboard shell layout"
```

---

### Task 4: Overview page + tool routes

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/transcribe/page.tsx`
- Create: `src/app/dashboard/tts/page.tsx`

- [ ] **Step 1: Create overview page**

```tsx
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
];

export default function DashboardPage() {
  const { text: t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="khmer-text text-2xl font-bold text-navy">{t.dashboardTitle}</h1>
      <p className="khmer-text mt-1 text-sm text-text-muted">{t.dashboardSubtitle}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
```

- [ ] **Step 2: Create tool pages (no SiteHeader — shell provides chrome)**

`src/app/dashboard/transcribe/page.tsx`:

```tsx
import { TranscribeApp } from "@/components/TranscribeApp";

export const metadata = {
  title: "បម្លែងសំឡេង — សម្លេងខ្មែរ",
  description: "បញ្ចូលឯកសារសំឡេង និងបម្លែងសំឡេងភាសាខ្មែរទៅជាអក្សរ",
};

export default function DashboardTranscribePage() {
  return <TranscribeApp />;
}
```

`src/app/dashboard/tts/page.tsx`:

```tsx
import { TtsApp } from "@/components/TtsApp";

export const metadata = {
  title: "អត្ថបទទៅសំឡេង — សម្លេងខ្មែរ",
  description: "វាយ ឬបិទភ្ជាប់អត្ថបទ ហើយស្តាប់សំឡេងភាសាខ្មែរ ឬអង់គ្លេស",
};

export default function DashboardTtsPage() {
  return <TtsApp />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/transcribe/page.tsx src/app/dashboard/tts/page.tsx
git commit -m "Add dashboard overview and tool pages"
```

---

### Task 5: Redirects + auth success destinations

**Files:**
- Modify: `src/app/transcribe/page.tsx`
- Modify: `src/app/tts/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Delete (if unused): `src/components/TranscribeShell.tsx`, `src/components/TtsShell.tsx`

- [ ] **Step 1: Replace old tool pages with redirects**

`src/app/transcribe/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function TranscribeRedirectPage() {
  redirect("/dashboard/transcribe");
}
```

`src/app/tts/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function TtsRedirectPage() {
  redirect("/dashboard/tts");
}
```

- [ ] **Step 2: Point login/register at `/dashboard`**

In both files, change:
- `router.replace("/transcribe")` → `router.replace("/dashboard")`
- `router.push("/transcribe")` → `router.push("/dashboard")`

- [ ] **Step 3: Remove unused shells**

If nothing imports `TranscribeShell` / `TtsShell` anymore, delete those two files.

- [ ] **Step 4: Verify redirects**

```bash
curl -sI http://localhost:3000/transcribe | head -n 5
curl -sI http://localhost:3000/tts | head -n 5
```

Expected: `308` or `307` Location pointing at `/dashboard/transcribe` and `/dashboard/tts`.

- [ ] **Step 5: Commit**

```bash
git add src/app/transcribe/page.tsx src/app/tts/page.tsx src/app/login/page.tsx src/app/register/page.tsx
git add -u src/components/TranscribeShell.tsx src/components/TtsShell.tsx
git commit -m "Redirect legacy tool routes and send auth to dashboard"
```

---

### Task 6: Marketing header, footer, landing CTAs

**Files:**
- Modify: `src/components/SiteHeader.tsx`
- Modify: `src/components/SiteFooter.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update `SiteHeader` NAV**

For both `km` and `en` arrays, use marketing links only:

```ts
{ href: "/", labelKey: "home" },
{ href: "/#features", labelKey: "navFeatures" },
{ href: "/#how-it-works", labelKey: "navHow" },
{ href: "/login", labelKey: "signIn" },
{ href: "/register", labelKey: "register" },
```

Update filter logic so when `user` is present:
- hide `/login` and `/register`
- include a Dashboard item (`href: "/dashboard"`, label `t.dashboardNav`)

Change the circular shortcut `Link` from `/transcribe` to `/dashboard` (or `/login` if you prefer guests; prefer `/dashboard` so AuthGuard kicks guests to login).

- [ ] **Step 2: Update footer tool hrefs**

In `SiteFooter.tsx`, change `/transcribe` → `/dashboard/transcribe` and `/tts` → `/dashboard/tts`.

- [ ] **Step 3: Update landing CTAs in `src/app/page.tsx`**

Import `useAuth`. Set primary CTA href to `user ? "/dashboard" : "/login"`. Apply to both hero and bottom CTA links that currently point at `/transcribe`.

- [ ] **Step 4: Commit**

```bash
git add src/components/SiteHeader.tsx src/components/SiteFooter.tsx src/app/page.tsx
git commit -m "Keep marketing nav on landing; deep-link into dashboard"
```

---

### Task 7: Fit tool UIs inside the shell + manual QA

**Files:**
- Modify if needed: `src/components/TranscribeApp.tsx`, `src/components/TtsApp.tsx`

- [ ] **Step 1: Height fit**

`TranscribeApp` / `TtsApp` currently assume full viewport height under their own shells. Inside `DashboardShell`, `main` already scrolls. Ensure each tool root uses `min-h-0 flex-1` / does not force a second `h-dvh` that double-scrolls. Prefer:

```tsx
<div className="flex min-h-0 flex-1 flex-col ...">
```

instead of an outer `h-dvh` when nested in the dashboard.

- [ ] **Step 2: Manual QA checklist**

1. Logged out: `/` still has top marketing nav (no sidebar)
2. Login with demo user → lands on `/dashboard` with two cards + sidebar
3. Cards and sidebar open Transcribe / TTS correctly
4. Mobile width: hamburger opens drawer; links work; overlay closes
5. Sign out from sidebar → `/login`
6. `/transcribe` and `/tts` redirect into dashboard routes
7. Transcribe upload/history and TTS speak still function

- [ ] **Step 3: Commit any layout tweaks**

```bash
git add src/components/TranscribeApp.tsx src/components/TtsApp.tsx
git commit -m "Fit transcribe and TTS layouts inside dashboard shell"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Overview dashboard with cards | Task 4 |
| Labeled sidebar + mobile drawer | Tasks 2–3 |
| Routes under `/dashboard/*` | Tasks 3–4 |
| Redirects from `/transcribe`, `/tts` | Task 5 |
| Login/register → `/dashboard` | Task 5 |
| Marketing nav only on landing | Task 6 |
| Reuse existing tools | Task 4 + 7 |
| No history/voice-clone sidebar items | Out of scope (not built) |
