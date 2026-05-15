# ⚡ Athena

> **A computer literacy sandbox for the curious.**
> Learn how computers work — by actually using one.

**Live:** [kontor.studio](https://kontor.studio) &nbsp;·&nbsp; **Stack:** React + Vite &nbsp;·&nbsp; **For:** Absolute beginners → confident users

---

## What is Athena?

Athena is an interactive, browser-based desktop environment built to teach real computer skills — not just click-through tutorials. You practice inside simulated apps that behave like the real thing, guided by an AI assistant every step of the way.

No downloads. No accounts needed to explore. Just open it and start learning.

---

## Course Modules

Each module is a simulated app you can open, break, and learn from.

| Module | What you'll learn |
|---|---|
| 🗂️ **File Explorer** | Files, folders, paths, and how your computer organizes everything |
| 📧 **Email** | Writing, replying, attaching — real email etiquette from scratch |
| 🌐 **Browser** | URLs, tabs, searching smart, spotting sketchy sites |
| 📝 **Doc Editor** | Formatting, saving, exporting — the basics of writing documents |
| 🏫 **School Portal** | Navigating student portals, submitting work, checking grades |

---

## Tech Stack

| Layer | Tool |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Styling | Plain CSS with a custom token system |
| AI Assistant | Athena (built-in) |

No UI library dependencies. Every component is hand-rolled and beginner-readable.

---

## Getting Started

```bash
# 1. Clone the repo
git clone git@github.com:kwasikontor45/athena.git
cd athena

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open your browser at `http://localhost:5173` — the sandbox loads instantly.

---

## Project Structure

```
src/
├── components/
│   ├── desktop/            # The root OS-like shell
│   ├── taskbar/            # Bottom navigation bar
│   ├── athena-assistant/   # AI guide sidebar
│   ├── lesson-panel/       # Current lesson content
│   ├── progress-tracker/   # Skill completion tracker
│   └── sims/               # Simulated applications
│       ├── file-explorer-sim/
│       ├── email-sim/
│       ├── browser-sim/
│       ├── doc-editor-sim/
│       └── school-portal-sim/
├── hooks/                  # Shared React hooks
├── utils/                  # Helper functions
└── styles/
    └── tokens.css          # Design token definitions
```

---

## Design Tokens

The visual identity lives in `src/styles/tokens.css`. Every color and radius is a named variable — easy to theme, easy to read.

```css
--athena-gold: #c9a84c;      /* primary accent */
--athena-bg-base: #0a0e1a;   /* deep navy base */
--athena-green: #1d9e75;     /* success / progress */
```

---

## For Course Instructors

Athena is module-first by design. Each sim in `src/components/sims/` is fully independent — you can assign individual modules, track progress per-student via `progress-tracker`, and extend any sim without touching the others.

Want to add a module? Duplicate any sim folder and wire it into `desktop/index.jsx`. That's it.

---

## Contributing

This project is in active development. If you find a bug or want to propose a lesson, [open an issue](https://github.com/kwasikontor45/athena/issues) or start a discussion.

---

<p align="center">
  Built with intention at <strong>kontor.studio</strong>
</p>
