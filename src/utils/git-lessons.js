// Output line builders
const L  = (text, cls = '')  => ({ text, cls })
const DIM = text => L(text, 'dim')
const RED = text => L(text, 'red')
const GRN = text => L(text, 'green')
const YLW = text => L(text, 'yellow')
const BLD = text => L(text, 'bold')
const BL  = ()   => L('')

// Realistic git output generators keyed to git state
export function gitStatusOutput(gs) {
  if (!gs.initialized) return [L('fatal: not a git repository (or any of the parent directories): .git', 'red')]

  const hasUntracked  = gs.untracked.length > 0
  const hasStaged     = gs.staged.length > 0
  const hasModified   = gs.modified.length > 0
  const hasCommits    = gs.commits.length > 0

  const out = [L(`On branch ${gs.branch}`), BL()]

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
    out.push(YLW(`commit ${c.hash}${i === 0 ? ' (HEAD -> main)' : ''}`))
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
    YLW(`${c.short}${i === 0 ? ' (HEAD -> main)' : ''} ${c.message}`)
  )
}

// Command accepts helpers
const addAccepts   = cmd => /^git add (README\.md|\.|--all|-A)$/.test(cmd.trim())
const commitAccepts = cmd => /^git commit -m (["']).+\1$/.test(cmd.trim())
const logAccepts   = cmd => /^git log(?: --oneline)?$/.test(cmd.trim())

function extractMessage(cmd) {
  const m = cmd.match(/^git commit -m ["'](.+)["']$/)
  return m ? m[1] : 'commit'
}

function addNote(cmd) {
  const c = cmd.trim()
  if (c === 'git add .' || c === 'git add --all' || c === 'git add -A')
    return 'Accepted — though naming the file (git add README.md) is clearer when working with others or reviewing changes.'
  return null
}

function logNote(cmd) {
  if (cmd.trim() === 'git log --oneline')
    return '--oneline gives a compact one-line view. Many developers use it by default.'
  return null
}

function commitNote(msg) {
  const bad = ['update', 'fix', 'changes', 'stuff', 'commit', 'done', 'ok', 'test', 'wip']
  if (bad.includes(msg.toLowerCase()))
    return `Accepted — but "${msg}" doesn't tell you much later. Try "add README" or "update intro section" instead.`
  return null
}

function fakeHash() {
  return Math.random().toString(16).slice(2, 9)
}

function fakeDate() {
  return new Date().toDateString() + ' ' + new Date().toLocaleTimeString()
}

// ─── The lesson ───────────────────────────────────────────────────────────────

export const gitBasicsLesson = {
  id: 'git-basics',
  title: 'your first git repo',

  // Initial git state
  initialState: {
    initialized: false,
    branch: 'main',
    untracked:  ['README.md'],
    staged:     [],
    modified:   [],
    commits:    [],
  },

  steps: [
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
      accepts: cmd => cmd.trim() === 'git init',
      getOutput: () => [
        L('Initialized empty Git repository in ~/my-project/.git/')
      ],
      getSideEffect: () => ({ initialized: true }),
    },
    {
      id: 'first-status',
      type: 'command',
      title: 'check the state',
      instruction:
        'A file called README.md already exists in your project — but Git doesn\'t know about it yet.\n\nAlways check the state before doing anything.\n\nType: git status',
      hint: 'git status — run this constantly. It tells you exactly where you are.',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: (gs) => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'git-add',
      type: 'command',
      title: 'stage the file',
      instruction:
        'Git sees README.md but isn\'t tracking it. Staging means telling Git: "include this in my next snapshot."\n\nName the file specifically — it\'s the professional habit.\n\nType: git add README.md',
      hint: 'git add README.md — name the file. Using git add . works too but stages everything, which can include files you didn\'t intend.',
      accepts: addAccepts,
      getOutput: () => [],
      getNote: (cmd) => addNote(cmd),
      getSideEffect: () => ({ staged: ['README.md'], untracked: [] }),
    },
    {
      id: 'staged-status',
      type: 'command',
      title: 'verify what\'s staged',
      instruction:
        'Before committing, always verify what\'s staged. This catches mistakes before they\'re permanent.\n\nType: git status',
      hint: 'git status shows staged files in green.',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: (gs) => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'first-commit',
      type: 'command',
      title: 'make your first commit',
      instruction:
        'A commit is a permanent snapshot with a message describing what changed. Write something your future self will understand.\n\nType: git commit -m "add README"',
      hint: 'The message goes in quotes after -m. Make it specific — "add README" is better than "stuff".',
      accepts: commitAccepts,
      getOutput: (gs, cmd) => {
        const msg = extractMessage(cmd)
        const hash = fakeHash()
        return [
          L(`[main (root-commit) ${hash}] ${msg}`),
          L(' 1 file changed, 1 insertion(+)'),
          L(' create mode 100644 README.md'),
        ]
      },
      getNote: (cmd) => commitNote(extractMessage(cmd)),
      getSideEffect: (gs, cmd) => {
        const msg = extractMessage(cmd)
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
      hint: 'git log shows every commit, newest first. git log --oneline is faster to scan.',
      accepts: logAccepts,
      getOutput: (gs, cmd) => cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs),
      getNote: (cmd) => logNote(cmd),
      getSideEffect: () => null,
      transitionNote: 'README.md has been updated. Time to commit the change.',
      onAdvance: () => ({ modified: ['README.md'] }),
    },
    {
      id: 'modified-status',
      type: 'command',
      title: 'spot the change',
      instruction:
        'README.md was just modified. Git noticed — but hasn\'t staged it yet.\n\nCheck the state first. Always.\n\nType: git status',
      hint: 'Modified files show in red. Staged files show in green.',
      accepts: cmd => cmd.trim() === 'git status',
      getOutput: (gs) => gitStatusOutput(gs),
      getSideEffect: () => null,
    },
    {
      id: 'second-add',
      type: 'command',
      title: 'stage the change',
      instruction:
        'Same command — different context. This is the cycle: every change you want to keep goes through staging first.\n\nType: git add README.md',
      hint: 'git add README.md — stage only what you intend to commit.',
      accepts: addAccepts,
      getOutput: () => [],
      getNote: (cmd) => addNote(cmd),
      getSideEffect: (gs) => ({ staged: ['README.md'], modified: [] }),
    },
    {
      id: 'second-commit',
      type: 'command',
      title: 'commit the change',
      instruction:
        'Write a message that describes what actually changed in README.md — not just "update".\n\nType: git commit -m "update README intro"',
      hint: 'Specific messages pay off when you\'re reading history six months from now.',
      accepts: commitAccepts,
      getOutput: (gs, cmd) => {
        const msg = extractMessage(cmd)
        const hash = fakeHash()
        return [
          L(`[main ${hash}] ${msg}`),
          L(' 1 file changed, 2 insertions(+), 1 deletion(-)'),
        ]
      },
      getNote: (cmd) => commitNote(extractMessage(cmd)),
      getSideEffect: (gs, cmd) => {
        const msg = extractMessage(cmd)
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
      accepts: logAccepts,
      getOutput: (gs, cmd) => cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs),
      getNote: (cmd) => logNote(cmd),
      getSideEffect: () => null,
    },
    {
      id: 'ship-it',
      type: 'ship-it',
      title: 'you know git',
      instruction:
        'You just ran the complete Git workflow twice:\n\ninit → status → add → status → commit → log\n\nThat\'s the loop. Every professional developer runs it dozens of times a day. The only difference between a beginner and a senior developer is how often they check git status.',
    },
  ],
}
