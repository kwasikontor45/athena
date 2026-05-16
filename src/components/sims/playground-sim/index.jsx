import { useState } from 'react'
import useAthena from '../../../utils/use-athena'
import FileExplorerSim from '../file-explorer-sim'
import EmailSim from '../email-sim'
import BrowserSim from '../browser-sim'
import DocEditorSim from '../doc-editor-sim'
import SchoolPortalSim from '../school-portal-sim'
import TypingSim from '../typing-sim'
import './playground-sim.css'

const NOOP = () => {}

const SIMS = [
  { id: 'my-files',      emoji: '🗂️', label: 'my files',     Component: FileExplorerSim, cls: 'pg__tile--files'  },
  { id: 'email',         emoji: '✉️', label: 'email',         Component: EmailSim,        cls: 'pg__tile--email'  },
  { id: 'browser',       emoji: '🌐', label: 'browser',       Component: BrowserSim,      cls: 'pg__tile--browser'},
  { id: 'documents',     emoji: '📝', label: 'documents',     Component: DocEditorSim,    cls: 'pg__tile--docs'   },
  { id: 'school-portal', emoji: '🎓', label: 'school portal', Component: SchoolPortalSim, cls: 'pg__tile--school' },
  { id: 'typing',        emoji: '⌨️', label: 'typing',        Component: TypingSim,       cls: 'pg__tile--typing' },
]

export default function PlaygroundSim({ onClose }) {
  const [openSims, setOpenSims] = useState([]) // ordered — last = highest z-index
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const { ask, isLoading } = useAthena()

  function openSim(id) {
    setOpenSims(prev =>
      prev.includes(id)
        ? [...prev.filter(s => s !== id), id]  // bring to front
        : [...prev, id]
    )
  }

  function closeSim(id) {
    setOpenSims(prev => prev.filter(s => s !== id))
  }

  async function handleAsk() {
    const q = question.trim()
    if (!q || isLoading) return
    setQuestion('')
    const res = await ask({ lesson: 'playground', event: 'direct-question', context: q })
    setResponse(res)
  }

  return (
    <div className="pg">
      <div className="pg__titlebar">
        <div className="pg__dots">
          <button className="pg__dot pg__dot--red" onClick={onClose} aria-label="Close" />
          <span className="pg__dot pg__dot--yellow" />
          <span className="pg__dot pg__dot--green" />
        </div>
        <span className="pg__title">playground</span>
        <span />
      </div>

      <div className="pg__body">
        <div className="pg__bubble">
          <span className="pg__bubble-owl">🦉</span>
          <p className="pg__bubble-text">
            Perfect — this is your space. No goals, no grades.
            Open anything, try everything, and see what you discover.
            I'm here if you need me.
          </p>
        </div>

        <div className="pg__launcher">
          {SIMS.map(({ id, emoji, label, cls }) => {
            const isOpen = openSims.includes(id)
            return (
              <button
                key={id}
                className={`pg__tile ${cls}${isOpen ? ' pg__tile--open' : ''}`}
                onClick={() => openSim(id)}
              >
                <span className="pg__tile-icon">{emoji}</span>
                <div className="pg__tile-bottom">
                  <span className="pg__tile-label">{label}</span>
                  <span className="pg__tile-action">{isOpen ? 'open ✓' : 'open →'}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="pg__chat">
          {response && (
            <div className="pg__response">
              <span className="pg__response-owl">🦉</span>
              <p className="pg__response-text">{response}</p>
            </div>
          )}
          <div className="pg__input-row">
            <input
              className="pg__input"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder={isLoading ? 'thinking...' : 'ask athena anything...'}
              disabled={isLoading}
            />
            <button
              className="pg__send"
              onClick={handleAsk}
              disabled={isLoading || !question.trim()}
            >→</button>
          </div>
        </div>
      </div>

      <div className="pg__sim-layer">
        {openSims.map((id, i) => {
          const sim = SIMS.find(s => s.id === id)
          if (!sim) return null
          const { Component } = sim
          return (
            <div key={id} className="pg__sim-wrap" style={{ zIndex: 10 + i }}>
              <Component onClose={() => closeSim(id)} onAthenaEvent={NOOP} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
