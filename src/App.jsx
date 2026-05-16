import { useState } from 'react'
import Taskbar from './components/taskbar'
import Desktop from './components/desktop'
import FileExplorerSim from './components/sims/file-explorer-sim'
import EmailSim from './components/sims/email-sim'
import BrowserSim from './components/sims/browser-sim'
import DocEditorSim from './components/sims/doc-editor-sim'
import SchoolPortalSim from './components/sims/school-portal-sim'
import './app.css'

const SIM_MAP = {
  'my-files':      FileExplorerSim,
  email:           EmailSim,
  browser:         BrowserSim,
  documents:       DocEditorSim,
  'school-portal': SchoolPortalSim,
}

const LESSON_MAP = {
  'my-files':      'file-explorer',
  email:           'email',
  browser:         'browser',
  documents:       'doc-editor',
  'school-portal': 'school-portal',
}

export default function App() {
  const [currentView, setCurrentView] = useState('desktop')
  const [openApp, setOpenApp] = useState(null)
  const [currentEvent, setCurrentEvent] = useState(null)

  const ActiveSim = openApp ? (SIM_MAP[openApp] ?? null) : null
  const currentLesson = LESSON_MAP[openApp] ?? 'desktop-navigation'

  return (
    <div className="app">
      <Taskbar currentView={currentView} onNavigate={setCurrentView} />
      <Desktop
        openApp={openApp}
        onOpenApp={setOpenApp}
        currentEvent={currentEvent}
        currentLesson={currentLesson}
        onEventHandled={() => setCurrentEvent(null)}
      />

      {ActiveSim && (
        <div className="app__sim-overlay" onClick={() => setOpenApp(null)}>
          <div className="app__sim-window" onClick={e => e.stopPropagation()}>
            <button
              className="app__sim-close"
              onClick={() => setOpenApp(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <ActiveSim
              onClose={() => setOpenApp(null)}
              onAthenaEvent={setCurrentEvent}
            />
          </div>
        </div>
      )}
    </div>
  )
}
