import { useState, useEffect, useRef } from 'react'
import {
  gitBasicsLesson,
  gitStatusOutput,
  gitLogOutput,
  gitLogOneline,
  README_V1, README_V2, ABOUT_FILE,
} from '../../../utils/git-lessons'
import { playChime } from '../../../utils/sound'
import './git-sim.css'

const LESSON_PROMPT  = 'learner@athena:~/my-project'
const GIT_STORAGE_KEY = 'athena_git_session'

function loadGitSession(lesson) {
  try {
    const raw = localStorage.getItem(GIT_STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved.stepIndex >= lesson.steps.length) return null
    return saved
  } catch { return null }
}

function saveGitSession(data) {
  try { localStorage.setItem(GIT_STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function clearGitSession() {
  try { localStorage.removeItem(GIT_STORAGE_KEY) } catch {}
}

// ─── File Tree ────────────────────────────────────────────────────────────────
function FileTree({ gs }) {
  const committed = [
    ...(gs.commits.length > 0 ? ['README.md'] : []),
    ...(gs.commits.some(c => c.branch === 'feature-about') &&
        !gs.staged.includes('ABOUT.md') &&
        !gs.untracked.includes('ABOUT.md') &&
        !gs.modified.includes('ABOUT.md')
      ? ['ABOUT.md'] : []),
  ]

  return (
    <div className="gs-tree">
      <div className="gs-tree__root">
        📁 my-project/ <span className="gs-tree__branch">({gs.currentBranch || gs.branch})</span>
      </div>
      {gs.initialized && <div className="gs-tree__file gs-tree__file--git">  📁 .git/</div>}
      {!gs.initialized && gs.untracked.length === 0 && gs.staged.length === 0 && (
        <div className="gs-tree__file gs-tree__file--dim">  (empty)</div>
      )}
      {committed.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--committed">  📄 {f}</div>
      ))}
      {gs.modified.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--modified">  📄 {f} <span>M</span></div>
      ))}
      {gs.staged.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--staged">  📄 {f} <span>S</span></div>
      ))}
      {gs.untracked.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--untracked">  📄 {f} <span>?</span></div>
      ))}
    </div>
  )
}

// ─── File Viewer ──────────────────────────────────────────────────────────────
function FileViewer({ filename, content }) {
  if (!filename || content == null) return null
  return (
    <div className="gs-file-viewer">
      <div className="gs-file-viewer__bar">
        <span className="gs-file-viewer__icon">📄</span>
        <span className="gs-file-viewer__name">{filename}</span>
      </div>
      <pre className="gs-file-viewer__content">{content}</pre>
    </div>
  )
}

// ─── Editor Modal ─────────────────────────────────────────────────────────────
function EditorModal({ filename, initialContent, editorType, onSave, onCancel }) {
  const [text,     setText]     = useState(initialContent || '')
  const [vimMode,  setVimMode]  = useState('normal')
  const [cmdLine,  setCmdLine]  = useState('')
  const [dirty,    setDirty]    = useState(false)
  const textareaRef  = useRef(null)
  const containerRef = useRef(null)

  const isVim  = editorType === 'vim' || editorType === 'vi'
  const isNano = !isVim

  useEffect(() => {
    if (isNano) { textareaRef.current?.focus() }
    else        { containerRef.current?.focus() }
  }, [])

  useEffect(() => {
    if (!isVim) return
    if (vimMode === 'insert') textareaRef.current?.focus()
    else                      containerRef.current?.focus()
  }, [vimMode, isVim])

  function handleNanoKeyDown(e) {
    if (e.ctrlKey && (e.key === 's' || e.key === 'o')) { e.preventDefault(); onSave(text); return }
    if (e.ctrlKey && e.key === 'x')                    { e.preventDefault(); onCancel(); return }
    setDirty(true)
  }

  function handleVimContainerKeyDown(e) {
    if (vimMode === 'normal') {
      e.preventDefault()
      if ('iIaAoO'.includes(e.key)) { setVimMode('insert') }
      else if (e.key === ':')       { setVimMode('cmd'); setCmdLine(':') }
    } else if (vimMode === 'cmd') {
      e.preventDefault()
      if (e.key === 'Enter') {
        const c = cmdLine.slice(1)
        if (c === 'wq' || c === 'wq!' || c === 'x') { onSave(text) }
        else if (c === 'q' || c === 'q!')             { onCancel() }
        else if (c === 'w')                           { onSave(text) }
        setVimMode('normal'); setCmdLine('')
      } else if (e.key === 'Escape') {
        setVimMode('normal'); setCmdLine('')
      } else if (e.key === 'Backspace') {
        setCmdLine(p => p.length > 1 ? p.slice(0, -1) : ':')
      } else if (e.key.length === 1) {
        setCmdLine(p => p + e.key)
      }
    }
  }

  function handleVimTextareaKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); setVimMode('normal') }
    setDirty(true)
  }

  const lineCount = Math.max(text.split('\n').length, 12)

  return (
    <div
      className={`gs-editor gs-editor--${isVim ? 'vim' : 'nano'}`}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={isVim ? handleVimContainerKeyDown : undefined}
    >
      {/* Title bar */}
      <div className="gs-editor__bar">
        {isNano && <span className="gs-editor__nano-label">GNU nano</span>}
        <span className="gs-editor__filename">{filename}</span>
        {dirty && isNano && <span className="gs-editor__modified">Modified</span>}
        {isVim && vimMode === 'insert' && <span className="gs-editor__mode gs-editor__mode--insert">INSERT</span>}
        {isVim && vimMode === 'normal' && <span className="gs-editor__mode gs-editor__mode--normal">NORMAL</span>}
        {isVim && vimMode === 'cmd'    && <span className="gs-editor__mode gs-editor__mode--normal">COMMAND</span>}
      </div>

      {/* Editor body: gutter + textarea */}
      <div className="gs-editor__body">
        <div className="gs-editor__gutter">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="gs-editor__line-num">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="gs-editor__textarea"
          value={text}
          onChange={e => { setText(e.target.value); setDirty(true) }}
          onKeyDown={isVim ? handleVimTextareaKeyDown : handleNanoKeyDown}
          readOnly={isVim && vimMode !== 'insert'}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Status bar */}
      <div className="gs-editor__statusbar">
        {isNano && (
          <div className="gs-editor__nano-shortcuts">
            <span><kbd>^S</kbd> Save</span>
            <span><kbd>^X</kbd> Exit</span>
            <span><kbd>^O</kbd> Write Out</span>
          </div>
        )}
        {isVim && vimMode === 'cmd' && (
          <span className="gs-editor__cmdline">{cmdLine}<span className="gs-editor__cursor">█</span></span>
        )}
        {isVim && vimMode !== 'cmd' && (
          <span className="gs-editor__vim-hint">
            {vimMode === 'insert' ? 'Esc → normal mode' : 'i = insert  :wq = save & quit  :q! = discard'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── GitHub View ──────────────────────────────────────────────────────────────
function GitHubView({ gs }) {
  const repoUrl  = gs.remote?.url || 'https://github.com/learner/my-project.git'
  const repoName = repoUrl.replace(/\.git$/, '').split('/').slice(-2).join('/')
  return (
    <div className="gs-github">
      <div className="gs-github__header">
        <span className="gs-github__logo">⊙ GitHub</span>
        <span className="gs-github__repo">{repoName}</span>
        <span className="gs-github__badge">Public</span>
      </div>
      <div className="gs-github__meta">
        <span className="gs-github__branch">⎇ main</span>
        <span className="gs-github__commits">{gs.commits.length} commit{gs.commits.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="gs-github__files">
        {gs.commits.slice(-1).map(c => (
          <div key="readme" className="gs-github__file-row">
            <span className="gs-github__file-icon">📄</span>
            <span className="gs-github__file-name">README.md</span>
            <span className="gs-github__file-msg">{c.message}</span>
            <span className="gs-github__file-age">just now</span>
          </div>
        ))}
      </div>
      <div className="gs-github__readme">
        <div className="gs-github__readme-bar">📄 README.md</div>
        <div className="gs-github__readme-body">
          <strong>My Project</strong>
          <p>Hello, world! This is my first project.</p>
          <strong>Getting Started</strong>
          <p>Clone this repo and open index.html in your browser.</p>
        </div>
      </div>
    </div>
  )
}

// ─── PR View ──────────────────────────────────────────────────────────────────
function PRView({ gs }) {
  return (
    <div className="gs-pr">
      <div className="gs-pr__header">
        <span className="gs-pr__badge gs-pr__badge--open">Open</span>
        <span className="gs-pr__title">Add about section</span>
      </div>
      <div className="gs-pr__meta">
        <span>learner</span> wants to merge <span className="gs-pr__branch">feature-about</span> into <span className="gs-pr__branch">main</span>
      </div>
      <div className="gs-pr__files">
        <div className="gs-pr__file-header">1 file changed</div>
        <div className="gs-pr__diff">
          <div className="gs-pr__diff-name">ABOUT.md</div>
          {ABOUT_FILE.split('\n').map((line, i) => (
            <div key={i} className="gs-pr__diff-line gs-pr__diff-line--add">+ {line}</div>
          ))}
        </div>
      </div>
      <div className="gs-pr__actions">
        <div className="gs-pr__btn gs-pr__btn--merge">✓ Merge pull request</div>
        <div className="gs-pr__btn-sub">In a real team, teammates review this first.</div>
      </div>
    </div>
  )
}

// ─── Diagrams ─────────────────────────────────────────────────────────────────
function RemoteDiagram() {
  return (
    <div className="gs-remote-diag">
      <div className="gs-remote-diag__box gs-remote-diag__box--local">
        <div className="gs-remote-diag__label">your machine</div>
        <div className="gs-remote-diag__inner">~/my-project/.git</div>
      </div>
      <div className="gs-remote-diag__arrow">
        <span>git push →</span>
        <span className="gs-remote-diag__arrow-sub">← git pull</span>
      </div>
      <div className="gs-remote-diag__box gs-remote-diag__box--remote">
        <div className="gs-remote-diag__label">github.com</div>
        <div className="gs-remote-diag__inner">origin / main</div>
      </div>
    </div>
  )
}

function BranchDiagram() {
  return (
    <div className="gs-branch-diag">
      <div className="gs-branch-diag__track">
        <div className="gs-branch-diag__dot" />
        <div className="gs-branch-diag__dot" />
        <div className="gs-branch-diag__dot gs-branch-diag__dot--fork" />
        <div className="gs-branch-diag__label-main">main</div>
      </div>
      <div className="gs-branch-diag__feature">
        <div className="gs-branch-diag__dot gs-branch-diag__dot--feature" />
        <div className="gs-branch-diag__dot gs-branch-diag__dot--feature" />
        <div className="gs-branch-diag__dot gs-branch-diag__dot--merge" />
        <div className="gs-branch-diag__label-feature">feature-about</div>
      </div>
    </div>
  )
}

// ─── Terminal output line ─────────────────────────────────────────────────────
function OutLine({ line }) {
  return <div className={`gs-out gs-out--${line.cls || 'default'}`}>{line.text || ' '}</div>
}

// ─── Off-script handler (lesson mode) ────────────────────────────────────────
function handleOffScript(cmd, gs) {
  const trimmed = cmd.trim()
  const parts   = trimmed.split(/\s+/)
  const [prog, sub, ...rest] = parts

  const L   = (t, c = '') => ({ text: t, cls: c })
  const DIM = t => L(t, 'dim')
  const RED = t => L(t, 'red')
  const GRN = t => L(t, 'green')

  if (prog !== 'git') {
    if (prog === 'ls') {
      const files = [
        ...(gs.commits.length ? ['README.md'] : []),
        ...(gs.commits.some(c => c.branch === 'feature-about') ? ['ABOUT.md'] : []),
        ...gs.untracked, ...gs.staged, ...gs.modified,
        ...(gs.initialized ? ['.git'] : []),
      ]
      return [L(files.length ? files.join('  ') : '(empty)')]
    }
    if (prog === 'pwd') return [L('/home/learner/my-project')]
    if (prog === 'cat') {
      const fname = rest[0]
      if (fname && gs.fileContents?.[fname]) return [L(gs.fileContents[fname])]
      if (fname) return [RED(`cat: ${fname}: No such file or directory`)]
      return [RED('cat: missing operand')]
    }
    if (prog === 'touch' || prog === 'nano' || prog === 'vim' || prog === 'vi' || prog === 'mkdir' || prog === 'rm') {
      return [DIM(`${prog} unlocks in the sandbox — finish the lesson to access the free terminal`)]
    }
    if (prog === 'clear') return []
    if (prog === 'echo') return [L(rest.join(' '))]
    if (prog === 'help') return [DIM('git commands: init · status · add · commit · log · diff · branch · checkout')]
    return [RED(`bash: ${prog}: command not found`)]
  }

  if (!gs.initialized && sub !== 'init')
    return [RED('fatal: not a git repository (or any of the parent directories): .git')]

  switch (sub) {
    case 'status':  return gitStatusOutput(gs)
    case 'log':     return trimmed.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs)
    case 'init':
      return gs.initialized
        ? [L('Reinitialized existing Git repository in ~/my-project/.git/')]
        : [RED('fatal: not handled here')]
    case 'add':
      return rest[0] ? [DIM('(staged — run git status to verify)')] : [RED("Nothing specified, nothing added.")]
    case 'commit':
      return trimmed.includes('-m')
        ? [L('nothing to commit, working tree clean')]
        : [DIM('hint: use git commit -m "message"')]
    case 'diff':
      return gs.modified.length ? [DIM('-old content\n+new content')] : [DIM('(no changes)')]
    case 'remote':
      if (rest[0] === '-v') {
        if (!gs.remote) return [RED('fatal: no remotes configured')]
        return [L(`origin\t${gs.remote.url} (fetch)`), L(`origin\t${gs.remote.url} (push)`)]
      }
      return [DIM('(use git remote -v to list remotes)')]
    case 'push':
      return gs.remote ? [GRN('Everything up-to-date')] : [RED("fatal: 'origin' does not appear to be a git repository")]
    case 'pull':
      return gs.remote ? [L('Already up to date.')] : [RED("fatal: 'origin' does not appear to be a git repository")]
    case 'branch':
      return (gs.branches || ['main']).map(b =>
        L(`${b === (gs.currentBranch || gs.branch) ? '* ' : '  '}${b}`, b === (gs.currentBranch || gs.branch) ? 'green' : '')
      )
    case 'checkout': case 'switch':
      return [DIM('(follow the lesson steps to checkout a branch)')]
    case 'merge':
      return [DIM('(try git merge in sandbox mode after the lesson)')]
    case 'help': case '--help':
      return [DIM('Common commands: init, status, add, commit, log, diff, remote, push, pull, branch, checkout')]
    default:
      return [RED(`git: '${sub}' is not a git command. See 'git --help'.`)]
  }
}

// ─── Sandbox Terminal ─────────────────────────────────────────────────────────
function SandboxTerminal({ lessonGitState }) {
  const [history,    setHistory]    = useState([])
  const [input,      setInput]      = useState('')
  const [sandboxGs,  setSandboxGs]  = useState(() => ({
    ...lessonGitState,
    currentBranch: 'main',
    fileContents: { 'README.md': README_V2, 'ABOUT.md': ABOUT_FILE },
  }))
  const [cwd,        setCwd]        = useState('~/my-project')
  const [cloneData,  setCloneData]  = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [editorOpen, setEditorOpen] = useState(null) // { filename, content, type }

  const inputRef      = useRef(null)
  const bottomRef     = useRef(null)
  const cmdHistoryRef = useRef([])
  const cmdIdxRef     = useRef(-1)
  // Keep a ref to sandboxGs so async callbacks read latest state
  const gsRef         = useRef(sandboxGs)
  useEffect(() => { gsRef.current = sandboxGs }, [sandboxGs])

  useEffect(() => { if (!editorOpen) inputRef.current?.focus() }, [editorOpen])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const L   = (t, c = '') => ({ text: t, cls: c })
  const DIM = t => L(t, 'dim')
  const RED = t => L(t, 'red')
  const GRN = t => L(t, 'green')

  function push(prompt, cmd, lines) {
    setHistory(prev => [...prev, { prompt, cmd, lines }])
  }

  function prompt_str() { return `learner@athena:${cwd}` }

  // ── Editor callbacks ────────────────────────────────────────────────────────
  function handleEditorSave(filename, newContent) {
    setSandboxGs(prev => {
      const fileExists  = filename in (prev.fileContents || {})
      const isCommitted = fileExists &&
        !prev.untracked.includes(filename) &&
        !prev.staged.includes(filename) &&
        !prev.modified.includes(filename)
      const isNew = !fileExists && !prev.untracked.includes(filename)

      return {
        ...prev,
        fileContents: { ...(prev.fileContents || {}), [filename]: newContent },
        modified: isCommitted && !prev.modified.includes(filename)
          ? [...prev.modified, filename] : prev.modified,
        untracked: isNew ? [...prev.untracked, filename] : prev.untracked,
      }
    })
    setHistory(prev => [...prev, {
      prompt: `learner@athena:${cwd}`,
      cmd: `(${editorOpen.type}: saved ${filename})`,
      lines: [L(`"${filename}" written`, 'dim')],
    }])
    setEditorOpen(null)
  }

  function handleEditorCancel() {
    setHistory(prev => [...prev, {
      prompt: `learner@athena:${cwd}`,
      cmd: `(${editorOpen?.type}: quit without saving)`,
      lines: [],
    }])
    setEditorOpen(null)
  }

  // ── GitHub clone ─────────────────────────────────────────────────────────────
  async function handleClone(url) {
    const m = url.match(/github\.com\/([^/\s]+)\/([^/\s.]+)/)
    if (!m) {
      push(prompt_str(), `git clone ${url}`, [RED('fatal: repository not found or invalid GitHub URL')])
      return
    }
    const [, owner, repo] = m
    setLoading(true)
    push(prompt_str(), `git clone ${url}`, [DIM(`Cloning into '${repo}'...`)])

    try {
      const [repoRes, contentsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`),
        fetch(`https://api.github.com/repos/${owner}/${repo}/contents`),
      ])
      if (!repoRes.ok) {
        setLoading(false)
        setHistory(prev => { const n = [...prev]; n[n.length-1].lines.push(RED(`fatal: repository '${url}' not found`)); return n })
        return
      }
      const repoInfo = await repoRes.json()
      const contents = contentsRes.ok ? await contentsRes.json() : []
      const files    = Array.isArray(contents) ? contents.filter(f => f.type === 'file') : []
      const dirs     = Array.isArray(contents) ? contents.filter(f => f.type === 'dir')  : []

      const newFs = {}
      files.forEach(f => { newFs[f.name] = null })

      const newGs = {
        initialized: true,
        branch: repoInfo.default_branch || 'main',
        currentBranch: repoInfo.default_branch || 'main',
        branches: [repoInfo.default_branch || 'main'],
        untracked: [], staged: [], modified: [],
        commits: [{ hash: 'a'.repeat(40), short: 'abcdef1', message: repoInfo.description || 'initial commit', date: repoInfo.updated_at }],
        remote: { name: 'origin', url, pushed: true },
        fileContents: newFs,
        _repoOwner: owner, _repoName: repo,
      }

      setSandboxGs(newGs)
      setCwd(`~/${repo}`)
      setCloneData({ owner, repo, files, dirs, repoInfo })
      setLoading(false)

      setHistory(prev => {
        const n = [...prev]
        n[n.length-1].lines = [
          DIM(`Cloning into '${repo}'...`),
          DIM('remote: Enumerating objects: done.'),
          DIM(`remote: Counting objects: 100% (${files.length + dirs.length}/${files.length + dirs.length}), done.`),
          GRN(`✓ Cloned ${owner}/${repo}`),
          L(`${files.length} file${files.length !== 1 ? 's' : ''}${dirs.length ? `, ${dirs.length} dir${dirs.length !== 1 ? 's' : ''}` : ''} · ${repoInfo.stargazers_count ?? 0} ★`),
          repoInfo.description ? DIM(repoInfo.description) : DIM('(no description)'),
          DIM(`cd ${repo} to explore`),
        ]
        return n
      })
    } catch {
      setLoading(false)
      setHistory(prev => { const n = [...prev]; n[n.length-1].lines.push(RED('error: could not reach GitHub — check your connection')); return n })
    }
  }

  async function fetchFileContent(filename) {
    const gs = gsRef.current
    if (!gs._repoOwner) return null
    try {
      const res = await fetch(`https://api.github.com/repos/${gs._repoOwner}/${gs._repoName}/contents/${filename}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.encoding === 'base64' ? atob(data.content.replace(/\n/g, '')) : null
    } catch { return null }
  }

  // ── Main command handler ──────────────────────────────────────────────────
  async function handleCommand() {
    const cmd = input.trim()
    if (!cmd) return
    setInput('')
    cmdHistoryRef.current = [cmd, ...cmdHistoryRef.current.slice(0, 49)]
    cmdIdxRef.current = -1

    const parts = cmd.split(/\s+/)
    const [prog, sub, ...rest] = parts
    const gs = sandboxGs

    // ── Editor ────────────────────────────────────────────────────────────────
    if (prog === 'nano' || prog === 'vim' || prog === 'vi') {
      const filename = rest[0]
      if (!filename) { push(prompt_str(), cmd, [RED(`${prog}: no file specified`)]); return }
      const localContent = gs.fileContents?.[filename]
      if (localContent === null) {
        // Uncached — fetch from GitHub first
        push(prompt_str(), cmd, [DIM(`fetching ${filename}…`)])
        const fetched = await fetchFileContent(filename)
        const content = fetched ?? ''
        setSandboxGs(prev => ({ ...prev, fileContents: { ...prev.fileContents, [filename]: content } }))
        setHistory(prev => prev.slice(0, -1)) // drop "fetching..." line
        setEditorOpen({ filename, content, type: prog })
      } else {
        setEditorOpen({ filename, content: localContent ?? '', type: prog })
      }
      return
    }

    // ── touch ─────────────────────────────────────────────────────────────────
    if (prog === 'touch') {
      const filename = rest[0]
      if (!filename) { push(prompt_str(), cmd, [RED('touch: missing file operand')]); return }
      setSandboxGs(prev => {
        if (prev.fileContents?.[filename] !== undefined || prev.untracked.includes(filename)) return prev
        return {
          ...prev,
          fileContents: { ...prev.fileContents, [filename]: '' },
          untracked: [...prev.untracked, filename],
        }
      })
      push(prompt_str(), cmd, [])
      return
    }

    // ── python / python3 ─────────────────────────────────────────────────────
    if (prog === 'python' || prog === 'python3') {
      const filename = rest[0]
      if (!filename) { push(prompt_str(), cmd, [RED('usage: python <script.py>')]); return }
      const content = gs.fileContents?.[filename]
      if (content === undefined || content === null) {
        push(prompt_str(), cmd, [RED(`python: can't open file '${filename}': No such file or directory`)]); return
      }
      if (!content.trim()) { push(prompt_str(), cmd, [DIM('(empty file — nothing to run)')]); return }
      push(prompt_str(), cmd, [DIM('loading Python runtime…')])
      setLoading(true)
      try {
        const { runPython } = await import('../../../utils/pyodide-runner')
        const { output, error } = await runPython(content, status => {
          if (status === 'running') {
            setHistory(prev => {
              const n = [...prev]
              n[n.length - 1].lines = [DIM(`running ${filename}…`)]
              return n
            })
          }
        })
        setLoading(false)
        setHistory(prev => {
          const n = [...prev]
          const lines = []
          if (output) output.split('\n').forEach(l => lines.push(L(l)))
          if (error)  error.split('\n').forEach(l  => lines.push(RED(l)))
          if (!output && !error) lines.push(DIM('(no output)'))
          n[n.length - 1].lines = lines
          return n
        })
      } catch {
        setLoading(false)
        setHistory(prev => {
          const n = [...prev]
          n[n.length - 1].lines = [RED('python: failed to load runtime — check your connection')]
          return n
        })
      }
      return
    }

    // ── mkdir ─────────────────────────────────────────────────────────────────
    if (prog === 'mkdir') {
      const dirname = rest[0]
      if (!dirname) { push(prompt_str(), cmd, [RED('mkdir: missing operand')]); return }
      push(prompt_str(), cmd, [])
      return
    }

    // ── rm ────────────────────────────────────────────────────────────────────
    if (prog === 'rm') {
      const target = rest.find(a => !a.startsWith('-'))
      if (!target) { push(prompt_str(), cmd, [RED('rm: missing operand')]); return }
      const exists = gs.fileContents?.[target] !== undefined ||
                     gs.untracked.includes(target) ||
                     gs.staged.includes(target) ||
                     gs.modified.includes(target)
      if (!exists) { push(prompt_str(), cmd, [RED(`rm: cannot remove '${target}': No such file or directory`)]); return }
      setSandboxGs(prev => {
        const newContents = { ...prev.fileContents }
        delete newContents[target]
        return {
          ...prev,
          fileContents: newContents,
          untracked: prev.untracked.filter(f => f !== target),
          modified:  prev.modified.filter(f  => f !== target),
          staged:    prev.staged.filter(f    => f !== target),
        }
      })
      push(prompt_str(), cmd, [])
      return
    }

    // ── clear ─────────────────────────────────────────────────────────────────
    if (prog === 'clear') {
      setHistory([])
      return
    }

    // ── echo ──────────────────────────────────────────────────────────────────
    if (prog === 'echo') {
      push(prompt_str(), cmd, [L(rest.join(' '))])
      return
    }

    // ── git commands ──────────────────────────────────────────────────────────
    if (prog === 'git' && sub === 'clone') {
      await handleClone(rest[0] || '')
      return
    }

    if (prog === 'git' && sub === 'add') {
      const target = rest[0]
      if (!target) { push(prompt_str(), cmd, [RED("Nothing specified, nothing added.")]); return }
      const all = target === '.' || target === '--all' || target === '-A'
      const toStage = all
        ? [...gs.untracked, ...gs.modified]
        : [...gs.untracked, ...gs.modified].includes(target) ? [target] : []
      if (!toStage.length) { push(prompt_str(), cmd, [DIM('nothing to stage (already staged or not tracked)')]); return }
      setSandboxGs(prev => ({
        ...prev,
        staged:    [...prev.staged,    ...toStage.filter(f => !prev.staged.includes(f))],
        untracked: prev.untracked.filter(f => !toStage.includes(f)),
        modified:  prev.modified.filter( f => !toStage.includes(f)),
      }))
      push(prompt_str(), cmd, [])
      return
    }

    if (prog === 'git' && sub === 'commit') {
      const msgMatch = cmd.match(/git commit -m ["'](.+)["']/)
      if (!msgMatch) { push(prompt_str(), cmd, [DIM('hint: git commit -m "your message"')]); return }
      const msg = msgMatch[1]
      const stagedNow = [...gs.staged]
      if (!stagedNow.length) { push(prompt_str(), cmd, [L('nothing to commit, working tree clean')]); return }
      const hash  = Array.from({ length: 40 }, () => Math.floor(Math.random()*16).toString(16)).join('')
      const short = hash.slice(0, 7)
      setSandboxGs(prev => ({
        ...prev,
        staged: [],
        commits: [...prev.commits, { hash, short, message: msg, date: new Date().toDateString(), branch: prev.currentBranch }],
      }))
      push(prompt_str(), cmd, [
        L(`[${gs.currentBranch || 'main'} ${short}] ${msg}`),
        L(` ${stagedNow.length} file${stagedNow.length !== 1 ? 's' : ''} changed`),
      ])
      return
    }

    if (prog === 'git' && sub === 'status') {
      push(prompt_str(), cmd, gitStatusOutput(gs)); return
    }

    if (prog === 'git' && sub === 'log') {
      push(prompt_str(), cmd, cmd.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs)); return
    }

    if (prog === 'git' && sub === 'diff') {
      if (!gs.modified.length && !gs.staged.length) {
        push(prompt_str(), cmd, [DIM('(no changes)')]); return
      }
      const changed = [...gs.modified, ...gs.staged]
      const out = changed.flatMap(f => [
        L(`diff --git a/${f} b/${f}`, 'yellow'),
        L(`--- a/${f}`, 'red'),
        L(`+++ b/${f}`, 'green'),
        L(`@@ -1,3 +1,5 @@`, 'dim'),
        L(' (existing content)', 'dim'),
        GRN(`+(your edits to ${f})`),
      ])
      push(prompt_str(), cmd, out); return
    }

    if (prog === 'git' && sub === 'branch') {
      const branches = gs.branches || ['main']
      push(prompt_str(), cmd, branches.map(b =>
        L(`${b === (gs.currentBranch || 'main') ? '* ' : '  '}${b}`, b === (gs.currentBranch || 'main') ? 'green' : '')
      )); return
    }

    if (prog === 'git' && (sub === 'checkout' || sub === 'switch')) {
      const newBranch = rest[0] === '-b' ? rest[1] : rest[0]
      const isCreate  = rest[0] === '-b' || sub === 'switch' && rest[0] === '-c'
      if (!newBranch) { push(prompt_str(), cmd, [RED('usage: git checkout <branch>')]); return }
      if (isCreate) {
        setSandboxGs(prev => ({
          ...prev,
          currentBranch: newBranch,
          branches: prev.branches.includes(newBranch) ? prev.branches : [...prev.branches, newBranch],
        }))
        push(prompt_str(), cmd, [L(`Switched to a new branch '${newBranch}'`)]); return
      }
      if (!(gs.branches || ['main']).includes(newBranch)) {
        push(prompt_str(), cmd, [RED(`error: pathspec '${newBranch}' did not match any known branch`)]); return
      }
      setSandboxGs(prev => ({ ...prev, currentBranch: newBranch }))
      push(prompt_str(), cmd, [L(`Switched to branch '${newBranch}'`)]); return
    }

    if (prog === 'git' && sub === 'merge') {
      const branch = rest[0]
      if (!branch) { push(prompt_str(), cmd, [RED('usage: git merge <branch>')]); return }
      if (!(gs.branches || []).includes(branch)) {
        push(prompt_str(), cmd, [RED(`merge: ${branch} - not something we can merge`)]); return
      }
      push(prompt_str(), cmd, [
        L(`Updating ${gs.commits[gs.commits.length-2]?.short || 'abcdef1'}..${gs.commits[gs.commits.length-1]?.short || 'fedcba9'}`),
        L('Fast-forward'),
        GRN(' ABOUT.md | 4 ++++'),
        L(' 1 file changed, 4 insertions(+)'),
        GRN(' create mode 100644 ABOUT.md'),
      ]); return
    }

    if (prog === 'git' && sub === 'remote') {
      if (rest[0] === '-v') {
        if (!gs.remote) { push(prompt_str(), cmd, [L('(no remotes configured)')]); return }
        push(prompt_str(), cmd, [
          L(`origin\t${gs.remote.url} (fetch)`),
          L(`origin\t${gs.remote.url} (push)`),
        ]); return
      }
      push(prompt_str(), cmd, [DIM('use git remote -v to list · git remote add <name> <url> to add')]); return
    }

    if (prog === 'git' && sub === 'push') {
      if (!gs.remote) { push(prompt_str(), cmd, [RED("fatal: 'origin' does not appear to be a git repository")]); return }
      push(prompt_str(), cmd, [GRN('Everything up-to-date')]); return
    }

    if (prog === 'git' && sub === 'pull') {
      if (!gs.remote) { push(prompt_str(), cmd, [RED("fatal: 'origin' does not appear to be a git repository")]); return }
      push(prompt_str(), cmd, [L('Already up to date.')]); return
    }

    // ── Shell commands ────────────────────────────────────────────────────────
    if (prog === 'ls') {
      if (cloneData && cwd === `~/${cloneData.repo}`) {
        const items = [
          ...cloneData.dirs.map(d => `${d.name}/`),
          ...cloneData.files.map(f => f.name),
        ]
        push(prompt_str(), cmd, [L(items.join('  ') || '(empty)')]); return
      }
      const items = [
        ...(gs.commits.length ? ['README.md'] : []),
        ...(gs.commits.some(c => c.branch === 'feature-about') ? ['ABOUT.md'] : []),
        ...gs.untracked, ...gs.staged, ...gs.modified,
        ...(gs.initialized ? ['.git'] : []),
      ]
      push(prompt_str(), cmd, [L(items.join('  ') || '(empty)')]); return
    }

    if (prog === 'cat') {
      const filename = rest[0]
      if (!filename) { push(prompt_str(), cmd, [RED('cat: missing operand')]); return }
      const local = gs.fileContents?.[filename]
      if (local !== undefined && local !== null) { push(prompt_str(), cmd, [L(local)]); return }
      if (local === null && cloneData) {
        push(prompt_str(), cmd, [DIM(`fetching ${filename}…`)])
        const content = await fetchFileContent(filename)
        if (content) {
          setSandboxGs(prev => ({ ...prev, fileContents: { ...prev.fileContents, [filename]: content } }))
          setHistory(prev => { const n = [...prev]; n[n.length-1].lines = [L(content.slice(0, 2000) + (content.length > 2000 ? '\n…(truncated)' : ''))]; return n })
        } else {
          setHistory(prev => { const n = [...prev]; n[n.length-1].lines = [RED(`cat: ${filename}: No such file or directory`)]; return n })
        }
        return
      }
      push(prompt_str(), cmd, [RED(`cat: ${filename}: No such file or directory`)]); return
    }

    if (prog === 'cd') {
      const target = rest[0] || '~'
      if (cloneData && target === cloneData.repo) { setCwd(`~/${cloneData.repo}`); push(prompt_str(), cmd, []); return }
      if (target === '..' || target === '~') { setCwd('~'); push(prompt_str(), cmd, []); return }
      if (target === 'my-project') { setCwd('~/my-project'); push(prompt_str(), cmd, []); return }
      push(prompt_str(), cmd, [RED(`cd: ${target}: No such file or directory`)]); return
    }

    if (prog === 'pwd') {
      push(prompt_str(), cmd, [L(`/home/learner${cwd.replace('~', '')}`)]); return
    }

    if (prog === 'help' || (prog === 'git' && (sub === 'help' || sub === '--help'))) {
      push(prompt_str(), cmd, [
        L('── git ───────────────────────────────────────────────────────'),
        L('  status · add · commit · log · diff · branch · checkout · merge'),
        L('  push · pull · remote · clone <github-url>'),
        L('── shell ─────────────────────────────────────────────────────'),
        L('  ls · cat <file> · cd <dir> · pwd · touch <file> · rm <file>'),
        L('  mkdir <dir> · clear · echo <text>'),
        L('── editors ───────────────────────────────────────────────────'),
        L('  nano <file>   Ctrl+S save · Ctrl+X exit'),
        L('  vim <file>    i = insert · Esc = normal · :wq = save & quit · :q! = discard'),
        L('── run ───────────────────────────────────────────────────────'),
        L('  python <file.py>   run a Python script (real execution)'),
      ])
      return
    }

    if (prog === 'git') {
      push(prompt_str(), cmd, [RED(`git: '${sub}' is not a git command. See 'git help'.`)]); return
    }
    push(prompt_str(), cmd, [RED(`${prog}: command not found — type help for available commands`)])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { handleCommand() }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(cmdIdxRef.current + 1, cmdHistoryRef.current.length - 1)
      cmdIdxRef.current = idx
      setInput(cmdHistoryRef.current[idx] || '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.max(cmdIdxRef.current - 1, -1)
      cmdIdxRef.current = idx
      setInput(idx < 0 ? '' : cmdHistoryRef.current[idx] || '')
    }
  }

  return (
    <div className="gs-sandbox">
      <div className="gs-sandbox__header">
        <span className="gs-sandbox__badge">SANDBOX</span>
        <span className="gs-sandbox__title">free terminal</span>
        <span className="gs-sandbox__hint">nano/vim &lt;file&gt; · git clone &lt;github-url&gt; · help</span>
      </div>

      {editorOpen ? (
        <EditorModal
          filename={editorOpen.filename}
          initialContent={editorOpen.content}
          editorType={editorOpen.type}
          onSave={content => handleEditorSave(editorOpen.filename, content)}
          onCancel={handleEditorCancel}
        />
      ) : (
        <div className="gs-sandbox__terminal">
          <div className="gs-sandbox__history">
            <div className="gs-sandbox__welcome">
              <span className="gs-sandbox__welcome-line">✓ lesson complete — sandbox unlocked</span>
              <span className="gs-sandbox__welcome-line gs-sandbox__welcome-dim">
                touch script.py · nano script.py · python script.py · git add · git commit · git clone any/public-repo
              </span>
            </div>
            {history.map((entry, i) => (
              <div key={i} className="gs-sandbox__entry">
                <div className="gs-sandbox__cmd-row">
                  <span className="gs-sandbox__prompt">{entry.prompt}$</span>
                  <span className="gs-sandbox__cmd"> {entry.cmd}</span>
                </div>
                {entry.lines.map((line, j) => (
                  <div key={j} className={`gs-out gs-out--${line.cls || 'default'}`}>{line.text || ' '}</div>
                ))}
              </div>
            ))}
            {loading && <div className="gs-sandbox__loading">fetching from GitHub…</div>}
            <div ref={bottomRef} />
          </div>
          <div className="gs-sandbox__input-row">
            <span className="gs-sandbox__prompt">{prompt_str()}$</span>
            <input
              ref={inputRef}
              className="gs-sandbox__input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              placeholder="type a command…"
              disabled={loading}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main sim ─────────────────────────────────────────────────────────────────
export default function GitSim({ onClose, onAthenaEvent }) {
  const lesson = gitBasicsLesson
  const saved  = loadGitSession(lesson)

  const [stepIndex,    setStepIndex]    = useState(saved?.stepIndex   ?? 0)
  const [gitState,     setGitState]     = useState(saved?.gitState    ?? { ...lesson.initialState })
  const [history,      setHistory]      = useState(saved?.history     ?? [])
  const [input,        setInput]        = useState('')
  const [validation,   setValidation]   = useState('idle')
  const [note,         setNote]         = useState(null)
  const [showHint,     setShowHint]     = useState(false)
  const [attempts,     setAttempts]     = useState(0)
  const [sandboxMode,  setSandboxMode]  = useState(saved?.sandboxMode ?? false)
  const [confirmReset, setConfirmReset] = useState(false)
  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const firedRef     = useRef(new Set())
  const resetTimerRef = useRef(null)

  const step   = lesson.steps[stepIndex]
  const isLast = stepIndex === lesson.steps.length - 1

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])
  useEffect(() => { inputRef.current?.focus() }, [stepIndex])

  // Persist session on every meaningful change
  useEffect(() => {
    saveGitSession({ stepIndex, gitState, history, sandboxMode })
  }, [stepIndex, gitState, history, sandboxMode])

  function handleRestart() {
    if (!confirmReset) {
      setConfirmReset(true)
      resetTimerRef.current = setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    clearTimeout(resetTimerRef.current)
    clearGitSession()
    setStepIndex(0)
    setGitState({ ...lesson.initialState })
    setHistory([])
    setInput('')
    setValidation('idle')
    setNote(null)
    setShowHint(false)
    setAttempts(0)
    setSandboxMode(false)
    setConfirmReset(false)
    firedRef.current = new Set()
  }

  function fire(event, context = '') {
    const key = `${event}:${stepIndex}`
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    onAthenaEvent?.({ lesson: 'git-basics', event, context })
  }

  useEffect(() => { fire('git-opened') }, [])

  function pushHistory(prompt, cmd, outputLines) {
    setHistory(prev => [...prev, { prompt, cmd, outputLines }])
  }

  function applyEffect(effect) {
    if (!effect) return
    setGitState(prev => {
      const next = { ...prev, ...effect }
      if (effect.fileContents) next.fileContents = { ...(prev.fileContents || {}), ...effect.fileContents }
      return next
    })
  }

  function handleCommand() {
    const cmd = input.trim()
    if (!cmd) return
    setInput('')
    setNote(null)
    setShowHint(false)

    if (step.type === 'explainer' || step.type === 'ship-it') return

    const accepted = step.accepts(cmd)

    if (accepted) {
      pushHistory(LESSON_PROMPT, cmd, step.getOutput(gitState, cmd))
      const effect = step.getSideEffect(gitState, cmd)
      if (effect) applyEffect(effect)
      const n = step.getNote?.(cmd)
      if (n) setNote(n)
      if (step.id !== 'sandbox-unlock') playChime()
      setValidation('pass')
      setAttempts(0)
      fire('step-advanced', step.title)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 2) setShowHint(true)
      pushHistory(LESSON_PROMPT, cmd, handleOffScript(cmd, gitState))
      setValidation('fail')
      fire('step-failed', step.title)
    }
  }

  function advance() {
    const next = stepIndex + 1
    if (next >= lesson.steps.length) return
    const effect = step.onAdvance?.()
    if (effect) applyEffect(effect)
    setStepIndex(next)
    setValidation('idle')
    setAttempts(0)
    setNote(null)
    setShowHint(false)
    if (next === lesson.steps.length - 1) {
      fire('lesson-complete')
      setSandboxMode(true)
    }
  }

  const isExplainer = step.type === 'explainer'
  const isShipIt    = step.type === 'ship-it'
  const canAdvance  = validation === 'pass' || isExplainer || isShipIt

  const viewFile    = step.viewFile || gitState.activeFile
  const viewContent = viewFile ? (gitState.fileContents?.[viewFile] ?? null) : null

  return (
    <div className="gs-sim">
      <div className="gs-sim__top">
        <div className="gs-sim__brand">🔧 {lesson.title}</div>
        <div className="gs-sim__progress-wrap">
          <div
            className="gs-sim__progress-bar"
            style={{ width: `${(stepIndex / (lesson.steps.length - 1)) * 100}%` }}
          />
        </div>
        <span className="gs-sim__step-counter">{stepIndex + 1} / {lesson.steps.length}</span>
        <div className="gs-sim__top-actions">
          {confirmReset ? (
            <>
              <span className="gs-sim__reset-prompt">restart?</span>
              <button className="gs-sim__reset-confirm" onClick={handleRestart}>yes</button>
              <button className="gs-sim__reset-cancel" onClick={() => { clearTimeout(resetTimerRef.current); setConfirmReset(false) }}>no</button>
            </>
          ) : (
            <button className="gs-sim__restart" onClick={handleRestart} title="restart from beginning">↺</button>
          )}
        </div>
        <button className="gs-sim__close" onClick={onClose} aria-label="close">×</button>
      </div>

      <div className="gs-sim__workspace">
        <div className="gs-sim__left">
          <FileTree gs={gitState} />
          {viewContent !== null && <FileViewer filename={viewFile} content={viewContent} />}
          <div className="gs-sim__terminal">
            <div className="gs-sim__history">
              {history.map((entry, i) => (
                <div key={i} className="gs-sim__entry">
                  <div className="gs-sim__entry-cmd">
                    <span className="gs-sim__prompt">{entry.prompt}$</span>
                    <span className="gs-sim__cmd-text"> {entry.cmd}</span>
                  </div>
                  {entry.outputLines?.map((line, j) => <OutLine key={j} line={line} />)}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {!isExplainer && !isShipIt && (
              <div className="gs-sim__input-row">
                <span className="gs-sim__prompt">{LESSON_PROMPT}$</span>
                <input
                  ref={inputRef}
                  className="gs-sim__input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCommand()}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  placeholder="type a git command…"
                  disabled={validation === 'pass'}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="gs-sim__guide">
          <div className="gs-sim__step-num">step {stepIndex + 1} of {lesson.steps.length}</div>
          <div className="gs-sim__step-title">{step.title}</div>

          {isExplainer && step.diagram      && (
            <div className="gs-sim__diagram">
              <div className="gs-sim__diagram-row">
                <div className="gs-sim__diagram-box">working files</div>
                <div className="gs-sim__diagram-arrow">git add →</div>
                <div className="gs-sim__diagram-box gs-sim__diagram-box--mid">staging area</div>
                <div className="gs-sim__diagram-arrow">git commit →</div>
                <div className="gs-sim__diagram-box gs-sim__diagram-box--repo">repository</div>
              </div>
              <div className="gs-sim__diagram-sub">your changes · ready to save · saved forever</div>
            </div>
          )}
          {isExplainer && step.remoteDiagram && <RemoteDiagram />}
          {isExplainer && step.branchDiagram && <BranchDiagram />}
          {isExplainer && step.githubView    && <GitHubView gs={gitState} />}
          {isExplainer && step.prView        && <PRView gs={gitState} />}

          <div className="gs-sim__instruction">{step.instruction}</div>

          {showHint && !isExplainer && !isShipIt && (
            <div className="gs-sim__hint"><strong>hint:</strong> {step.hint}</div>
          )}
          {note && <div className="gs-sim__note">{note}</div>}
          {validation === 'pass' && step.transitionNote && (
            <div className="gs-sim__transition-note">{step.transitionNote}</div>
          )}

          <div className="gs-sim__status">
            {validation === 'pass'  && !isExplainer && <span className="gs-sim__status--pass">✓ correct</span>}
            {validation === 'fail'  && <span className="gs-sim__status--fail">✗ not the expected command — check the hint</span>}
          </div>

          <div className="gs-sim__actions">
            {canAdvance && !isLast && (
              <button className="gs-sim__btn gs-sim__btn--primary" onClick={advance}>
                {isExplainer ? 'got it →' : 'next →'}
              </button>
            )}
            {isLast && <button className="gs-sim__btn gs-sim__btn--primary" onClick={onClose}>done ✓</button>}
            {!canAdvance && !isShipIt && !isExplainer && (
              <button className="gs-sim__btn" onClick={() => setShowHint(true)} disabled={showHint}>
                {showHint ? 'hint shown' : 'show hint'}
              </button>
            )}
          </div>
        </aside>
      </div>

      {sandboxMode && (
        <div className="gs-sim__sandbox-wrap">
          <SandboxTerminal lessonGitState={gitState} />
        </div>
      )}
    </div>
  )
}
