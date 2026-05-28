import { useState, useEffect, useRef } from 'react'
import { gitBasicsLesson, gitStatusOutput, gitLogOutput, gitLogOneline } from '../../../utils/git-lessons'
import { playChime } from '../../../utils/sound'
import './git-sim.css'

const PROMPT = 'learner@athena:~/my-project'

// ─── File tree ───────────────────────────────────────────────────────────────
function FileTree({ gs }) {
  return (
    <div className="gs-tree">
      <div className="gs-tree__root">📁 my-project/</div>
      {gs.initialized && <div className="gs-tree__file gs-tree__file--git">  📁 .git/</div>}
      {gs.commits.map(c => null).length === 0 && gs.staged.length === 0 && gs.untracked.length === 0 && gs.modified.length === 0 && gs.initialized && (
        <div className="gs-tree__file gs-tree__file--dim">  (empty working tree)</div>
      )}
      {gs.commits.length > 0 && !gs.staged.includes('README.md') && !gs.modified.includes('README.md') && (
        <div className="gs-tree__file gs-tree__file--committed">  📄 README.md</div>
      )}
      {gs.modified.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--modified">  📄 {f} <span>modified</span></div>
      ))}
      {gs.staged.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--staged">  📄 {f} <span>staged</span></div>
      ))}
      {gs.untracked.map(f => (
        <div key={f} className="gs-tree__file gs-tree__file--untracked">  📄 {f} <span>untracked</span></div>
      ))}
    </div>
  )
}

// ─── Terminal output line ─────────────────────────────────────────────────────
function OutLine({ line }) {
  return <div className={`gs-out gs-out--${line.cls || 'default'}`}>{line.text || ' '}</div>
}

// ─── Off-script command handler ───────────────────────────────────────────────
function handleOffScript(cmd, gs) {
  const trimmed = cmd.trim()
  const parts = trimmed.split(/\s+/)
  const [prog, sub] = parts

  if (prog !== 'git') {
    if (prog === 'ls') return [{ text: gs.untracked.concat(gs.staged, gs.modified, gs.commits.length ? ['README.md'] : [], gs.initialized ? ['.git'] : []).join('  ') || '(empty)', cls: '' }]
    if (prog === 'pwd') return [{ text: '/home/learner/my-project', cls: '' }]
    return [{ text: `bash: ${prog}: command not found`, cls: 'red' }]
  }

  if (!gs.initialized && sub !== 'init') return [{ text: 'fatal: not a git repository (or any of the parent directories): .git', cls: 'red' }]

  switch (sub) {
    case 'status': return gitStatusOutput(gs)
    case 'log':
      return trimmed.includes('--oneline') ? gitLogOneline(gs) : gitLogOutput(gs)
    case 'init':
      if (gs.initialized) return [{ text: 'Reinitialized existing Git repository in ~/my-project/.git/', cls: '' }]
      return [{ text: 'fatal: not handled here', cls: 'red' }]
    case 'add':
      if (!parts[2]) return [{ text: "Nothing specified, nothing added. Did you mean 'git add .'?", cls: 'red' }]
      return [{ text: '(staged — run git status to verify)', cls: 'dim' }]
    case 'commit':
      if (!trimmed.includes('-m')) return [{ text: "hint: Waiting for your editor to close the file...\n(use git commit -m \"message\" to avoid opening an editor)", cls: 'dim' }]
      return [{ text: 'nothing to commit, working tree clean', cls: '' }]
    case 'diff':
      return gs.modified.length ? [{ text: '-old content\n+new content', cls: 'dim' }] : [{ text: '(no changes)', cls: 'dim' }]
    case 'help':
    case '--help':
      return [{ text: 'Common commands: init, status, add, commit, log, diff', cls: 'dim' }]
    default:
      return [{ text: `git: '${sub}' is not a git command. See 'git --help'.`, cls: 'red' }]
  }
}

// ─── Main sim ─────────────────────────────────────────────────────────────────
export default function GitSim({ onClose, onAthenaEvent }) {
  const lesson = gitBasicsLesson
  const [stepIndex, setStepIndex]   = useState(0)
  const [gitState, setGitState]     = useState({ ...lesson.initialState })
  const [history, setHistory]       = useState([])
  const [input, setInput]           = useState('')
  const [validation, setValidation] = useState('idle')
  const [note, setNote]             = useState(null)
  const [showHint, setShowHint]     = useState(false)
  const [attempts, setAttempts]     = useState(0)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const firedRef  = useRef(new Set())

  const step   = lesson.steps[stepIndex]
  const isLast = stepIndex === lesson.steps.length - 1

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])
  useEffect(() => { inputRef.current?.focus() }, [stepIndex])

  function fire(event, context = '') {
    const key = `${event}:${stepIndex}`
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    onAthenaEvent?.({ lesson: 'git-basics', event, context })
  }

  useEffect(() => { fire('git-opened') }, [])

  function pushHistory(prompt, cmd, outputLines, type = 'normal') {
    setHistory(prev => [...prev, { prompt, cmd, outputLines, type }])
  }

  function applyEffect(effect) {
    if (!effect) return
    setGitState(prev => ({ ...prev, ...effect }))
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
      const outputLines = step.getOutput(gitState, cmd)
      pushHistory(PROMPT, cmd, outputLines)

      // Apply side effect
      const effect = step.getSideEffect(gitState, cmd)
      let nextState = gitState
      if (effect) {
        nextState = { ...gitState, ...effect }
        setGitState(nextState)
      }

      // Show coaching note if any
      const n = step.getNote?.(cmd)
      if (n) setNote(n)

      // Play chime on correct answer (not ship-it)
      if (step.id !== 'ship-it') playChime()

      setValidation('pass')
      setAttempts(0)
      fire('step-advanced', step.title)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 2) setShowHint(true)

      // Show realistic off-script output
      const outputLines = handleOffScript(cmd, gitState)
      pushHistory(PROMPT, cmd, outputLines, 'off-script')
      setValidation('fail')
      fire('step-failed', step.title)
    }
  }

  function advance() {
    const next = stepIndex + 1
    if (next >= lesson.steps.length) return

    // Apply transition effect (e.g. file modification between steps)
    const effect = step.onAdvance?.()
    if (effect) applyEffect(effect)

    setStepIndex(next)
    setValidation('idle')
    setAttempts(0)
    setNote(null)
    setShowHint(false)

    if (next === lesson.steps.length - 1) fire('lesson-complete')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleCommand()
  }

  const isExplainer = step.type === 'explainer'
  const isShipIt    = step.type === 'ship-it'
  const canAdvance  = validation === 'pass' || isExplainer || isShipIt

  return (
    <div className="gs-sim">
      {/* Top bar */}
      <div className="gs-sim__top">
        <div className="gs-sim__brand">🔧 {lesson.title}</div>
        <div className="gs-sim__pips">
          {lesson.steps.map((s, i) => (
            <div
              key={s.id}
              className={`gs-sim__pip${i === stepIndex ? ' gs-sim__pip--active' : ''}${i < stepIndex ? ' gs-sim__pip--done' : ''}`}
            />
          ))}
        </div>
        <button className="gs-sim__close" onClick={onClose} aria-label="close">×</button>
      </div>

      {/* Workspace */}
      <div className="gs-sim__workspace">

        {/* Left: file tree + terminal */}
        <div className="gs-sim__left">
          <FileTree gs={gitState} />

          <div className="gs-sim__terminal">
            <div className="gs-sim__history">
              {history.map((entry, i) => (
                <div key={i} className="gs-sim__entry">
                  <div className="gs-sim__entry-cmd">
                    <span className="gs-sim__prompt">{entry.prompt}$</span>
                    <span className="gs-sim__cmd-text"> {entry.cmd}</span>
                  </div>
                  {entry.outputLines?.map((line, j) => (
                    <OutLine key={j} line={line} />
                  ))}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {!isExplainer && !isShipIt && (
              <div className="gs-sim__input-row">
                <span className="gs-sim__prompt">{PROMPT}$</span>
                <input
                  ref={inputRef}
                  className="gs-sim__input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
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

        {/* Right: guide panel */}
        <aside className="gs-sim__guide">
          <div className="gs-sim__step-title">{step.title}</div>

          {isExplainer && step.diagram && (
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

          <div className="gs-sim__instruction">{step.instruction}</div>

          {showHint && !isExplainer && !isShipIt && (
            <div className="gs-sim__hint">
              <strong>hint:</strong> {step.hint}
            </div>
          )}

          {note && (
            <div className="gs-sim__note">{note}</div>
          )}

          {validation === 'pass' && step.transitionNote && (
            <div className="gs-sim__transition-note">{step.transitionNote}</div>
          )}

          <div className="gs-sim__status">
            {validation === 'pass' && !isExplainer && (
              <span className="gs-sim__status--pass">✓ correct</span>
            )}
            {validation === 'fail' && (
              <span className="gs-sim__status--fail">✗ not the expected command — check the hint</span>
            )}
          </div>

          <div className="gs-sim__actions">
            {canAdvance && !isLast && (
              <button className="gs-sim__btn gs-sim__btn--primary" onClick={advance}>
                {isExplainer ? "let's start →" : 'next →'}
              </button>
            )}
            {isLast && (
              <button className="gs-sim__btn gs-sim__btn--primary" onClick={onClose}>
                done ✓
              </button>
            )}
            {!canAdvance && !isShipIt && !isExplainer && (
              <button
                className="gs-sim__btn"
                onClick={() => setShowHint(true)}
                disabled={showHint}
              >
                {showHint ? 'hint shown' : 'show hint'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
