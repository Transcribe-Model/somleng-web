# Dashboard shell design

Date: 2026-11-07  
Status: Approved for implementation planning

## Problem

After login, users land on `/transcribe` with the marketing top nav. The product needs a real app shell: an overview dashboard plus sidebar navigation for tools. The marketing top nav should remain only on the landing experience.

## Decisions

| Decision | Choice |
|---|---|
| Post-login home | Overview dashboard with tool cards |
| Sidebar style | Labeled sidebar on desktop; collapses to drawer on mobile |
| Route structure | App under `/dashboard/*`; old tool URLs redirect |
| Marketing chrome | Keep `SiteHeader` / `SiteFooter` on `/` only |

## Information architecture

```text
/                         marketing landing (SiteHeader + SiteFooter)
/login, /register         auth pages → redirect to /dashboard on success
/dashboard                overview (tool cards)
/dashboard/transcribe     speech-to-text (existing TranscribeApp)
/dashboard/tts            text-to-speech (existing TtsApp)
/transcribe               redirect → /dashboard/transcribe
/tts                      redirect → /dashboard/tts
```

## Shell behavior

### App layout (`DashboardShell`)

- Full-height layout: left sidebar + main content
- Auth-gated via existing `AuthGuard`
- No marketing footer inside the app shell

### Sidebar items

1. Overview → `/dashboard`
2. Transcribe → `/dashboard/transcribe`
3. Text to speech → `/dashboard/tts`
4. Footer area: user email + Sign out

### Responsive

- Desktop: persistent labeled sidebar
- Mobile: top bar with brand + hamburger; sidebar as overlay drawer

### Overview page

- Title + short subtitle
- Two cards:
  - Transcribe → `/dashboard/transcribe`
  - Text to speech → `/dashboard/tts`
- Cards are navigation affordances only (no stats/history widgets in v1)

## Marketing adjustments

- Remove Transcribe / TTS from marketing `SiteHeader` nav for the landing experience
- When logged in on landing, show a Dashboard link (and Sign out) instead of Login/Register
- Landing CTAs that currently deep-link into tools should go to `/login` (or `/dashboard` if already authenticated)
- Footer links may keep tool names but should point at `/dashboard/...` (auth will gate)

## Component / file plan (high level)

- Add `src/components/DashboardSidebar.tsx` — nav links, mobile drawer, sign out
- Add `src/components/DashboardShell.tsx` — AuthGuard + sidebar + content area
- Add `src/app/dashboard/layout.tsx` — wraps children in `DashboardShell`
- Add `src/app/dashboard/page.tsx` — overview cards
- Move/reuse tool pages under `src/app/dashboard/transcribe` and `src/app/dashboard/tts`
- Replace old `/transcribe` and `/tts` pages with redirects
- Update login/register success redirects to `/dashboard`
- Update `SiteHeader` / landing CTAs / km strings as needed
- Strip `SiteHeader` from current `TranscribeShell` / `TtsShell` (layout owns chrome)

## Out of scope (v1)

- History as its own sidebar item (history stays inside Transcribe)
- Voice-clone as a separate dashboard page
- Settings / account page
- Dark mode or redesign of tool internals beyond fitting the shell

## Success criteria

1. Login lands on `/dashboard` with two tool cards and sidebar
2. Sidebar navigates between Overview, Transcribe, TTS; Sign out works
3. Mobile uses drawer; desktop uses persistent sidebar
4. `/` still uses marketing top nav (no app sidebar)
5. `/transcribe` and `/tts` redirect into dashboard routes
6. Existing Transcribe and TTS behavior still works inside the shell
