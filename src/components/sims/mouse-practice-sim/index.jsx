import { useRef, useState } from 'react'
import './mouse-practice-sim.css'

const STEPS = [
  {
    id: 'first-click',
    label: 'Single Click',
    instruction: 'Click the button once',
    event: 'first-click',
  },
  {
    id: 'double-click',
    label: 'Double Click',
    instruction: 'Click the button twice, quickly',
    event: 'double-click',
  },
  {
    id: 'right-click',
    label: 'Right Click',
    instruction: 'Right-click the button (try the right mouse button)',
    event: 'right-click',
  },
]

export default function MousePracticeSim({ onClose, onAthenaEvent }) {
  const [done, setDone] = useState(new Set())
  const [contextVisible, setContextVisible] = useState(false)
  const firedRef = useRef(new Set())

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    const next = new Set(done)
    next.add(event)
    setDone(next)
    onAthenaEvent?.({ lesson: 'mouse-basics', event })
    if (next.size === 3) {
      setTimeout(() => onAthenaEvent?.({ lesson: 'mouse-basics', event: 'lesson-complete' }), 900)
    }
  }

  return (
    <div className="mp">
      <div className="mp__titlebar">
        <div className="mp__dots">
          <button className="mp__dot mp__dot--red" onClick={onClose} aria-label="Close" />
          <span className="mp__dot mp__dot--yellow" />
          <span className="mp__dot mp__dot--green" />
        </div>
        <span className="mp__title">🖱️ Mouse Practice</span>
        <span className="mp__title-spacer" />
      </div>

      <div className="mp__body">
        <p className="mp__intro">
          Practice the three most important mouse moves. Complete each step below.
        </p>

        <div className="mp__steps">
          {STEPS.map(({ id, label, instruction, event }) => {
            const isDone = done.has(event)
            return (
              <div key={id} className={`mp__step${isDone ? ' mp__step--done' : ''}`}>
                <div className="mp__step-info">
                  <span className="mp__step-check">{isDone ? '✓' : '○'}</span>
                  <div>
                    <div className="mp__step-label">{label}</div>
                    <div className="mp__step-hint">{isDone ? 'Done!' : instruction}</div>
                  </div>
                </div>

                {id === 'first-click' && (
                  <button
                    className="mp__target"
                    disabled={isDone}
                    onClick={() => fire('first-click')}
                  >
                    {isDone ? '✓ clicked' : 'Click me'}
                  </button>
                )}

                {id === 'double-click' && (
                  <button
                    className="mp__target"
                    disabled={isDone}
                    onDoubleClick={() => fire('double-click')}
                  >
                    {isDone ? '✓ double-clicked' : 'Double-click me'}
                  </button>
                )}

                {id === 'right-click' && (
                  <div className="mp__context-wrap">
                    <button
                      className="mp__target"
                      disabled={isDone}
                      onContextMenu={e => {
                        e.preventDefault()
                        if (isDone) return
                        setContextVisible(true)
                        setTimeout(() => setContextVisible(false), 1600)
                        fire('right-click')
                      }}
                    >
                      {isDone ? '✓ right-clicked' : 'Right-click me'}
                    </button>
                    {contextVisible && (
                      <div className="mp__context-menu">
                        <div className="mp__context-item">Open</div>
                        <div className="mp__context-item">Copy</div>
                        <div className="mp__context-item">Paste</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {done.size === 3 && (
          <div className="mp__complete">
            🎉 Mouse Basics complete — great work!
          </div>
        )}
      </div>
    </div>
  )
}
