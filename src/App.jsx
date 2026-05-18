import { useState, useCallback, useEffect, useRef } from 'react'
import Taskbar from './components/taskbar'
import Desktop from './components/desktop'
import FileExplorerSim from './components/sims/file-explorer-sim'
import EmailSim from './components/sims/email-sim'
import BrowserSim from './components/sims/browser-sim'
import DocEditorSim from './components/sims/doc-editor-sim'
import SchoolPortalSim from './components/sims/school-portal-sim'
import TypingSim from './components/sims/typing-sim'
import PlaygroundSim   from './components/sims/playground-sim'
import VideoCallSim   from './components/sims/video-call-sim'
import ShortcutsSim   from './components/sims/shortcuts-sim'
import PasswordSim    from './components/sims/password-sim'
import MousePracticeSim from './components/sims/mouse-practice-sim'
import useProgress from './utils/use-progress'
import { useCircadian } from './utils/use-circadian'
import './app.css'

function SimWindow({ children, simKey }) {
  const [pos, setPos] = useState({ x: 100, y: 60 })
  const wrapRef = useRef(null)
  const dragRef = useRef(null)

  function handleMouseDown(e) {
    if (e.target.closest('input, textarea, select')) return
    const rect = wrapRef.current.getBoundingClientRect()
    if (e.clientY - rect.top > 40) return // titlebar zone only
    e.preventDefault()
    const startMX = e.clientX
    const startMY = e.clientY
    const startX  = pos.x
    const startY  = pos.y
    function onMove(e) {
      setPos({ x: startX + (e.clientX - startMX), y: startY + (e.clientY - startMY) })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',  onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
}

const SIM_MAP = {
  'my-files':       FileExplorerSim,
  email:            EmailSim,
  browser:          BrowserSim,
  documents:        DocEditorSim,
  'school-portal':  SchoolPortalSim,
  typing:           TypingSim,
  playground:       PlaygroundSim,
  'video-call':     VideoCallSim,
  shortcuts:        ShortcutsSim,
  password:         PasswordSim,
  'mouse-practice': MousePracticeSim,
}

const LESSON_MAP = {
  'my-files':      'file-explorer',
  email:           'email',
  browser:         'browser',
  documents:       'doc-editor',
  'school-portal': 'school-portal',
  'video-call':    'video-call',
  shortcuts:       'shortcuts',
  password:        'password-security',
}

const LESSON_TO_APP = {
  'mouse-basics':      'mouse-practice',
  'keyboard-basics':   'typing',
  'file-explorer':     'my-files',
  email:               'email',
  browser:             'browser',
  'doc-editor':        'documents',
  'school-portal':     'school-portal',
  'video-call':        'video-call',
  shortcuts:           'shortcuts',
  'password-security': 'password',
}

export default function App() {
  const [currentView, setCurrentView] = useState('desktop')
  const [openApp, setOpenApp] = useState(null)
  const [currentEvent, setCurrentEvent] = useState(null)

  const {
    earnedBadges, completedLessons, totalXP, currentWeek, weekTotal, weekCompleted,
    recordEvent, getLessonStatus, getEventProgress, isEventDone,
  } = useProgress()

  const { phase, palette, isReEntry } = useCircadian()

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--athena-gold',        palette.gold)
    r.style.setProperty('--athena-gold-dim',    `rgba(${palette.goldRgb}, 0.15)`)
    r.style.setProperty('--athena-gold-border', `rgba(${palette.goldRgb}, 0.25)`)
    r.style.setProperty('--athena-bg-base',     palette.bgBase)
    r.style.setProperty('--athena-bg-surface',  palette.bgSurface)
    r.style.setProperty('--athena-bg-panel',    palette.bgPanel)
  }, [palette])


  const ActiveSim = openApp ? (SIM_MAP[openApp] ?? null) : null
  const currentLesson = LESSON_MAP[openApp] ?? 'desktop-navigation'

  const handleAthenaEvent = useCallback((ev) => {
    setCurrentEvent(ev)
    recordEvent(ev.lesson, ev.event)
  }, [recordEvent])

  // Fire desktop-navigation events with Athena response, but only the first time each
  const fireDesktopNavOnce = useCallback((event) => {
    if (isEventDone('desktop-navigation', event)) return
    handleAthenaEvent({ lesson: 'desktop-navigation', event })
  }, [isEventDone, handleAthenaEvent])

  const handleCloseApp = useCallback(() => {
    setOpenApp(null)
    fireDesktopNavOnce('closed-window')
  }, [fireDesktopNavOnce])

  const handleSelectLesson = useCallback((lessonId) => {
    if (lessonId === 'desktop-navigation') {
      setCurrentEvent({ lesson: 'desktop-navigation', event: 'lesson-selected' })
      return
    }
    const appId = LESSON_TO_APP[lessonId]
    if (appId) { setOpenApp(appId); setCurrentView('desktop') }
  }, [])

  const handleNavigate = useCallback((view) => {
    fireDesktopNavOnce('found-taskbar')
    if (view === 'practice') {
      setOpenApp('playground')
      setCurrentView('desktop')
    } else {
      setCurrentView(view)
    }
  }, [fireDesktopNavOnce])

  const handleOpenApp = useCallback((id) => {
    if (id === 'kontor-studio') {
      window.open('https://kontor.studio', '_blank', 'noopener,noreferrer')
    } else if (id === 'dev-site') {
      window.open('https://kwasikontor.dev', '_blank', 'noopener,noreferrer')
    } else {
      setOpenApp(id)
      setCurrentView('desktop')
      fireDesktopNavOnce('opened-app')
    }
  }, [fireDesktopNavOnce])

  return (
    <div className="app">
      <Taskbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentWeek={currentWeek}
        totalXP={totalXP}
        weekCompleted={weekCompleted}
        weekTotal={weekTotal}
        completedLessons={completedLessons}
        earnedBadges={earnedBadges}
      />
      <Desktop
        currentView={currentView}
        onBack={() => setCurrentView('desktop')}
        openApp={openApp}
        onOpenApp={handleOpenApp}
        currentEvent={currentEvent}
        currentLesson={currentLesson}
        onEventHandled={() => setCurrentEvent(null)}
        getLessonStatus={getLessonStatus}
        getEventProgress={getEventProgress}
        onSelectLesson={handleSelectLesson}
        earnedBadges={earnedBadges}
        totalXP={totalXP}
        currentWeek={currentWeek}
        completedLessons={completedLessons}
      />

      {ActiveSim && (
        <>
          <div className="app__sim-backdrop" />
          <div className="app__sim-stage">
            <SimWindow key={openApp}>
              <ActiveSim
                onClose={handleCloseApp}
                onAthenaEvent={handleAthenaEvent}
              />
            </SimWindow>
          </div>
        </>
      )}
    </div>
  )
}
