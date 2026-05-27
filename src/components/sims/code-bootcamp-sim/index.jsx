import { useState, useEffect, useRef, useCallback } from 'react'
import { shiptivitasLesson } from '../../../utils/code-lessons'
import './code-bootcamp-sim.css'

/* ─── Editor: textarea + line numbers ─── */
function Editor({ value, onChange, readOnly }) {
  const textareaRef = useRef(null)
  const lines = value.split('\n')

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(start + 2, start + 2)
      })
    }
  }

  return (
    <div className="cb-editor">
      <div className="cb-editor__gutter">
        {lines.map((_, i) => (
          <div key={i} className="cb-editor__line-num">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="cb-editor__textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
      />
    </div>
  )
}

/* ─── Kanban Preview: staged by mode ─── */
function DemoCard({ client, onDragStart, draggable }) {
  let cls = 'cb-card'
  if (client.status === 'backlog') cls += ' cb-card--grey'
  if (client.status === 'in-progress') cls += ' cb-card--blue'
  if (client.status === 'complete') cls += ' cb-card--green'

  return (
    <div
      className={cls}
      draggable={draggable}
      onDragStart={e => draggable && onDragStart?.(e, client.id)}
      data-id={client.id}
    >
      <div className="cb-card__title">{client.name}</div>
    </div>
  )
}

function KanbanDemo({ mode }) {
  const initial = [
    { id: '1', name: 'Stark, White and Abbott', status: 'in-progress' },
    { id: '2', name: 'Wiza LLC', status: 'complete' },
    { id: '3', name: 'Nolan LLC', status: 'backlog' },
    { id: '4', name: 'Thompson PLC', status: 'in-progress' },
    { id: '5', name: 'Walker-Williamson', status: 'in-progress' },
    { id: '6', name: 'Boehm and Sons', status: 'backlog' },
    { id: '7', name: 'Runolfsson, Hegmann and Block', status: 'backlog' },
    { id: '8', name: 'Schumm-Labadie', status: 'backlog' },
  ]

  const [clients, setClients] = useState(initial)
  const [snapBackId, setSnapBackId] = useState(null)

  const enableDrag = mode === 'drag-no-sync' || mode === 'solved'
  const enableSync = mode === 'solved'
  const allBacklog = mode === 'backlog-no-drag' || mode === 'drag-no-sync' || mode === 'solved'

  const displayClients = allBacklog
    ? initial.map(c => ({ ...c, status: 'backlog' }))
    : clients

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(e, newStatus) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return

    if (!enableSync) {
      setSnapBackId(id)
      setTimeout(() => setSnapBackId(null), 600)
      return
    }

    setClients(prev => {
      const moved = prev.find(c => c.id === id)
      if (!moved || moved.status === newStatus) return prev
      const others = prev.filter(c => c.id !== id)
      return [...others, { ...moved, status: newStatus }]
    })
  }

  const lanes = [
    { title: 'backlog', status: 'backlog' },
    { title: 'in progress', status: 'in-progress' },
    { title: 'complete', status: 'complete' },
  ]

  return (
    <div className="cb-demo">
      <div className="cb-demo__board">
        {lanes.map(({ title, status }) => {
          const laneClients = displayClients.filter(c => c.status === status)
          return (
            <div
              key={status}
              className="cb-lane"
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, status)}
            >
              <div className="cb-lane__title">{title}</div>
              <div className="cb-lane__dropzone">
                {laneClients.map(client => (
                  <DemoCard
                    key={client.id}
                    client={client}
                    draggable={enableDrag}
                    onDragStart={(e, id) => {
                      e.dataTransfer.setData('text/plain', id)
                    }}
                  />
                ))}
                {snapBackId && (
                  <div className="cb-demo__snap-hint">
                    cards snap back — state not synced yet
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main Lesson Engine ─── */
export default function CodeBootcampSim({ onClose, onAthenaEvent }) {
  const lesson = shiptivitasLesson

  const [stepIndex, setStepIndex] = useState(0)
  const [files, setFiles] = useState(() => {
    const copy = {}
    Object.keys(lesson.files).forEach(k => {
      copy[k] = lesson.files[k].initial
    })
    return copy
  })
  const [openFile, setOpenFile] = useState('board.js')
  const [validation, setValidation] = useState('idle')
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const firedRef = useRef(new Set())

  const step = lesson.steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === lesson.steps.length - 1

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    onAthenaEvent?.({ lesson: 'code-bootcamp', event })
  }

  function handleCheck() {
    setValidation('checking')
    setAttempts(a => a + 1)
    setShowHint(false)
    setTimeout(() => {
      try {
        const passed = step.validate(files)
        if (passed) {
          setValidation('pass')
          fire(step.id === 'ship-it' ? 'lesson-complete' : 'step-advanced')
        } else {
          setValidation('fail')
        }
      } catch {
        setValidation('fail')
      }
    }, 400)
  }

  function goNext() {
    if (!isLast && validation === 'pass') {
      const next = stepIndex + 1
      setStepIndex(next)
      setValidation('idle')
      setAttempts(0)
      setShowHint(false)
      setShowSolution(false)
      if (lesson.steps[next]?.targetFile) {
        setOpenFile(lesson.steps[next].targetFile)
      }
    }
  }

  function goPrev() {
    if (!isFirst) {
      setStepIndex(i => i - 1)
      setValidation('idle')
      setAttempts(0)
      setShowHint(false)
      setShowSolution(false)
    }
  }

  function applySolution() {
    const target = step.targetFile || 'board.js'
    setFiles(prev => ({ ...prev, [target]: lesson.files[target].solution }))
    setShowSolution(false)
    setValidation('pass')
    fire('step-advanced')
  }

  useEffect(() => {
    if (step.targetFile) setOpenFile(step.targetFile)
  }, [stepIndex, step.targetFile])

  useEffect(() => {
    fire('bootcamp-opened')
  }, [])

  const canAdvance = validation === 'pass'
  const hintVisible = showHint || (validation === 'fail' && attempts >= 2 && !showSolution)

  return (
    <div className="cb-sim">
      {/* Top */}
      <div className="cb-sim__top">
        <div className="cb-sim__brand">🧪 {lesson.title}</div>
        <div className="cb-sim__step-track">
          {lesson.steps.map((s, i) => (
            <button
              key={s.id}
              className={`cb-sim__step-pip${i === stepIndex ? ' cb-sim__step-pip--active' : ''}${i < stepIndex ? ' cb-sim__step-pip--done' : ''}`}
              onClick={() => {
                if (i <= stepIndex || lesson.steps[i - 1]?.validate(files)) {
                  setStepIndex(i)
                  setValidation('idle')
                }
              }}
              title={s.title}
            />
          ))}
        </div>
        <button className="cb-sim__close" onClick={onClose} aria-label="close">×</button>
      </div>

      {/* Workspace */}
      <div className="cb-sim__workspace">
        {/* File tree */}
        <aside className="cb-sim__file-panel">
          <div className="cb-sim__panel-label">files</div>
          {Object.keys(lesson.files).map(filename => (
            <button
              key={filename}
              className={`cb-sim__file${openFile === filename ? ' cb-sim__file--active' : ''}${lesson.files[filename].readOnly ? ' cb-sim__file--readonly' : ''}`}
              onClick={() => setOpenFile(filename)}
            >
              {filename}
              {lesson.files[filename].readOnly && (
                <span className="cb-sim__file-badge">ro</span>
              )}
            </button>
          ))}
        </aside>

        {/* Editor */}
        <div className="cb-sim__editor-panel">
          <div className="cb-sim__editor-bar">
            <span className="cb-sim__editor-name">{openFile}</span>
            {lesson.files[openFile]?.readOnly && (
              <span className="cb-sim__editor-badge">read only</span>
            )}
          </div>
          <Editor
            value={files[openFile] || ''}
            onChange={val => setFiles(prev => ({ ...prev, [openFile]: val }))}
            readOnly={lesson.files[openFile]?.readOnly}
          />
        </div>

        {/* Guide + Preview */}
        <aside className="cb-sim__guide-panel">
          <div className="cb-sim__step-title">{step.title}</div>
          <div className="cb-sim__step-instruction">{step.instruction}</div>

          {hintVisible && (
            <div className="cb-sim__hint">
              <strong>hint:</strong> {step.hint}
            </div>
          )}

          {validation === 'fail' && attempts >= 2 && !showSolution && (
            <button className="cb-sim__link-btn" onClick={() => setShowSolution(true)}>
              stuck? show solution
            </button>
          )}

          {showSolution && (
            <div className="cb-sim__solution-box">
              <p>This replaces your code with the working solution for this step.</p>
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={applySolution}>
                apply solution
              </button>
              <button className="cb-sim__btn" onClick={() => setShowSolution(false)}>
                cancel
              </button>
            </div>
          )}

          <div className="cb-sim__validation">
            {validation === 'checking' && (
              <span className="cb-sim__status cb-sim__status--checking">checking...</span>
            )}
            {validation === 'pass' && (
              <span className="cb-sim__status cb-sim__status--pass">✓ looks good — advance to next step</span>
            )}
            {validation === 'fail' && (
              <span className="cb-sim__status cb-sim__status--fail">✗ not quite — read the hint and try again</span>
            )}
          </div>

          <div className="cb-sim__actions">
            <button className="cb-sim__btn" onClick={goPrev} disabled={isFirst}>← prev</button>
            {!canAdvance ? (
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={handleCheck}>
                check my work
              </button>
            ) : (
              <button className="cb-sim__btn cb-sim__btn--primary" onClick={goNext} disabled={isLast}>
                {isLast ? 'finished' : 'next →'}
              </button>
            )}
          </div>

          <div className="cb-sim__preview-wrap">
            <div className="cb-sim__preview-label">live preview — {step.previewMode}</div>
            <KanbanDemo mode={step.previewMode} />
          </div>
        </aside>
      </div>
    </div>
  )
}
