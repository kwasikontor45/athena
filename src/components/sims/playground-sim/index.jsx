import { useState } from 'react'
import FileExplorerSim    from '../file-explorer-sim'
import EmailSim           from '../email-sim'
import BrowserSim         from '../browser-sim'
import DocEditorSim       from '../doc-editor-sim'
import SchoolPortalSim    from '../school-portal-sim'
import TypingSim          from '../typing-sim'
import VideoCallSim       from '../video-call-sim'
import ShortcutsSim       from '../shortcuts-sim'
import PasswordSim        from '../password-sim'
import CodeBootcampSim    from '../code-bootcamp-sim'
import GitSim             from '../git-sim'
import './playground-sim.css'

const NOOP = () => {}

const SIMS = [
  { id: 'my-files',      emoji: '🗂️', label: 'my files',      Component: FileExplorerSim,  cls: 'pg__tile--files'    },
  { id: 'email',         emoji: '✉️', label: 'email',          Component: EmailSim,         cls: 'pg__tile--email'    },
  { id: 'browser',       emoji: '🌐', label: 'browser',        Component: BrowserSim,       cls: 'pg__tile--browser'  },
  { id: 'documents',     emoji: '📝', label: 'documents',      Component: DocEditorSim,     cls: 'pg__tile--docs'     },
  { id: 'school-portal', emoji: '🎓', label: 'school portal',  Component: SchoolPortalSim,  cls: 'pg__tile--school'   },
  { id: 'typing',        emoji: '⌨️', label: 'typing',         Component: TypingSim,        cls: 'pg__tile--typing'   },
  { id: 'video-call',    emoji: '📹', label: 'video call',     Component: VideoCallSim,     cls: 'pg__tile--video'    },
  { id: 'shortcuts',     emoji: '⌨️', label: 'shortcuts',      Component: ShortcutsSim,     cls: 'pg__tile--shortcuts'},
  { id: 'password',      emoji: '🔐', label: 'passwords',      Component: PasswordSim,      cls: 'pg__tile--password' },
  { id: 'code-bootcamp', emoji: '🧪', label: 'code bootcamp',  Component: CodeBootcampSim,  cls: 'pg__tile--code'     },
  { id: 'git',           emoji: '🔧', label: 'git basics',     Component: GitSim,           cls: 'pg__tile--git'      },
]

export default function PlaygroundSim({ onClose, simContext, onSimContext, onOpenApp }) {
  const [openSims, setOpenSims] = useState([])

  function openSim(id) {
    setOpenSims(prev =>
      prev.includes(id) ? [...prev.filter(s => s !== id), id] : [...prev, id]
    )
  }

  function closeSim(id) {
    setOpenSims(prev => prev.filter(s => s !== id))
  }

  return (
    <div className="pg">
      <div className="pg__header">
        <button className="pg__back" onClick={onClose}>← back to lessons</button>
        <span className="pg__header-title">free explore — open any sim</span>
      </div>
      <div className="pg__body">
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
                  <span className="pg__tile-action">{isOpen ? '✓ open' : 'open →'}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="pg__sim-layer">
        {openSims.map((id, i) => {
          const sim = SIMS.find(s => s.id === id)
          if (!sim) return null
          const { Component } = sim
          return (
            <div key={id} className="pg__sim-wrap" style={{ zIndex: 10 + i }}>
              <Component onClose={() => closeSim(id)} onAthenaEvent={NOOP} simContext={simContext} onSimContext={onSimContext} onOpenApp={onOpenApp} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
