# Studi — Daily Study Tracker

A free, single-file PWA. Subjects · Pomodoro · Schedule alarms (with custom music) · Journal · Mock-test scores · Streak · Share-card. **No backend, no signup, no cost.**

## Relaunch status

This repo is GitHub Pages ready. The upgraded static app is mirrored in:

- `index.html` for Pages folder `/ (root)`
- `docs/index.html` for Pages folder `/docs`
- `standalone/index.html` as a backup single-file copy

Recent upgrades include Daily / Weekly / Monthly planner tasks, editable linked Pomodoro work/break timers, subject-tagged Pomodoro sessions, subject-wise weekly breakdowns, expanded/custom subject colors, and safer one-at-a-time alarm preview/playback. The original Studi UI style is preserved.

👉 **Live demo**: enable GitHub Pages on this repo (instructions below) and your demo URL will be `https://<your-username>.github.io/<repo-name>/`.

---

## Put this on GitHub Pages in 1 minute

You only need ONE click. Just choose **A** or **B** based on which you find first:

### Option A — Use the `/ (root)` folder (recommended)
1. On GitHub, open this repo.
2. Click **Settings** (top right).
3. Click **Pages** (left sidebar).
4. Under **Source**, choose **Deploy from a branch**.
5. Branch: **`main`**. Folder: **`/ (root)`**. Click **Save**.
6. Wait 30 seconds. Refresh. Your URL appears at the top of the Pages page.

### Option B — Use the `/docs` folder
Same steps, but set Folder: **`/docs`**. Click Save. That's it.

> Either way works because this repo contains an `index.html` at **both** the root **and** in `docs/`. Pick whichever option GitHub shows you. Don't worry about the other files in the repo — Pages just serves the `index.html`.

### Open it on your phone
- Visit `https://<your-username>.github.io/<repo-name>/`
- **Android / Chrome**: tap the yellow **"⬇ Install Studi"** button that pops up bottom-right (or browser menu → "Install app").
- **iPhone / Safari**: tap the **Share** button → **"Add to Home Screen"**. Studi shows a one-time hint banner reminding you.

That's it. Studi is now an app on your home screen.

---

## What's inside (file map)

| Path | What it is |
|---|---|
| **`index.html`** ⬅ root of the repo | The whole app. **This is what GitHub Pages serves.** |
| **`docs/index.html`** | Same file, in `/docs/` so the alternate Pages option also works. |
| **`standalone/index.html`** + `README.md` | Same file again, with a longer dev README. Backup copy. |
| `backend/`, `frontend/`, `tests/`, `scripts/` | The optional full-stack version (FastAPI + React + MongoDB). **Ignore these for GitHub Pages** — they're for self-hosters who want a multi-user backend. |
| `memory/`, `test_reports/`, `design_guidelines.json` | Project meta. Safe to ignore. |

GitHub Pages only looks at the `index.html` files. The rest of the repo is harmless.

---

## Where does my data go?

100% in **your browser's localStorage** under the key `studi.v1`. It never leaves your phone/computer. To move data between devices, use **Settings → Export JSON** here, then **Import JSON** there.

## Reset everything
Settings → "Reset everything" wipes your localStorage.

## Free static-host alternatives (no GitHub needed)
- **Netlify Drop**: drag `index.html` onto https://app.netlify.com/drop → instant URL.
- **Vercel · Cloudflare Pages · surge.sh** — same idea.
- **Just open it locally**: download `index.html` and double-click.

---

Built with ❤️ on Emergent.
