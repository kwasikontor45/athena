# Athena

> **A computer literacy sandbox for the curious.**
> Learn how computers work — by actually using one.

**Live:** [athena.kontor.studio](https://athena.kontor.studio) &nbsp;·&nbsp; **Stack:** React 19 + Vite 8 &nbsp;·&nbsp; **For:** Absolute beginners → confident users

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
| 2 | ✉️ Sending email | Write, reply, send — connected to the rest of the story |
| 3 | 🌐 Browsing the web | URLs, tabs, search, spot phishing |
| 3 | 📝 Writing a document | Format, name, save, export |
| 4 | 🎓 The school portal | Log in, find assignment, upload, submit |
| 4 | 📹 Joining a video call | Mute, camera, raise hand, chat |
| 4 | ⚡ Keyboard shortcuts | Ctrl+A / C / V / Z / S |
| 4 | 🔐 Passwords & security | Strength requirements, security tips |
| 5 | 🧪 Code Bootcamp | Write and run a real Python script |
| 5 | 🔧 Your first Git repo | Version control the script you just wrote |

All lessons are unlocked from the start. No gates, no prerequisites. The week structure is visual guidance, not a lock.

---

## Sim Ecosystem

Weeks 2–4 form a connected student narrative. Sims share state via a `simContext` object so actions in one affect others:

- **Email** — Admissions email contains login credentials (`student2026` / `welcome1`). Prof. Mensah mentions the library.
- **School portal** — detects that you've read the welcome email; auto-fills your username and shows credentials in context.
- **Browser / Library** — replying to Prof. Mensah pre-fills the library search with "BUS 101". Downloading materials puts them in your file explorer.
- **File Explorer** — Downloads folder populates from what you actually downloaded in the library.

The same learner. One story.

---

## Week 5 — Code Bootcamp

A guided coding lesson where you write a Python grade calculator from scratch — step by step, running real code at each stage.

**6 steps:**
1. `print("Hello, I'm Alex")` — introduce print(), run it, see output
2. Store your grades as a list
3. Calculate the average using `sum()` and `len()`
4. Turn it into a letter grade with if/elif/else
5. Wrap it in a function called `calculate_grade`
6. Call it and run it — validation checks actual output

Code runs for real via [Pyodide](https://pyodide.org) (Python compiled to WebAssembly — no server, no install needed). Output appears inline below the editor.

```python
# runs right here, in your browser
def calculate_grade(grades):
    average = sum(grades) / len(grades)
    if average >= 90: return "A"
    elif average >= 80: return "B"
    elif average >= 70: return "C"
    elif average >= 60: return "D"
    else: return "F"

print("Grade:", calculate_grade([85, 92, 78, 90, 88]))
```

When the lesson completes, the script is passed to Git Basics as an untracked file.

---

## Week 5 — Git Basics

An 11-step terminal simulator: zero to ship. Picks up where Code Bootcamp left off — `grades.py` is already in the project, untracked, waiting to be version-controlled.

| Step | What you do |
|---|---|
| 1 | What is git? (explainer) |
| 2 | `git init` |
| 3 | `git status` — see the untracked file |
| 4 | `git add grades.py` |
| 5 | `git status` — verify it's staged |
| 6 | `git commit -m "..."` |
| 7 | `git log` |
| 8 | Create your GitHub account (simulated signup form) |
| 9 | `git remote add origin https://github.com/<username>/my-project.git` |
| 10 | `git push -u origin main` |
| 11 | Zero to ship — sandbox unlocked |

The **sandbox terminal** opens after step 11. Try `git clone https://github.com/k6-bleedin6ed6e-k6/grades` to pull the exact grades.py script from Code Bootcamp. Also supports `touch`, `nano`/`vim`, `python script.py` (same Pyodide runtime), and free git commands.

Validation is lenient-with-coaching: `git add .` is accepted with a note explaining why naming files is better; weak commit messages are flagged.

---

## AI Assistant — Athena

Athena is always visible — a permanent left panel with a floating 🦉 orb that pulses with her state. The panel collapses to give sims more room.

**Adaptive responses:** Athena builds her replies from your locally-stored progress (completed lessons, weak spots, streak). No backend call — the cloud-sync layer this used to run through was abandoned 2026-06-04; everything runs client-side now.

She tries two live AI providers before falling back to built-in offline responses:

1. **Groq** (`llama-3.1-8b-instant`) — fast, free tier
2. **OpenRouter** (`llama-3.1-8b` free) — fallback
3. **Built-in offline responses** — full coverage for all 13 lessons + all events

Set keys in `.env.local` to enable live AI. Athena works fully offline without them.

---

## Progress & Identity

**Save code** — after completing your first lesson, Athena shows you a three-word save code (e.g. `amber-cedar-42`). It encodes your local progress directly (`progressToCode`/`codeToProgress`) — no server round-trip. Paste it back in on any device/browser to restore.

**Checkpoint links** — the Progress screen also generates a `?restore=` URL that encodes your local progress as base64 — same mechanism, shareable as a link instead of a phrase.

> A Cloudflare D1 + `athena-sync` worker cloud-sync layer existed at one point but was abandoned 2026-06-04 (account cleared). The sync call sites (`trackEvent`, `joinCohort`, etc.) are still in the code and degrade silently — they don't error, they just do nothing. Progress is 100% local now.

---

## Other Features

- **PWA** — installable, works fully offline after first load
- **Circadian engine** — UI palette shifts by time of day (dawn / day / golden hour / night)
- **Instructor dashboard** — `athena.kontor.studio/dashboard.html` still exists but depended on the now-removed D1 backend for cohort-wide data; not currently functional, kept as a placeholder rather than fixed
- **Free Explore** — Practice tab opens all sims simultaneously with no lesson requirements
- **Celebration overlay** — gold confetti + fanfare on every lesson completion
- **Streak counter** — consecutive day tracking, Athena greets with streak message from day 2

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI framework | React 19 |
| Build tool | Vite 8 |
| Styling | Plain CSS, custom design token system |
| AI runtime | Groq → OpenRouter → offline fallback |
| Python execution | Pyodide (WebAssembly, runs in-browser) |
| PWA | vite-plugin-pwa + Workbox |

No UI library dependencies. Every component is hand-rolled.

---

## Getting Started

```bash
# 1. Clone (primary or mirror)
git clone git@github.com:kwasikontor45/athena.git
# or: git clone git@github-k6:k6-bleedin6ed6e-k6/athena.git
cd athena

# 2. Install
npm install

# 3. Optional: add AI API keys for live Athena responses
#    VITE_GROQ_API_KEY=gsk_...
#    VITE_OPENROUTER_API_KEY=sk-or-...
#    Athena works offline without these — built-in responses cover all lessons

# 4. Start dev server
npm run dev
```

Open `http://localhost:5173`.

---

## Project Structure

```
src/
├── components/
│   ├── desktop/              # Lesson cards by week, daily mission, finished state
│   ├── taskbar/              # Navigation, clock, XP tracker, sound toggle
│   ├── athena-widget/        # AI assistant — left panel + floating orb
│   ├── celebration/          # Confetti overlay on lesson complete
│   ├── progress-tracker/     # Taskbar XP display + floater animation
│   └── sims/
│       ├── mouse-practice-sim/
│       ├── file-explorer-sim/
│       ├── email-sim/
│       ├── browser-sim/         # Google, ViewTube, OpenWiki, library, phishing
│       ├── doc-editor-sim/
│       ├── school-portal-sim/
│       ├── typing-sim/
│       ├── video-call-sim/
│       ├── shortcuts-sim/
│       ├── password-sim/
│       ├── code-bootcamp-sim/   # Python grade calculator + Pyodide execution
│       ├── git-sim/             # 11-step Git terminal (zero to ship) + sandbox
│       └── playground-sim/      # Free-roam launcher, all sims simultaneously
├── utils/
│   ├── lessons.js            # 13 lessons, 5 weeks
│   ├── code-lessons.js       # Code Bootcamp step definitions + validation
│   ├── git-lessons.js        # Git Basics step definitions + terminal output
│   ├── pyodide-runner.js     # Pyodide singleton — shared across CB and git-sim
│   ├── use-athena.js         # AI provider chain + learner profile injection
│   ├── athena-responses.js   # Built-in offline responses for all lessons
│   ├── use-progress.js       # XP, badges, localStorage, checkpoint encode/decode
│   ├── use-sync.js           # Passphrase/save-code identity — D1 sync calls are dead code (backend abandoned 2026-06-04), degrade silently
│   ├── use-circadian.js      # Time-of-day phase detection
│   ├── circadian-phases.js   # Phase definitions + CSS token values
│   ├── highlight.js          # Zero-dep syntax highlighter (JS + Python keywords)
│   └── sound.js              # Web Audio API — click, chime, fanfare
└── app.css                   # Global styles, design tokens, sim layout rules
functions/
└── dashboard/
    └── unlock.js             # Cloudflare Pages Function — phrase-gated dashboard access
```

---

## For Instructors

**Dashboard** — `athena.kontor.studio/dashboard.html`. Type the access phrase into Athena's chat to receive the dashboard link and Bearer token. The phrase is hashed client-side; the secret never appears in the source code.

**Cohorts** — pick any code and share it with learners. They enter it in the Progress screen. The cohort springs to life on first join — no setup required.

**Adding a lesson** — duplicate any sim folder, add one entry to `SIM_MAP` in `src/App.jsx`, add a lesson entry to `src/utils/lessons.js`. The rest (progress tracking, Athena responses, celebration overlay) picks it up automatically.

---

<p align="center">
  Built with intention at <strong>kontor.studio</strong>
</p>
