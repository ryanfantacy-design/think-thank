# Studi — Daily Study Tracker (PRD)

## Original Problem Statement
A free, single-file PWA daily study tracker. Subjects, daily goal & progress, streak, weekly chart, notes, history, Pomodoro, schedule clock with custom-music alarms, journal, mock-test scores with trend, share-streak PNG, JSON/CSV export+import. Duration values rendered in BLACK on bright chips. Playful neo-brutal theme. Hostable on GitHub Pages.

## Architecture
- **Standalone single-file PWA** (canonical product):
  - `/app/index.html` (repo root) — Pages source `/ (root)` ✅
  - `/app/docs/index.html` + `.nojekyll` — Pages source `/docs` ✅
  - `/app/standalone/index.html` + `README.md` — backup copy with longer dev docs
  - `/app/frontend/public/studi.html` — same file served by preview for live testing
  - `/app/README.md` + `.nojekyll` — clear GitHub-friendly root README
- Vanilla JS + `localStorage` (key `studi.v1`); CDN: Tailwind Play, Chart.js, html2canvas, Google Fonts.
- Inline web manifest via Blob URL; install FAB + iOS Safari hint banner.
- **Full-stack version** (optional, in `backend/` + `frontend/`) preserved for future multi-user mode.

## What's Implemented
- ✅ Iter 1: Subjects, sessions, stats, Pomodoro, schedule, records, settings.
- ✅ Iter 2: Journal + Mock Tests + Share-Streak PNG + cream/playful theme.
- ✅ Iter 3: Single-file standalone HTML (vanilla JS + localStorage).
- ✅ Iter 4: Single-file PWA (inline manifest, install FAB, iOS hint).
- ✅ Iter 5 (Apr 25, 2026): GitHub-friendly file layout — `index.html` at repo root + `docs/` + `.nojekyll` + plain-English root README.
- ✅ Iter 6 (Apr 25, 2026): **Robust alarm system**
  - Audio-unlock on first user gesture (`click`/`touchstart`/`keydown`/`pointerdown`) — required by autoplay policies.
  - Shared, resumable `AudioContext`; loud 6-second alternating square/sine beep pattern as default.
  - Uploaded music plays with `loop:true volume:1` for 12s, with auto-stop.
  - Throttled-tab catch-up: tracks `lastTickMinute`, triggers any alarm whose time falls in `(prev, cur]`. Visibility-change listener fires `alarmsTick` when tab returns.
  - Daily-bucket `alarmsTriggered` Set with hourly prune so alarms re-fire next day.
  - Yellow toast + Stop button + flashing document title + `navigator.vibrate` fallback.
  - "Sound ready" status badge + global "▶ Test alarm" button + per-row "▶ Test" buttons.
  - Improved README with troubleshooting section explaining browser autoplay rules.

## Backlog / Future
- **P1**: Optional separate `sw.js` for true offline precaching (would make it 2 files).
- **P2**: Background notifications via Push API (would need backend / Firebase) — currently we rely on tab being open.
- **P2**: Per-subject stacked weekly chart, calendar heatmap, mock-test topic tags, journal prompts, Web Share API for streak PNG.

## Next Tasks
- Awaiting user feedback after iter 6 alarm fixes.
