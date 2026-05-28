// Output line builders
const L  = (text, cls = '')  => ({ text, cls })
const DIM = text => L(text, 'dim')
const RED = text => L(text, 'red')
const GRN = text => L(text, 'green')
const YLW = text => L(text, 'yellow')
const BL  = ()   => L('')

// File contents at each lesson stage
export const README_V1 = `# My Project

Hello, world! This is my first project.`

export const README_V2 = `# My Project

Hello, world! This is my first project.

## Getting Started

Clone this repo and open index.html in your browser.`

export const ABOUT_FILE = `# About

This project was built to learn Git workflows.
Author: Learner`

// Realistic git output generators
export function gitStatusOutput(gs) {
  if (!gs.initialized) return [L('fatal: not a git repository (or any of the parent directories): .git', 'red')]

  const hasUntracked  = gs.untracked.length > 0
  const hasStaged     = gs.staged.length > 0
  const hasModified   = gs.modified.length > 0
  const hasCommits    = gs.commits.length > 0

  const branchLine = gs.remote?.pushed
    ? `On branch ${gs.currentBranch || gs.branch}\nYour branch is up to date with 'origin/${gs.currentBranch || gs.branch}'.`
    : `On branch ${gs.currentBranch || gs.branch}`

  const out = [L(branchLine), BL()]

  if (!hasCommits) out.push(L('No commits yet'), BL())

  if (hasStaged) {
    out.push(L('Changes to be committed:'), DIM('  (use "git rm --cached <file>..." to unstage)'))
    gs.staged.forEach(f => out.push(GRN(`\tnew file:   ${f}`)))
    out.push(BL())
  }

  if (hasModified) {
    out.push(L('Changes not staged for commit:'), DIM('  (use "git add <file>..." to update what will be committed)'))
    gs.modified.forEach(f => out.push(RED(`\tmodified:   ${f}`)))
    out.push(BL())
  }

  if (hasUntracked) {
    out.push(L('Untracked files:'), DIM('  (use "git add <file>..." to include in what will be committed)'))
    gs.untracked.forEach(f => out.push(RED(`\t${f}`)))
    out.push(BL())
  }

  if (!hasStaged && !hasModified && !hasUntracked) {
    if (hasCommits) out.push(L('nothing to commit, working tree clean'))
    else out.push(L('nothing added to commit but untracked files present (use "git add" to track)'))
  }

  return out
}

export function gitLogOutput(gs) {
  if (!gs.commits.length) return [L("fatal: your current branch 'main' does not have any commits yet", 'red')]
  const out = []
  ;[...gs.commits].reverse().forEach((c, i) => {
    out.push(YLW(`commit ${c.hash}${i === 0 ? ` (HEAD -> ${gs.currentBranch || gs.branch}${gs.remote?.pushed ? ', origin/main' : ''})` : ''}`))
    out.push(L('Author: Learner <learner@athena.study>'))
    out.push(L(`Date:   ${c.date}`))
    out.push(BL())
    out.push(L(`    ${c.message}`))
    if (i < gs.commits.length - 1) out.push(BL())
  })
  return out
}

export function gitLogOneline(gs) {
  if (!gs.commits.length) return [L("fatal: your current branch 'main' does not have any commits yet", 'red')]
  return [...gs.commits].reverse().map((c, i) =>
    YLW(`${c.short}${i === 0 ? ` (HEAD -> ${gs.currentBranch || gs.branch}${gs.remote?.pushed ? ', origin/main' : ''})` : ''} ${c.message}`)
  )
}

// Accept helpers
const addAccepts    = cmd => /^git add (README\.md|ABOUT\.md|\.|--all|-A)$/.test(cmd.trim())
const commitAccepts = cmd => /^git commit -m (["']).+\1$/.test(cmd.trim())
const logAccepts    = cmd => /^git log(?: --oneline)?$/.test(cmd.trim())

function extractMessage(cmd) {
  const m = cmd.match(/^git commit -m ["'](.+)["']$/)
  return m ? m[1] : 'commit'
}

function addNote(cmd) {
  const c = cmd.trim()
  if (c === 'git add .' || c === 'git add --all' || c === 'git add -A')
    return 'Accepted — though naming the file (git add README.md) is clearer when working with others.'
  return null
}

function logNote(cmd) {
  if (cmd.trim() === 'git log --oneline')
    return '--oneline gives a compact one-line view. Many developers use it by default.'
  return null
}

function commitNote(msg) {
  const bad = ['update', 'fix', 'changes', 'stuff', 'commit', 'done', 'ok', 'test', 'wip', 'initial']
  if (bad.includes(msg.toLowerCase()))
    return `Accepted — but "${msg}" doesn't tell you much later. Try something specific like "add README with project description".`
  return null
}

function fakeHash() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join('') +
    Array.from({ length: 33 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function fakeShortHash() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function fakeDate() {
  return new Date().toDateString() + ' ' + new Date().toLocaleTimeString()
}

// ─── The lesson ───────────────────────────────────────────────────────────────

export const gitBasicsLesson = {
  id: 'git-basics',
  title: 'git: zero to ship',

  initialState: {
    initialized: false,
    branch: 'main',
    currentBranch: 'main',
    branches: ['main'],
    untracked:  ['README.md'],
    staged:     [],
    modified:   [],
    commits:    [],
    remote:     null,
    fileContents: { 'README.md': README_V1 },
    activeFile: 'README.md',
  },

  steps: [
    // ── Part 1: Local basics ───────────────────────────────────────────────

    {
      id: 'explainer',
      type: 'explainer',
      title: 'what is git?',
      instruction:
        'Git is a tool that saves snapshots of your project over time.\n\n' +
        'Think of it like a very detailed undo history — except it never forgets, and you can go back to any point.\n\n' +
        'Every save in Git is called a commit. Before you commit, you choose which changes to include — that\'s called staging.',
      diagram: true,
    },
    {
      id: 'git-init',
      type: 'command',
      title: 'initialise the repo',
      instruction:
        'Every Git project starts with one command. It creates a hidden .git folder that tracks everything from here on.\n\nType: git init',
      hint: 'git init — you only ever run this once per project.',
      viewFile: 'README.md',
      accepts: cmd => cmd.trim() === 'git init',
      getOutput: () => [L('Initialized empty Git repository in ~/my-project/.git/')],
      getSideEffect: () => ({ initialized: true }),
    },
    {
      id: 'first-status',
      type: 'command',
      title: 'check the state',
      instruction:
        'A file called README.md already exists in your project — but Git doesn\'t know about it yet.\n\nAlways check the state before doing anything.\n\nType: git status',
      hint: 'git status — run this constantly. It tells you exactly where you are.',
      viewFile: 'README.md',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: gs => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'git-add',
      type: 'command',
      title: 'stage the file',
      instruction:
        'Git sees README.md but isn\'t tracking it. Staging means telling Git: "include this in my next snapshot."\n\nName the file specifically — it\'s the professional habit.\n\nType: git add README.md',
      hint: 'git add README.md — name the file. Using git add . stages everything, which can include files you didn\'t intend.',
      viewFile: 'README.md',
      accepts: addAccepts,
      getOutput: () => [],
      getNote: cmd => addNote(cmd),
      getSideEffect: () => ({ staged: ['README.md'], untracked: [] }),
    },
    {
      id: 'staged-status',
      type: 'command',
      title: "verify what's staged",
      instruction:
        'Before committing, always verify what\'s staged. This catches mistakes before they\'re permanent.\n\nType: git status',
      hint: 'git status shows staged files in green.',
      viewFile: 'README.md',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: gs => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'first-commit',
      type: 'command',
      title: 'make your first commit',
      instruction:
        'A commit is a permanent snapshot with a message describing what changed. Write something your future self will understand.\n\nType: git commit -m "add README"',
      hint: 'The message goes in quotes after -m. Make it specific — "add README" is better than "stuff".',
      viewFile: 'README.md',
      accepts: commitAccepts,
      getOutput: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeShortHash()
        return [
          L(`[main (root-commit) ${hash}] ${msg}`),
          L(' 1 file changed, 3 insertions(+)'),
          L(' create mode 100644 README.md'),
        ]
      },
      getNote: cmd => commitNote(extractMessage(cmd)),
      getSideEffect: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeHash()
        return {
          staged: [],
          commits: [...gs.commits, { hash, short: hash.slice(0, 7), message: msg, date: fakeDate() }],
        }
      },
    },
    {
      id: 'first-log',
      type: 'command',
      title: 'view your history',
      instruction:
        'Your first commit is saved. Now see it in the project history.\n\nType: git log\n\nTip: try git log --oneline for a compact view.',
      hint: 'git log shows every commit. git log --oneline is faster to scan.',
      viewFile: 'README.md',
      accepts: logAccepts,
      getOutput: (gs, cmd) => cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs),
      getNote: cmd => logNote(cmd),
      getSideEffect: () => null,
      transitionNote: 'README.md has been updated. Time to commit the change.',
      onAdvance: () => ({ modified: ['README.md'], fileContents: { 'README.md': README_V2 }, activeFile: 'README.md' }),
    },
    {
      id: 'modified-status',
      type: 'command',
      title: 'spot the change',
      instruction:
        'README.md was just modified. Git noticed — but hasn\'t staged it yet.\n\nCheck the state first. Always.\n\nType: git status',
      hint: 'Modified files show in red. Staged files show in green.',
      viewFile: 'README.md',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: gs => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'second-add',
      type: 'command',
      title: 'stage the change',
      instruction:
        'Same command — different context. This is the cycle: every change you want to keep goes through staging first.\n\nType: git add README.md',
      hint: 'git add README.md — stage only what you intend to commit.',
      viewFile: 'README.md',
      accepts: addAccepts,
      getOutput: () => [],
      getNote: cmd => addNote(cmd),
      getSideEffect: gs => ({ staged: ['README.md'], modified: [] }),
    },
    {
      id: 'second-commit',
      type: 'command',
      title: 'commit the change',
      instruction:
        'Write a message that describes what actually changed — not just "update".\n\nType: git commit -m "update README intro"',
      hint: 'Specific messages pay off when you\'re reading history six months from now.',
      viewFile: 'README.md',
      accepts: commitAccepts,
      getOutput: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeShortHash()
        return [
          L(`[main ${hash}] ${msg}`),
          L(' 1 file changed, 4 insertions(+), 1 deletion(-)'),
        ]
      },
      getNote: cmd => commitNote(extractMessage(cmd)),
      getSideEffect: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeHash()
        return {
          staged: [],
          commits: [...gs.commits, { hash, short: hash.slice(0, 7), message: msg, date: fakeDate() }],
        }
      },
    },
    {
      id: 'second-log',
      type: 'command',
      title: 'read your history',
      instruction:
        'Two commits. Two moments in time — both retrievable forever.\n\nType: git log --oneline',
      hint: '--oneline is the compact format. Most developers use it daily.',
      viewFile: 'README.md',
      accepts: logAccepts,
      getOutput: (gs, cmd) => cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs),
      getNote: cmd => logNote(cmd),
      getSideEffect: () => null,
    },

    // ── Part 2: Remotes & GitHub ───────────────────────────────────────────

    {
      id: 'remote-intro',
      type: 'explainer',
      title: 'connect to the world',
      instruction:
        'Your commits live locally — only on this machine.\n\n' +
        'A remote is a copy of your repo hosted in the cloud. GitHub is the most popular host — it\'s where billions of lines of code live.\n\n' +
        'When you push, your commits travel from your machine → to GitHub → accessible anywhere.\n\n' +
        'Next: you\'ll add a remote and push.',
      remoteDiagram: true,
    },
    {
      id: 'git-remote-add',
      type: 'command',
      title: 'point to github',
      instruction:
        'Tell Git where the remote lives. "origin" is the conventional nickname for your main remote — you could call it anything, but everyone uses "origin".\n\nType: git remote add origin https://github.com/learner/my-project.git',
      hint: 'git remote add origin <url> — in a real project, GitHub gives you this URL when you create a new repo.',
      viewFile: 'README.md',
      accepts: cmd => /^git remote add origin .+/.test(cmd.trim()),
      getOutput: () => [],
      getSideEffect: (gs, cmd) => {
        const parts = cmd.trim().split(/\s+/)
        const url   = parts[4] || 'https://github.com/learner/my-project.git'
        return { remote: { name: 'origin', url, pushed: false } }
      },
      transitionNote: 'Remote configured. Now push.',
    },
    {
      id: 'git-push',
      type: 'command',
      title: 'push to origin',
      instruction:
        '-u sets the upstream so future git push and git pull don\'t need the full name.\n\nType: git push -u origin main',
      hint: 'git push -u origin main — the -u flag links your local branch to the remote one.',
      viewFile: 'README.md',
      accepts: cmd => /^git push( -u| --set-upstream)? origin main$/.test(cmd.trim()),
      getOutput: gs => [
        L('Enumerating objects: 6, done.'),
        L('Counting objects: 100% (6/6), done.'),
        L('Delta compression using up to 8 threads'),
        L('Compressing objects: 100% (4/4), done.'),
        L('Writing objects: 100% (6/6), 548 bytes | 548.00 KiB/s, done.'),
        L('Total 6 (delta 0), reused 0 (delta 0), pack-reused 0'),
        DIM('remote:'),
        DIM(`remote: Create a pull request for 'main' on GitHub by visiting:`),
        DIM(`remote:      ${gs.remote?.url || 'https://github.com/learner/my-project.git'}/pull/new/main`),
        DIM('remote:'),
        GRN(`To ${gs.remote?.url || 'https://github.com/learner/my-project.git'}`),
        GRN(' * [new branch]      main -> main'),
        L("branch 'main' set up to track 'origin/main'."),
      ],
      getSideEffect: gs => ({ remote: { ...gs.remote, pushed: true } }),
      transitionNote: 'Your project is now live on GitHub.',
    },
    {
      id: 'github-view',
      type: 'explainer',
      title: 'your repo on github',
      instruction:
        'This is what your repo looks like on GitHub right now. Anyone with the link can see it.\n\nEvery file shows the last commit message that touched it. The README.md is automatically rendered at the bottom.\n\nNext: you\'ll create a branch to work on a new feature.',
      githubView: true,
    },

    // ── Part 3: Branching ──────────────────────────────────────────────────

    {
      id: 'branch-intro',
      type: 'explainer',
      title: 'branches',
      instruction:
        'Branches let you work on something new without touching main.\n\n' +
        'Think of main as the stable, working version. A branch is your scratch pad — commit freely, and only merge when it\'s ready.\n\n' +
        'The most common workflow: branch → commit → push → pull request → merge.\n\n' +
        'Next: you\'ll create a feature-about branch and add a new file.',
      branchDiagram: true,
      onAdvance: () => ({ untracked: ['ABOUT.md'], fileContents: { 'ABOUT.md': ABOUT_FILE }, activeFile: 'ABOUT.md' }),
    },
    {
      id: 'git-checkout-branch',
      type: 'command',
      title: 'create a branch',
      instruction:
        'checkout -b creates a new branch AND switches to it in one step. Name it after what you\'re building.\n\nType: git checkout -b feature-about',
      hint: 'git checkout -b feature-about — the -b flag means "create". Always branch from main.',
      viewFile: 'ABOUT.md',
      accepts: cmd => /^git (checkout -b|switch -c) feature-about$/.test(cmd.trim()),
      getOutput: () => [L("Switched to a new branch 'feature-about'")],
      getSideEffect: gs => ({
        currentBranch: 'feature-about',
        branches: [...(gs.branches || ['main']), 'feature-about'],
      }),
      transitionNote: "You're now on feature-about. ABOUT.md is waiting to be tracked.",
    },
    {
      id: 'feature-add',
      type: 'command',
      title: 'stage the new file',
      instruction:
        'ABOUT.md was created on this branch. Stage it.\n\nType: git add ABOUT.md',
      hint: 'git add ABOUT.md — or git add . to stage everything in the directory.',
      viewFile: 'ABOUT.md',
      accepts: cmd => /^git add (ABOUT\.md|\.|--all|-A)$/.test(cmd.trim()),
      getOutput: () => [],
      getNote: cmd => addNote(cmd),
      getSideEffect: () => ({ staged: ['ABOUT.md'], untracked: [] }),
    },
    {
      id: 'feature-commit',
      type: 'command',
      title: 'commit on the branch',
      instruction:
        'Your commit will live on feature-about — not main. That\'s the whole point of branching: isolated, safe work.\n\nType: git commit -m "add about section"',
      hint: 'Same git commit -m syntax. The commit just lands on a different branch.',
      viewFile: 'ABOUT.md',
      accepts: commitAccepts,
      getOutput: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeShortHash()
        return [
          L(`[feature-about ${hash}] ${msg}`),
          L(' 1 file changed, 4 insertions(+)'),
          L(' create mode 100644 ABOUT.md'),
        ]
      },
      getNote: cmd => commitNote(extractMessage(cmd)),
      getSideEffect: (gs, cmd) => {
        const msg  = extractMessage(cmd)
        const hash = fakeHash()
        return {
          staged: [],
          commits: [...gs.commits, { hash, short: hash.slice(0, 7), message: msg, date: fakeDate(), branch: 'feature-about' }],
        }
      },
    },
    {
      id: 'push-feature',
      type: 'command',
      title: 'push the branch',
      instruction:
        'Push feature-about to GitHub. This makes the branch visible to your team — without touching main.\n\nType: git push origin feature-about',
      hint: 'git push origin feature-about — no -u needed here, unless you want to track it.',
      viewFile: 'ABOUT.md',
      accepts: cmd => /^git push( origin feature-about)?$/.test(cmd.trim()),
      getOutput: gs => [
        L('Enumerating objects: 4, done.'),
        L('Counting objects: 100% (4/4), done.'),
        L('Writing objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.'),
        DIM('remote:'),
        DIM(`remote: Create a pull request for 'feature-about' on GitHub by visiting:`),
        DIM(`remote:      ${gs.remote?.url || 'https://github.com/learner/my-project.git'}/pull/new/feature-about`),
        DIM('remote:'),
        GRN(`To ${gs.remote?.url || 'https://github.com/learner/my-project.git'}`),
        GRN(' * [new branch]      feature-about -> feature-about'),
      ],
      getSideEffect: () => null,
      transitionNote: 'Branch pushed. In a real team, you\'d now open a pull request.',
    },

    // ── Part 4: Pull Requests & Wrap-up ───────────────────────────────────

    {
      id: 'pr-intro',
      type: 'explainer',
      title: 'pull requests',
      prView: true,
      instruction:
        'A pull request (PR) is a proposal to merge your branch into main.\n\n' +
        'Teammates can review your code, leave comments, request changes — and when everyone\'s happy, merge with one click.\n\n' +
        'You\'ve just run the full modern dev workflow:\n\ninit → commit → push → branch → commit → push → PR → merge\n\n' +
        'The sandbox below is now unlocked. Clone any public GitHub repo and explore.',
    },
    {
      id: 'sandbox-unlock',
      type: 'ship-it',
      title: 'sandbox unlocked',
      instruction:
        'You know git.\n\nThe cycle — status · add · commit · push — repeats hundreds of times per project. Every professional developer runs it daily. The only difference between a beginner and a senior developer is how often they check git status.\n\nThe sandbox terminal below is yours. Type git clone https://github.com/any/public-repo and it will fetch the real file tree from GitHub.',
    },
  ],
}
