// Output line builders
const L  = (text, cls = '')  => ({ text, cls })
const DIM = text => L(text, 'dim')
const RED = text => L(text, 'red')
const GRN = text => L(text, 'green')
const YLW = text => L(text, 'yellow')
const BL  = ()   => L('')

export const README_V1 = `# My Project

Hello, world! This is my first project.`

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

const commitAccepts = cmd => /^git commit -m (["']).+\1$/.test(cmd.trim())
const logAccepts    = cmd => /^git log(?: --oneline)?$/.test(cmd.trim())

function extractMessage(cmd) {
  const m = cmd.match(/^git commit -m ["'](.+)["']$/)
  return m ? m[1] : 'commit'
}

function logNote(cmd) {
  if (cmd.trim() === 'git log --oneline')
    return '--oneline gives a compact one-line view. Many developers use it by default.'
  return null
}

function commitNote(msg) {
  const bad = ['update', 'fix', 'changes', 'stuff', 'commit', 'done', 'ok', 'test', 'wip', 'initial']
  if (bad.includes(msg.toLowerCase()))
    return `Accepted — but "${msg}" doesn't tell you much later. Try something specific like "add grade calculator".`
  return null
}

function fakeHash() {
  return Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function fakeShortHash() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function fakeDate() {
  return new Date().toDateString() + ' ' + new Date().toLocaleTimeString()
}

// ─── Lesson factory ───────────────────────────────────────────────────────────
// scriptName: filename of the Python script from Code Bootcamp (e.g. 'grades.py')
// When present, adapts instructions, accepts, and side effects to use it as the hero.

export function createGitLesson(scriptName = null) {
  const hasScript = !!scriptName

  function addAccepts(cmd) {
    const t = cmd.trim()
    if (hasScript) return new RegExp(`^git add (${scriptName.replace('.', '\\.')}|\\.|--all|-A)$`).test(t)
    return /^git add (README\.md|\.|--all|-A)$/.test(t)
  }

  function addSideEffect(gs, cmd) {
    const t     = cmd.trim()
    const isAll = /^git add (\.|--all|-A)$/.test(t)
    if (isAll) return { staged: [...gs.untracked], untracked: [] }
    const named = t.replace(/^git add /, '').trim()
    return {
      staged:    [...(gs.staged || []), named],
      untracked: (gs.untracked || []).filter(f => f !== named),
    }
  }

  function addNote(cmd) {
    const c = cmd.trim()
    if (c === 'git add .' || c === 'git add --all' || c === 'git add -A')
      return hasScript
        ? `Accepted — though git add ${scriptName} is more precise when you want to control what goes into the commit.`
        : 'Accepted — though naming the file (git add README.md) is clearer when working with others.'
    return null
  }

  const primaryFile = hasScript ? scriptName : 'README.md'
  const suggestedMsg = hasScript ? 'add grade calculator' : 'add README'

  return {
    id: 'git-basics',
    title: 'git: zero to ship',

    initialState: {
      initialized:  false,
      branch:       'main',
      currentBranch:'main',
      branches:     ['main'],
      untracked:    ['README.md'],
      staged:       [],
      modified:     [],
      commits:      [],
      remote:       null,
      fileContents: { 'README.md': README_V1 },
      activeFile:   'README.md',
      githubUsername: '',
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
        viewFile: 'README.md',
        accepts: cmd => cmd.trim() === 'git init',
        getOutput: () => [L('Initialized empty Git repository in ~/my-project/.git/')],
        getSideEffect: () => ({ initialized: true }),
      },
      {
        id: 'first-status',
        type: 'command',
        title: 'check the state',
        instruction: hasScript
          ? `You wrote ${scriptName} in Code Bootcamp — it's sitting in your project folder along with a README.md. Git doesn't know about either of them yet.\n\nAlways check the state before doing anything.\n\nType: git status`
          : 'A file called README.md already exists in your project — but Git doesn\'t know about it yet.\n\nAlways check the state before doing anything.\n\nType: git status',
        hint: 'git status — run this constantly. It tells you exactly where you are.',
        viewFile: primaryFile,
        accepts: cmd => cmd.trim() === 'git status',
        getOutput: gs => gitStatusOutput(gs),
        getSideEffect: () => null,
      },
      {
        id: 'git-add',
        type: 'command',
        title: 'stage the file',
        instruction: hasScript
          ? `Git sees ${scriptName} but isn't tracking it. Staging tells Git: "include this in my next snapshot."\n\nName the file specifically — it's the professional habit.\n\nType: git add ${scriptName}`
          : 'Git sees README.md but isn\'t tracking it. Staging means telling Git: "include this in my next snapshot."\n\nName the file specifically — it\'s the professional habit.\n\nType: git add README.md',
        hint: hasScript
          ? `git add ${scriptName} — name the file. git add . stages everything at once, including files you might not intend to commit.`
          : 'git add README.md — name the file. Using git add . stages everything, which can include files you didn\'t intend.',
        viewFile: primaryFile,
        accepts: addAccepts,
        getOutput: () => [],
        getNote: addNote,
        getSideEffect: addSideEffect,
      },
      {
        id: 'staged-status',
        type: 'command',
        title: "verify what's staged",
        instruction: hasScript
          ? `Before committing, always check what's staged — ${scriptName} should appear green.\n\nType: git status`
          : 'Before committing, always verify what\'s staged. This catches mistakes before they\'re permanent.\n\nType: git status',
        hint: 'git status shows staged files in green.',
        viewFile: primaryFile,
        accepts: cmd => cmd.trim() === 'git status',
        getOutput: gs => gitStatusOutput(gs),
        getSideEffect: () => null,
      },
      {
        id: 'first-commit',
        type: 'command',
        title: 'make your first commit',
        instruction: hasScript
          ? `A commit is a permanent snapshot with a message describing what changed. Write something your future self will understand.\n\nType: git commit -m "${suggestedMsg}"`
          : `A commit is a permanent snapshot with a message describing what changed. Write something your future self will understand.\n\nType: git commit -m "${suggestedMsg}"`,
        hint: hasScript
          ? `The message goes in quotes after -m. "${suggestedMsg}" tells future-you exactly what this commit contains.`
          : `The message goes in quotes after -m. Make it specific — "${suggestedMsg}" is better than "stuff".`,
        viewFile: primaryFile,
        accepts: commitAccepts,
        getOutput: (gs, cmd) => {
          const msg    = extractMessage(cmd)
          const hash   = fakeShortHash()
          const staged = gs.staged.length ? gs.staged : [primaryFile]
          return [
            L(`[main (root-commit) ${hash}] ${msg}`),
            L(` ${staged.length} file${staged.length !== 1 ? 's' : ''} changed`),
            ...staged.map(f => L(` create mode 100644 ${f}`)),
          ]
        },
        getNote: cmd => commitNote(extractMessage(cmd)),
        getSideEffect: (gs, cmd) => {
          const msg  = extractMessage(cmd)
          const hash = fakeHash()
          return {
            staged:  [],
            commits: [...gs.commits, { hash, short: hash.slice(0, 7), message: msg, date: fakeDate() }],
          }
        },
      },
      {
        id: 'first-log',
        type: 'command',
        title: 'view your history',
        instruction:
          'Your first commit is saved forever. Now see it in the project history.\n\nType: git log\n\nTip: try git log --oneline for a compact view.',
        hint: 'git log shows every commit. git log --oneline is faster to scan.',
        viewFile: primaryFile,
        accepts: logAccepts,
        getOutput: (gs, cmd) => cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs),
        getNote: cmd => logNote(cmd),
        getSideEffect: () => null,
      },
      {
        id: 'github-signup',
        type: 'github-signup',
        title: 'create your github account',
        instruction:
          'Your commit is saved — on this machine.\n\nGitHub is where code lives online. It\'s free, it\'s what every team in the world uses, and your project will have a real URL you can share.\n\nFill in the form to create your account.',
      },
      {
        id: 'git-remote-add',
        type: 'command',
        title: 'link to github',
        instruction:
          'Welcome to GitHub, @{username}.\n\nYour local project needs to know where its online home is. That address is called a remote.\n\nType: git remote add origin https://github.com/{username}/my-project.git',
        hint: 'git remote add origin <url>\n\n"origin" is the standard name for your main remote.',
        viewFile: primaryFile,
        accepts: cmd => /^git remote add origin https:\/\/github\.com\/.+\/.+/.test(cmd.trim()),
        getOutput: () => [],
        getSideEffect: (gs, cmd) => {
          const url = cmd.trim().split(/\s+/)[4] || 'https://github.com/your-username/my-project.git'
          return { remote: { name: 'origin', url, pushed: false } }
        },
      },
      {
        id: 'git-push',
        type: 'command',
        title: 'ship it',
        instruction:
          'One command. Your commits leave this machine and land on GitHub — live, accessible from any browser, forever.\n\nType: git push -u origin main',
        hint: 'git push -u origin main\n\nThe -u flag links your local branch to origin/main so next time you can just type git push.',
        viewFile: primaryFile,
        accepts: cmd => /^git push( -u| --set-upstream)? origin main$/.test(cmd.trim()),
        getOutput: gs => [
          L('Enumerating objects: 3, done.'),
          L('Counting objects: 100% (3/3), done.'),
          L('Writing objects: 100% (3/3), 312 bytes | 312.00 KiB/s, done.'),
          GRN(`To ${gs.remote?.url || 'https://github.com/your-username/my-project.git'}`),
          GRN(' * [new branch]      main -> main'),
          L("branch 'main' set up to track 'origin/main'."),
        ],
        getSideEffect: gs => ({ remote: { ...gs.remote, pushed: true } }),
      },
      {
        id: 'zero-to-ship',
        type: 'ship-it',
        title: 'zero to ship',
        instruction: hasScript
          ? 'Your project is live at github.com/{username}/my-project.\n\nEvery developer in the world uses this exact workflow:\n\ninit · status · add · commit · push\n\nThe sandbox is yours. Clone your project and run it:\n\ngit clone https://github.com/{username}/my-project.git'
          : 'Your project is live at github.com/{username}/my-project.\n\nEvery developer in the world uses this exact workflow:\n\ninit · status · add · commit · push\n\nThe sandbox is yours — use git clone, touch, nano, and python to explore.',
      },
    ],
  }
}

export const gitBasicsLesson = createGitLesson()
