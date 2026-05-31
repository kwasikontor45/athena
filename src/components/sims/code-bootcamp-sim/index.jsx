import { useState, useEffect, useRef } from 'react'
import { pythonGradeLesson } from '../../../utils/code-lessons'
import { highlight } from '../../../utils/highlight'
import { playChime } from '../../../utils/sound'
import { runPython, isPyodideReady } from '../../../utils/pyodide-runner'
import './code-bootcamp-sim.css'

const STORAGE_KEY = id => `athena_cb_${id}`

function loadSession(lesson) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(lesson.id))
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (saved.stepIndex >= lesson.steps.length) return null
    return saved
  } catch { return null }
}

function saveSession(lessonId, stepIndex, files) {
  try { localStorage.setItem(STORAGE_KEY(lessonId), JSON.stringify({ stepIndex, files })) } catch {}
}

function clearSession(lessonId) {
  try { localStorage.removeItem(STORAGE_KEY(lessonId)) } catch {}
}

/* ─── Editor ─── */
function Editor({ value, onChange, readOnly }) {
  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  const gutterRef    = useRef(null)
  const lines = value.split('\n')

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end   = e.target.selectionEnd
      const next  = value.substring(0, start) + '  ' + value.substring(end)
      onChange(next)
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(start + 2, start + 2)
      })
    }
  }

  function handleScroll() {
    const ta = textareaRef.current
    if (!ta) return
    if (highlightRef.current) {
      highlightRef.current.scrollTop  = ta.scrollTop
      highlightRef.current.scrollLeft = ta.scrollLeft
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop
    }
  }

  return (
    <div className="cb-editor">
      <div ref={gutterRef} className="cb-editor__gutter">
        {lines.map((_, i) => (
          <div key={i} className="cb-editor__line-num">{i + 1}</div>
        ))}
      </div>
      <div className="cb-editor__code-wrap">
        <pre
          ref={highlightRef}
          className="cb-editor__highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlight(value) + '\n' }}
        />
        <textarea
          ref={textareaRef}
          className="cb-editor__textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function CodeBootcampSim({ onClose, onAthenaEvent, onSimContext }) {
  const lesson = pythonGradeLesson
  const saved  = loadSession(lesson)

  const [stepIndex,    setStepIndex]    = useState(saved?.stepIndex ?? 0)
  const [files,        setFiles]        = useState(() => {
    const defaults = {}
    Object.keys(lesson.files).forEach(k => { defaults[k] = lesson.files[k].initial })
    return saved?.files ? { ...defaults, ...saved.files } : defaults
  })
  const [validation,   setValidation]   = useState('idle')
  const [attempts,     setAttempts]     = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pyOutput,     setPyOutput]     = useState(null)
  const [pyStatus,     setPyStatus]     = useState('idle')
  const firedRef      = useRef(new Set())
  const resetTimerRef = useRef(null)

  const step   = lesson.steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast  = stepIndex === lesson.steps.length - 1
  const mainFile = Object.keys(lesson.files)[0]

  function fire(event, context = '') {
    const key = `${event}:${stepIndex}`
    if (firedRef.current.has(key)) return
    firedRef.current.add(key)
    onAthenaEvent?.({ lesson: 'code-bootcamp', event, context })
  }

  function handleCheck() {
    setValidation('checking')
    setAttempts(a => a + 1)
    setTimeout(() => {
      try {
        const passed = step.validate(files, pyOutput)
        if (passed) {
          setValidation('pass')
          if (!isLast) playChime()
          fire(isLast ? 'lesson-complete' : 'step-advanced', step.title)
          if (isLast) {
            onSimContext?.({ pythonScript: { name: mainFile, content: files[mainFile] } })
          }
        } else {
          setValidation('fail')
          fire('step-failed', step.title)
        }
      } catch {
        setValidation('fail')
        fire('step-failed', step.title)
      }
    }, 400)
  }

  function goNext() {
    if (!isLast && validation === 'pass') {
      const next = stepIndex + 1
      setStepIndex(next)
      setValidation('idle')
      setAttempts(0)
      setShowSolution(false)
      setPyOutput(null)
    }
  }

  function goPrev() {
    if (!isFirst) {
      setStepIndex(i => i - 1)
      setValidation('idle')
      setAttempts(0)
      setShowSolution(false)
    }
  }

  function applySolution() {
    setFiles(prev => ({ ...prev, [mainFile]: step.solution || lesson.files[mainFile].solution }))
    setShowSolution(false)
    setValidation('idle')
  }

  async function handleRunPython() {
    if (pyStatus === 'loading' || pyStatus === 'running') return
    setPyOutput(null)
    setPyStatus(isPyodideReady() ? 'running' : 'loading')
    const code = files[mainFile] || ''
    const { output, error } = await runPython(code, s => setPyStatus(s === 'ready' ? 'running' : 'loading'))
    const result = { output, error }
    setPyOutput(result)
    setPyStatus(error ? 'error' : 'done')
    onAthenaEvent?.({ lesson: 'code-bootcamp', event: 'python-run', context: error ? 'error' : 'success' })
  }

  function handleRestart() {
    if (!confirmReset) {
      setConfirmReset(true)
      resetTimerRef.current = setTimeout(() => setConfirmReset(false), 4000)
      return
    }
    clearTimeout(resetTimerRef.current)
    clearSession(lesson.id)
    const defaults = {}
    Object.keys(lesson.files).forEach(k => { defaults[k] = lesson.files[k].initial })
    setFiles(defaults)
    setStepIndex(0)
    setValidation('idle')
    setAttempts(0)
    setShowSolution(false)
    setConfirmReset(false)
    setPyOutput(null)
    setPyStatus('idle')
    firedRef.current = new Set()
  }

  useEffect(() => {
    saveSession(lesson.id, stepIndex, files)
  }, [stepIndex, files])

  useEffect(() => {
    fire('bootcamp-opened')
  }, [])

  const canAdvance  = validation === 'pass'
  const hintVisible = !!step.hint

  return (
    <div className="cb-sim">
      {/* Top bar */}
      <div className="cb-sim__top">
        <div className="cb-sim__brand">🐍 {lesson.title}</div>
        <div className="cb-sim__step-track">
          {lesson.steps.map((s, i) => (
            <button
              key={s.id}
              className={`cb-sim__step-pip${i === stepIndex ? ' cb-sim__step-pip--active' : ''}${i < stepIndex ? ' cb-sim__step-pip--done' : ''}`}
              onClick={() => { if (i <= stepIndex) { setStepIndex(i); setValidation('idle') } }}
              title={s.title}
            />
          ))}
        </div>
        <div className="cb-sim__top-actions">
          {confirmReset ? (
            <>
              <span className="cb-sim__reset-prompt">restart?</span>
              <button className="cb-sim__reset-confirm" onClick={handleRestart}>yes</button>
              <button className="cb-sim__reset-cancel" onClick={() => { clearTimeout(resetTimerRef.current); setConfirmReset(false) }}>no</button>
            </>
          ) : (
            <button className="cb-sim__restart" onClick={handleRestart} title="restart">↺</button>
          )}
        </div>
        <button className="cb-sim__close" onClick={onClose} aria-label="close">×</button>
      </div>

      {/* Workspace */}
      <div className="cb-sim__workspace">
        {/* Editor */}
        <div className="cb-sim__editor-panel cb-sim__editor-panel--full">
          <div className="cb-sim__editor-bar">
            <span className="cb-sim__editor-name">{mainFile}</span>
            <button
              className={`cb-sim__run-btn${pyStatus === 'loading' || pyStatus === 'running' ? ' cb-sim__run-btn--busy' : ''}`}
              onClick={handleRunPython}
              disabled={pyStatus === 'loading' || pyStatus === 'running'}
            >
              {pyStatus === 'loading' ? '⏳ loading Python…' : pyStatus === 'running' ? '⏳ running…' : '▶ run'}
            </button>
          </div>
          <Editor
            value={files[mainFile] || ''}
            onChange={val => { setFiles(prev => ({ ...prev, [mainFile]: val })); setPyOutput(null) }}
          />
          {/* Output */}
          <div className="cb-sim__output">
            {pyOutput === null && (
              <span className="cb-sim__output-empty">output appears here after you click ▶ run</span>
            )}
            {pyOutput?.output && (
              <pre className="cb-sim__output-text">{pyOutput.output}</pre>
            )}
            {pyOutput?.error && (
              <pre className="cb-sim__output-error">{pyOutput.error}</pre>
            )}
            {pyOutput && !pyOutput.output && !pyOutput.error && (
              <span className="cb-sim__output-empty">(no output)</span>
            )}
          </div>
        </div>

        {/* Guide panel */}
        <aside className="cb-sim__guide-panel">
          <div className="cb-sim__step-title">{step.title}</div>
          <div className="cb-sim__step-instruction">{step.instruction}</div>

          {hintVisible && (
            <div className="cb-sim__hint">
              <strong>hint:</strong>
              <pre className="cb-sim__hint-code">{step.hint}</pre>
            </div>
          )}

          {validation === 'fail' && attempts >= 2 && !showSolution && (
            <button className="cb-sim__link-btn" onClick={() => setShowSolution(true)}>
              stuck? show an example
            </button>
          )}

          {showSolution && (
            <div className="cb-sim__solution-box">
              <p>This replaces your code with a working example for this step.</p>
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={applySolution}>apply example</button>
              <button className="cb-sim__btn" onClick={() => setShowSolution(false)}>cancel</button>
            </div>
          )}

          <div className="cb-sim__validation">
            {validation === 'checking' && <span className="cb-sim__status cb-sim__status--checking">checking…</span>}
            {validation === 'pass'     && <span className="cb-sim__status cb-sim__status--pass">✓ looks good</span>}
            {validation === 'fail'     && <span className="cb-sim__status cb-sim__status--fail">✗ not quite yet</span>}
          </div>

          <div className="cb-sim__actions">
            <button className="cb-sim__btn" onClick={goPrev} disabled={isFirst}>← prev</button>
            {!canAdvance ? (
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={handleCheck}>check my work</button>
            ) : isLast ? (
              <button className="cb-sim__btn cb-sim__btn--primary" disabled>finished ✓</button>
            ) : (
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={goNext}>next →</button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
