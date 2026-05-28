import { useState } from 'react'
import AthenaAssistant from '../athena-assistant'
import LessonPanel from '../lesson-panel'
import { LESSONS, WEEKS } from '../../utils/lessons'
import { progressToCode, codeToProgress, resetProgress } from '../../utils/use-progress'
import './desktop.css'

const MISSION_POOL = LESSONS.filter(l => l.id !== 'desktop-navigation')

function getDailyMission() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return MISSION_POOL[seed % MISSION_POOL.length]
}

function DailyMission({ completedLessons, onOpenApp }) {
  const mission = getDailyMission()
  const done = completedLessons?.has(mission.id)

  return (
    <div
      className={`desktop__mission${done ? ' desktop__mission--done' : ''}`}
      onClick={() => !done && onOpenApp(mission.id)}
      role={done ? 'status' : 'button'}
      title={done ? 'Mission complete!' : `Open ${mission.title}`}
    >
      <span className="desktop__mission-icon">{mission.icon}</span>
      <div className="desktop__mission-body">
        <span className="desktop__mission-label">today's focus</span>
        <span className="desktop__mission-title">{mission.title}</span>
      </div>
      <span className="desktop__mission-status">{done ? '✓' : '→'}</span>
    </div>
  )
}

const BADGE_LABELS = {
  'first-click': '🖱️ First Click',
  explorer:      '🗂️ Explorer',
  emailer:       '✉️ Emailer',
  scholar:       '🎓 Scholar',
  graduate:      '🏆 Graduate',
}

const APP_ICONS = [
  { id: 'my-files',      emoji: '🗂️',  label: 'My Files'      },
  { id: 'email',         emoji: '📧',  label: 'Email'         },
  { id: 'browser',       emoji: '🌐',  label: 'Browser'       },
  { id: 'documents',     emoji: '📝',  label: 'Documents'     },
  { id: 'school-portal', emoji: '🏫',  label: 'School Portal' },
  { id: 'typing',        emoji: '⌨️',  label: 'Typing'        },
  { id: 'playground',   emoji: '🎮',  label: 'Playground'    },
  { id: 'video-call',    emoji: '📹',  label: 'Video Call'    },
  { id: 'shortcuts',     emoji: '⌨️',  label: 'Shortcuts'     },
  { id: 'password',      emoji: '🔐',  label: 'Passwords'     },
  { id: 'kontor-studio', emoji: '🏠',  label: 'kontor.studio' },
  { id: 'dev-site',      emoji: '💻',  label: 'kwasikontor.dev'},
  { id: 'code-bootcamp', emoji: '🧪',  label: 'Code Bootcamp' },
  { id: 'git-basics',   emoji: '🔧',  label: 'Git Basics'    },
]

export default function Desktop({
  currentView, onBack,
  openApp, onOpenApp,
  currentEvent, currentLesson, onEventHandled,
  getLessonStatus, getEventProgress, onSelectLesson,
  earnedBadges, totalXP, currentWeek, completedLessons,
}) {
  const [cpCopied, setCpCopied]   = useState(false)
  const [pasteCode, setPasteCode] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [resetStep, setResetStep] = useState('idle')

  const savedCode  = progressToCode()
  const restoreUrl = savedCode ? `${window.location.origin}/?restore=${savedCode}` : null

  function handleCopyLink() {
    if (!restoreUrl) return
    navigator.clipboard.writeText(restoreUrl).then(() => {
      setCpCopied(true)
      setTimeout(() => setCpCopied(false), 2000)
    })
  }

  function handleRestoreCode() {
    const raw   = pasteCode.trim()
    const match = raw.match(/[?&]restore=([^&\s]+)/)
    const target = match ? match[1] : raw
    if (codeToProgress(target)) {
      window.location.reload()
    } else {
      setPasteError("That code didn't work — double-check and try again.")
      setTimeout(() => setPasteError(''), 3000)
    }
  }

  function handleReset() {
    resetProgress()
    window.location.reload()
  }

  if (currentView === 'progress') {
    const completedIds = Array.from(completedLessons ?? [])
    const earned = earnedBadges ?? []
    const weeks = WEEKS

    return (
      <div className="desktop">
        <div className="desktop__full-view">
          <div className="desktop__progress-screen">
            <button className="desktop__progress-back" onClick={onBack}>&#8592; Back to Desktop</button>

            <div className="desktop__progress-header">
              <span className="desktop__progress-owl">🦉</span>
              <div>
                <div className="desktop__progress-xp">{totalXP} <span>XP earned</span></div>
                <div className="desktop__progress-week">Week {currentWeek} of 4 — {completedIds.length} of {LESSONS.length} lessons complete</div>
              </div>
            </div>

            <div className="desktop__progress-weeks">
              {weeks.map(w => {
                const weekLessons = LESSONS.filter(l => l.week === w)
                const doneCount   = weekLessons.filter(l => completedIds.includes(l.id)).length
                const pct         = Math.round((doneCount / weekLessons.length) * 100)
                const isActive    = w === currentWeek
                const isLocked    = w > currentWeek
                return (
                  <div key={w} className={`desktop__progress-week-row${isActive ? ' desktop__progress-week-row--active' : ''}${isLocked ? ' desktop__progress-week-row--locked' : ''}`}>
                    <div className="desktop__progress-week-meta">
                      <span className="desktop__progress-week-label">Week {w}</span>
                      <span className="desktop__progress-week-count">{isLocked ? 'locked' : `${doneCount} / ${weekLessons.length}`}</span>
                    </div>
                    <div className="desktop__progress-week-bar">
                      <div className="desktop__progress-week-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="desktop__progress-badges">
              <div className="desktop__progress-badge-label">badges</div>
              <div className="desktop__progress-badge-row">
                {Object.entries(BADGE_LABELS).map(([id, label]) => (
                  <span key={id} className={`desktop__progress-badge${earned.includes(id) ? ' desktop__progress-badge--earned' : ' desktop__progress-badge--locked'}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="desktop__progress-checkpoint">
              <div className="desktop__progress-cp-heading">continue on any device or browser</div>
              <p className="desktop__progress-cp-desc">
                Copy this link and open it anywhere — your progress restores instantly. No account needed.
              </p>

              {restoreUrl ? (
                <div className="desktop__progress-cp-row">
                  <input
                    readOnly
                    className="desktop__progress-cp-input"
                    value={restoreUrl}
                    onFocus={e => e.target.select()}
                    onClick={e => e.target.select()}
                  />
                  <button
                    className={`desktop__progress-cp-btn${cpCopied ? ' desktop__progress-cp-btn--done' : ''}`}
                    onClick={handleCopyLink}
                  >
                    {cpCopied ? 'copied ✓' : 'copy link'}
                  </button>
                </div>
              ) : (
                <p className="desktop__progress-cp-empty">Complete a lesson to generate your checkpoint link.</p>
              )}

              <div className="desktop__progress-cp-divider">restore from a saved link</div>
              <div className="desktop__progress-cp-row">
                <input
                  className="desktop__progress-cp-input"
                  placeholder="paste your link or code here"
                  value={pasteCode}
                  onChange={e => setPasteCode(e.target.value)}
                />
                <button
                  className="desktop__progress-cp-btn"
                  onClick={handleRestoreCode}
                  disabled={!pasteCode.trim()}
                >
                  restore
                </button>
              </div>
              {pasteError && <p className="desktop__progress-cp-error">{pasteError}</p>}

              <div className="desktop__progress-cp-reset">
                {resetStep === 'idle' ? (
                  <button className="desktop__progress-cp-reset-btn" onClick={() => setResetStep('confirm')}>
                    start fresh
                  </button>
                ) : (
                  <span className="desktop__progress-cp-reset-confirm">
                    this will erase all progress —&nbsp;
                    <button onClick={handleReset}>yes, reset</button>
                    &nbsp;·&nbsp;
                    <button onClick={() => setResetStep('idle')}>cancel</button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="desktop">
      <aside className="desktop__lesson-panel">
        <LessonPanel
          getLessonStatus={getLessonStatus}
          getEventProgress={getEventProgress}
          onSelectLesson={onSelectLesson}
        />
      </aside>

      <div className="desktop__grid-area">
        <DailyMission completedLessons={completedLessons} onOpenApp={onSelectLesson} />
        <div className="desktop__icon-grid">
          {APP_ICONS.map(({ id, emoji, label }) => (
            <button
              key={id}
              className={`desktop__icon${openApp === id ? ' desktop__icon--active' : ''}`}
              onClick={() => onOpenApp(id)}
            >
              <span className="desktop__icon-face">{emoji}</span>
              <span className="desktop__icon-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="desktop__athena-panel">
        <AthenaAssistant
          currentEvent={currentEvent}
          currentLesson={currentLesson}
          onEventHandled={onEventHandled}
          badges={earnedBadges}
        />
      </aside>
    </div>
  )
}
