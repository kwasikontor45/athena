import { useRef, useState } from 'react'
import './shortcuts-sim.css'

const DEFAULT_TEXT =
`Hello! This is a practice document.

You can use keyboard shortcuts to work faster.
The meeting is scheduled for Monday at 9 AM.`

const STEPS = [
  { id: 'select-all', label: 'Select All',  hint: 'Select all the text at once', keys: ['Ctrl', 'A'], event: 'used-select-all' },
  { id: 'copy',       label: 'Copy',        hint: 'Copy the selected text',       keys: ['Ctrl', 'C'], event: 'used-copy'       },
  { id: 'paste',      label: 'Paste',       hint: 'Paste the text you copied',    keys: ['Ctrl', 'V'], event: 'used-paste'      },
  { id: 'undo',       label: 'Undo',        hint: 'Undo your last change',        keys: ['Ctrl', 'Z'], event: 'used-undo'       },
  { id: 'save',       label: 'Save',        hint: 'Save the document',            keys: ['Ctrl', 'S'], event: 'used-save'       },
]

export default function ShortcutsSim({ onClose, onAthenaEvent }) {
  const [step, setStep]       = useState(0)
  const [done, setDone]       = useState([])
  const [flash, setFlash]     = useState(false)
  const [saved, setSaved]     = useState(false)
  const [finished, setFinished] = useState(false)
  const firedRef  = useRef(new Set())
  const taRef     = useRef(null)

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    onAthenaEvent?.({ lesson: 'shortcuts', event })
  }

  function advance(event) {
    fire(event)
    setFlash(true)
    setTimeout(() => {
      setFlash(false)
      setDone(d => [...d, STEPS[step].id])
      const next = step + 1
      if (next >= STEPS.length) {
        fire('lesson-complete')
        setFinished(true)
      } else {
        setStep(next)
      }
    }, 500)
  }

  function handleKeyDown(e) {
    const ctrl = e.ctrlKey || e.metaKey
    if (!ctrl) return
    const key = e.key.toLowerCase()

    if (key === 's') {
      e.preventDefault()
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    }

    const expected = STEPS[step]
    const keyMap = { 'select-all': 'a', copy: 'c', paste: 'v', undo: 'z', save: 's' }
    if (key === keyMap[expected.id]) {
      advance(expected.event)
    }
  }

  const current = STEPS[step]

  return (
    <div className="sc">
      <div className="sc__titlebar">
        <div className="sc__dots">
          <button className="sc__dot sc__dot--red" onClick={onClose} aria-label="Close" />
          <span className="sc__dot sc__dot--yellow" />
          <span className="sc__dot sc__dot--green" />
        </div>
        <span className="sc__title">keyboard shortcuts</span>
        <span />
      </div>

      {finished ? (
        <div className="sc__done">
          <span className="sc__done-icon">✓</span>
          <h2 className="sc__done-heading">All shortcuts learned!</h2>
          <p className="sc__done-sub">Ctrl+A, C, V, Z, S — five shortcuts that work in almost every app.</p>
          <button className="sc__retry-btn" onClick={() => { setStep(0); setDone([]); setFinished(false) }}>
            Practice again
          </button>
        </div>
      ) : (
        <>
          <div className={`sc__task${flash ? ' sc__task--flash' : ''}`}>
            <div className="sc__step-count">Step {step + 1} of {STEPS.length}</div>
            <div className="sc__task-hint">{current.hint}</div>
            <div className="sc__keys">
              {current.keys.map((k, i) => (
                <span key={i}>
                  <span className="sc__key">{k}</span>
                  {i < current.keys.length - 1 && <span className="sc__plus">+</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="sc__editor-wrap">
            {saved && <div className="sc__saved-toast">✓ Saved</div>}
            <textarea
              ref={taRef}
              className="sc__editor"
              defaultValue={DEFAULT_TEXT}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="sc__progress">
            {STEPS.map((s, i) => {
              const isDone = done.includes(s.id)
              const isCurrent = i === step
              return (
                <div key={s.id} className={`sc__step${isDone ? ' sc__step--done' : isCurrent ? ' sc__step--active' : ''}`}>
                  <span className="sc__step-dot">{isDone ? '✓' : i + 1}</span>
                  <span className="sc__step-label">{s.label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
