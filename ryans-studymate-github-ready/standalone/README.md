# Studi — Single-File PWA Daily Study Tracker

One self-contained `index.html`. **Installable as a PWA**. No backend, no signup, no cost.

## Features
- ✅ Subjects (CRUD with daily targets) + per-session notes
- ✅ Daily goal & progress bar · Streak counter (current / longest / active)
- ✅ Pomodoro timer (auto-logs sessions on completion)
- ✅ Schedule clock with start/end alarms + custom music upload
- ✅ Journal (mood + free-form notes per day)
- ✅ Mock test scores with auto-% and trend chart
- ✅ Weekly bar chart · Records browser with date-range filter
- ✅ JSON & CSV export, JSON import (replace mode)
- ✅ "Share my streak" — exports a beautiful PNG card
- ✅ Playful neo-brutalist theme · duration values rendered in solid BLACK on bright accent chips
- ✅ **Installable PWA** — Add to Home Screen on Android / iOS / desktop

## Where your data lives
**100% in your browser's `localStorage`** (key: `studi.v1`). It never leaves your device. To move data between devices, use Settings → **Export JSON**, then **Import JSON** on the other device.

---

## Deploy on GitHub Pages (free, ~2 min)

1. Create a new public repo on github.com (e.g., `studi`).
2. Click **Add file → Upload files**.
3. Drag the **`index.html`** file into the upload area. Commit.
4. Repo → **Settings → Pages**. Source: **Deploy from a branch**. Branch: **main** / folder: **/ (root)**. Save.
5. Wait ~30 s. Your app is live at:
   ```
   https://<your-username>.github.io/<repo-name>/
   ```
6. Open it on your phone, then **Add to Home Screen**:
   - **Android / Chrome**: tap the "⬇ Install Studi" button (auto-appears) or browser menu → "Install app".
   - **iPhone / Safari**: tap **Share → Add to Home Screen**. (Studi shows a one-time hint banner with this instruction.)

> Tip: If your username is `alice` and the repo is named `studi`, your install URL is `https://alice.github.io/studi/`.

## Other free hosts
- **Netlify Drop**: drag the file onto https://app.netlify.com/drop → instant URL, no account needed.
- **Vercel · Cloudflare Pages · surge.sh · your-folder.com** — same idea. Any static-host free tier works.
- **Just open it locally**: download `index.html` and double-click.

---

## What's loaded from CDN (first visit needs internet)
- Tailwind CSS Play CDN (styles)
- Chart.js (weekly + mock-test charts)
- html2canvas (PNG share card)
- Google Fonts (Bricolage Grotesque · DM Sans · JetBrains Mono)

After first visit, browsers cache these aggressively, so the app works mostly offline. For full offline-first behavior you can later add a service-worker file beside `index.html`, but the single-file PWA happily installs + runs without one.

## Editing alarms & per-alarm sounds

Each alarm can be **edited in place** — tap **✏ Edit** on any alarm row to:
- Change the **label** and **linked subject**
- Adjust **start / end times**
- Upload a **custom start sound** AND a **separate end sound** for that specific alarm (different MP3/WAV/etc. for the begin-vs-end ring)
- **Replace** an uploaded sound any time, **clear** it (revert to default), or **▶ Preview** it

If an alarm has no per-alarm sound, Studi falls back to the **default alarm sound** at the top of the Schedule tab. If that's also empty, it plays the built-in beep pattern.

Each alarm shows tiny **🎵 start** / **🎵 end** stickers when it has a custom sound configured.

## Stopping & snoozing alarms

When an alarm rings, you'll see three actions:
1. **Stop** (white) on the toast → silences the alarm immediately.
2. **💤 Snooze 5** (lavender) on the toast → silences for now and re-rings the same sound + toast in 5 minutes.
3. **▶ Start studying** (green, only on start-time alarms with a linked subject) → see the next section.

Plus a pulsing red **🔇 Stop alarm** floats at the bottom-right of the screen the whole time the sound is playing — tap it to silence anywhere in the app.

Sounds also auto-stop after 60 seconds for safety.

## Browser notifications & alarms — make sure they ring!

Modern browsers block sound until you've interacted with the page (it's a privacy/UX rule, not a Studi bug). Studi handles this gracefully, but you should:

1. **Open the Schedule tab** → tap the yellow **"▶ Test alarm"** button. You should hear an attention-grabbing beep pattern (or your uploaded music) and see a yellow toast at the top of the screen.
2. The "Sound status" badge next to the button should turn **green "🔊 Sound ready"** after your first tap.
3. Tap **"Enable browser notifications"** to also get OS-level pop-ups (and home-screen badges on installed PWA).
4. Each alarm row has its own **"▶ Test"** button — use it any time to verify.

### One-tap "Start studying" check-in
When you create an alarm, you can **link it to a subject**. At the alarm's start time, the toast shows a green **"▶ Start studying"** button — tap it to:
- log a 1-minute "Started via alarm" session for that subject (keeps your streak alive on bad days),
- and **auto-jump to Pomodoro + start the work timer** for the same subject.

If the alarm has no linked subject, Studi falls back to your first subject. Add at least one subject before relying on check-in.

**Why an alarm sometimes doesn't ring:**
- The Studi tab/PWA is **fully closed** (browsers can't play audio if the app isn't running).
- You haven't tapped **anywhere on the page yet** in this session (sound is locked until first touch).
- Your phone is on **silent / Do Not Disturb / mute switch**.
- The browser tab was **frozen** in the background for many minutes — Studi auto-catches up the moment you switch back to it (visibility change), but the audio plays at that moment, not at the original schedule time.

For best reliability, install Studi as a PWA (Add to Home Screen) and keep it in the recents list — phones treat installed PWAs more leniently than backgrounded tabs.

## Reset everything
Settings → "Reset everything" wipes your localStorage. Or DevTools → Application → Local Storage → delete the `studi.v1` key.
