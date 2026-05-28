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
import CodeBootcampSim from './components/sims/code-bootcamp-sim'
import GitSim from './components/sims/git-sim'
import useProgress, { codeToProgress } from './utils/use-progress'
import { useCircadian } from './utils/use-circadian'
import { useStreak } from './utils/use-streak'
import { playFanfare } from './utils/sound'
import { LESSONS } from './utils/lessons'
import CelebrationOverlay from './components/celebration'
import './app.css'

function RestoreBanner({ onRestore, onDismiss }) {
  return (
    <div className="app__restore-banner">
      <span className="app__restore-banner-text">checkpoint found — restore your progress?</span>
      <button className="app__restore-banner-btn app__restore-banner-btn--primary" onClick={onRestore}>
        restore
      </button>
      <button className="app__restore-banner-btn" onClick={onDismiss}>
        dismiss
      </button>
    </div>
  )
}

function SimWindow({ children, simKey }) {
  const [pos, setPos] = useState({ x: 80, y: 50 })
  const [size, setSize] = useState({ w: 920, h: 640 })
  const [maximized, setMaximized] = useState(false)
  const wrapRef = useRef(null)

  function toggleMaximize() {
    setMaximized(m => !m)
  }

  function handleMouseDown(e) {
    if (maximized) return
    if (e.target.closest('input, textarea, select, button, .sim-window__resize-handle')) return
    const rect = wrapRef.current.getBoundingClientRect()
    if (e.clientY - rect.top > 40) return
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

  function handleResizeDown(e) {
    if (maximized) return
    e.preventDefault()
    e.stopPropagation()
    const startMX = e.clientX
    const startMY = e.clientY
    const startW  = size.w
    const startH  = size.h
    function onMove(e) {
      setSize({
        w: Math.max(600, startW + (e.clientX - startMX)),
        h: Math.max(420, startH + (e.clientY - startMY)),
      })
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
      className={`sim-window${maximized ? ' sim-window--maximized' : ''}`}
      style={maximized ? {} : { position: 'fixed', left: pos.x, top: pos.y, width: size.w, height: size.h }}
      onMouseDown={handleMouseDown}
    >
      <button
        className="sim-window__maximize"
        onClick={toggleMaximize}
        aria-label={maximized ? 'restore' : 'maximize'}
        title={maximized ? 'restore' : 'maximize'}
      >
        {maximized ? '⛶' : '□'}
      </button>
      {children}
      {!maximized && (
        <div className="sim-window__resize-handle" onMouseDown={handleResizeDown} />
      )}
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
  'code-bootcamp':  CodeBootcampSim,
  'git-basics':     GitSim,
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
  'code-bootcamp': 'code-bootcamp',
  'git-basics':    'git-basics',
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
  'code-bootcamp':     'code-bootcamp',
  'git-basics':        'git-basics',
}

export default function App() {
  const [currentView, setCurrentView] = useState('desktop')
  const [openApp, setOpenApp] = useState(null)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [pendingRestore, setPendingRestore] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('restore')
    if (code) {
      const clean = new URL(window.location.href)
      clean.searchParams.delete('restore')
      window.history.replaceState({}, '', clean.toString())
    }
    return code || null
  })

  const {
    earnedBadges, completedLessons, totalXP, currentWeek, weekTotal, weekCompleted,
    recordEvent, getLessonStatus, getEventProgress, isEventDone,
  } = useProgress()

  const { phase, palette, isReEntry } = useCircadian()
  const streak = useStreak()
  const [celebration, setCelebration] = useState(null)
  const prevCompletedRef = useRef(null)
  if (prevCompletedRef.current === null) prevCompletedRef.current = new Set(completedLessons)

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--athena-gold',        palette.gold)
    r.style.setProperty('--athena-gold-dim',    `rgba(${palette.goldRgb}, 0.15)`)
    r.style.setProperty('--athena-gold-border', `rgba(${palette.goldRgb}, 0.25)`)
    r.style.setProperty('--athena-bg-base',     palette.bgBase)
    r.style.setProperty('--athena-bg-surface',  palette.bgSurface)
    r.style.setProperty('--athena-bg-panel',    palette.bgPanel)
  }, [palette])

  useEffect(() => {
    const prev = prevCompletedRef.current
    if (completedLessons.size > prev.size) {
      const newId = [...completedLessons].find(id => !prev.has(id))
      const lesson = newId ? LESSONS.find(l => l.id === newId) : null
      if (lesson) {
        playFanfare()
        setCelebration(lesson)
      }
    }
    prevCompletedRef.current = new Set(completedLessons)
  }, [completedLessons])

  useEffect(() => {
    let lesson, event, context = ''
    if (streak > 1) {
      lesson  = 'desktop-navigation'
      event   = 'streak-greeting'
      context = String(streak)
    } else if (isReEntry) {
      lesson = 'circadian'
      event  = 'circadian-reentry'
    } else {
      lesson = 'circadian'
      event  = `circadian-${phase}`
    }
    const t = setTimeout(() => setCurrentEvent({ lesson, event, context }), 900)
    return () => clearTimeout(t)
  }, [])


  const ActiveSim = openApp ? (SIM_MAP[openApp] ?? null) : null
  const currentLesson = LESSON_MAP[openApp] ?? 'desktop-navigation'
  const urlApp = new URLSearchParams(window.location.search).get('app')

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

  function handleRestore() {
    if (codeToProgress(pendingRestore)) {
      window.location.reload()
    } else {
      setPendingRestore(null)
    }
  }

  if (urlApp === 'code-bootcamp') {
    return (
      <div className="app app--standalone-bootcamp">
        <div className="app__standalone-bar">
          <a className="app__standalone-back" href="/">← back to athena</a>
        </div>
        <div className="app__standalone-body">
          <CodeBootcampSim
            onClose={() => window.location.href = '/'}
            onAthenaEvent={handleAthenaEvent}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {pendingRestore && (
        <RestoreBanner
          onRestore={handleRestore}
          onDismiss={() => setPendingRestore(null)}
        />
      )}
      <Taskbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentWeek={currentWeek}
        totalXP={totalXP}
        weekCompleted={weekCompleted}
        weekTotal={weekTotal}
        completedLessons={completedLessons}
        earnedBadges={earnedBadges}
        streak={streak}
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

      {celebration && (
        <CelebrationOverlay
          lesson={celebration}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </div>
  )
}
