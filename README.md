# Athena

> **A computer literacy sandbox for the curious.**
> Learn how computers work — by actually using one.

**Live:** [athena.kontor.studio](https://athena.kontor.studio) &nbsp;·&nbsp; **Stack:** React 19 + Vite &nbsp;·&nbsp; **For:** Absolute beginners → confident users

---

## What is Athena?

Athena is an interactive, browser-based desktop environment that teaches real computer skills through hands-on practice. Every lesson takes place inside a simulated app that behaves like the real thing — guided by an AI assistant at every step.

No downloads. No account required. Works offline. Installable as a PWA.

---

## Course — 5 Weeks, 13 Lessons

| Week | Lesson | What you practice |
|---|---|---|
| 1 | 🖱️ The mouse & clicking | Click, double-click, right-click |
| 1 | ⌨️ The keyboard | Typing, Enter, special keys |
| 1 | 🖥️ Finding your way around | Open apps, close windows, taskbar |
| 2 | 🗂️ Files & folders | Create, rename, move, organize, trash |
| 2 | ✉️ Sending email | Write, reply, attach, send |
| 3 | 🌐 Browsing the web | URLs, tabs, search, spot phishing |
| 3 | 📝 Writing a document | Format, name, save, export |
| 4 | 🎓 The school portal | Log in, find assignment, upload, submit |
| 4 | 📹 Joining a video call | Mute, camera, raise hand, chat |
| 4 | ⌨️ Keyboard shortcuts | Ctrl+A / C / V / Z / S |
| 4 | 🔐 Passwords & security | Strength requirements, security tips |
| 5 | 🧪 Code Bootcamp | Write and run real code — see below |
| 5 | 🔧 Your first Git repo | Version control from scratch — see below |

---

## Week 5 — Code Bootcamp

A guided coding lesson where you build a drag-and-drop kanban board step by step. The editor has syntax highlighting and a line gutter. After each step, you can run your actual code and see it execute.

**Python playground** — built into the editor: flip to the 🐍 Python tab and write Python directly in the browser. Code runs for real via [Pyodide](https://pyodide.org) (Python 3.11 compiled to WebAssembly — no server, no install).

```python
# runs right here, in the browser
names = ["Ama", "Kwesi", "Adjoa"]
for name in names:
    print(f"Hello, {name}!")
```

---

## Week 5 — Git Basics

A 22-step terminal simulator covering the full beginner Git workflow across four parts:

| Part | What you learn |
|---|---|
| 1 — Local basics | `git init` · `git status` · `git add` · `git commit` · `git log` |
| 2 — Remotes | `git remote add` · `git push` · `git pull` · `git clone` |
| 3 — Branching | `git branch` · `git checkout` · `git merge` · merge conflicts |
| 4 — PRs + Sandbox | Pull request flow · open sandbox terminal |

The **sandbox terminal** is a real shell environment: create files with `touch`, edit them with `nano`/`vim`, run `git add` / `git commit` on your actual changes, clone public GitHub repos, and execute Python scripts with `python script.py` — same Pyodide runtime as Code Bootcamp.

Validation is lenient-with-coaching: `git add .` is accepted but notes why naming files is clearer; weak commit messages are flagged and explained.

---

## AI Assistant — Athena

Athena is always visible — a permanent 272px left panel with a floating 🦉 orb that pulses with her state (gold/breathing when idle, blue when thinking, green on success, amber when you're struggling). The panel collapses to 44px to give sims more room.

**Adaptive responses (Phase 5):** before each reply, Athena fetches your progress from the backend. She knows which lessons you've completed, where you've struggled (lessons with repeated failures), and how long you've been learning. Responses are personalised — she references your history, not generic encouragement.

She tries two live AI providers before falling back to built-in offline responses:

1. **Groq** (`llama-3.1-8b-instant`) — fast, free tier
2. **OpenRouter** (`llama-3.1-8b` free) — fallback
3. **Built-in offline responses** — full coverage for all 13 lessons

Set keys in `.env.local` to enable live AI. Athena works fully offline without them.

---

## Other Features

- **PWA** — installable, works fully offline after first load
- **Circadian engine** — UI palette shifts by time of day (dawn / day / golden hour / night)
- **Progress checkpoints** — export your progress as a shareable restore link; works across any device or browser
- **Cloud sync** — every lesson event syncs to a Cloudflare D1 database via `athena-sync` worker (see [athena-worker](https://github.com/k6-bleedin6ed6e-k6/athena-worker))
- **Instructor dashboard** — `athena.kontor.studio/dashboard.html` — cohort progress, per-lesson heatmap, learner drilldown, weak spot analysis
- **Sim ecosystem** — email, portal, library, and file explorer share one student narrative (credentials, downloadable files, cross-references)
- **Free Explore** — Practice tab opens all 11 sims with no lesson locks, scrollable grid

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Styling | Plain CSS, custom design token system |
| AI runtime | Groq → OpenRouter → offline fallback |
| Python execution | Pyodide 0.26.4 (WebAssembly, runs in-browser) |
| PWA | vite-plugin-pwa + Workbox |
| Sync backend | Cloudflare Workers + D1 (see athena-worker) |

No UI library dependencies. Every component is hand-rolled.

---

## Getting Started

```bash
# 1. Clone
git clone git@github.com:kwasikontor45/athena.git
cd athena

# 2. Install
npm install

# 3. Optional: add AI API keys for live Athena responses
cp .env.local.example .env.local
# VITE_GROQ_API_KEY=gsk_...
# VITE_OPENROUTER_API_KEY=sk-or-...
# Athena works offline without these — built-in responses cover all lessons

# 4. Start dev server
npm run dev
```

Open `http://localhost:5173`.

---

## Project Structure

```
src/
├── components/
│   ├── desktop/              # OS-like shell, icon grid, daily mission card
│   ├── taskbar/              # Navigation, clock, XP tracker, sound toggle
│   ├── athena-widget/        # Floating AI assistant (draggable)
│   ├── lesson-panel/         # Weekly lesson list, progress bars
│   ├── progress-tracker/     # Taskbar XP display, floater animation
│   ├── sim-window/           # Draggable, resizable, maximisable window shell
│   └── sims/
│       ├── mouse-practice-sim/
│       ├── file-explorer-sim/
│       ├── email-sim/
│       ├── browser-sim/
│       ├── doc-editor-sim/
│       ├── school-portal-sim/
│       ├── typing-sim/
│       ├── video-call-sim/
│       ├── shortcuts-sim/
│       ├── password-sim/
│       ├── code-bootcamp-sim/   # Guided coding + Python playground
│       ├── git-sim/             # 22-step Git terminal + sandbox
│       └── playground-sim/      # Free-roam launcher for all sims
├── utils/
│   ├── lessons.js            # 13 lessons, 5 weeks
│   ├── code-lessons.js       # Code Bootcamp step definitions
│   ├── git-lessons.js        # Git Basics step definitions + terminal output
│   ├── pyodide-runner.js     # Pyodide singleton — shared across sims
│   ├── use-athena.js         # AI provider chain (Groq → OpenRouter → offline)
│   ├── athena-responses.js   # Built-in offline responses for all lessons
│   ├── use-progress.js       # XP, badges, localStorage, checkpoint encode/decode
│   ├── use-sync.js           # Cloud sync — event queue, D1 flush
│   ├── use-circadian.js      # Time-of-day phase detection
│   ├── circadian-phases.js   # Phase definitions + CSS token values
│   ├── highlight.js          # Zero-dep syntax highlighter (JS + Python)
│   └── sound.js              # Web Audio API — click, chime, fanfare
└── app.css                   # Global styles, design tokens, sim position resets
```

---

## For Instructors

Each sim in `src/components/sims/` is fully self-contained. Assign individual modules, track cohort progress via the dashboard, and extend any sim without touching others.

To add a lesson: duplicate any sim folder, add one entry to `SIM_MAP` in `src/App.jsx`, add a lesson entry to `src/utils/lessons.js`.

The dashboard is at `athena.kontor.studio/dashboard.html` — auth with the `DASHBOARD_SECRET` from the `athena-sync` worker environment.

---

<p align="center">
  Built with intention at <strong>kontor.studio</strong>
</p>
