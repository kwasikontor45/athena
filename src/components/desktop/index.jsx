import AthenaAssistant from '../athena-assistant'
import LessonPanel from '../lesson-panel'
import { LESSONS } from '../../utils/lessons'
import './desktop.css'

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
]

export default function Desktop({
  currentView, onBack,
  openApp, onOpenApp,
  currentEvent, currentLesson, onEventHandled,
  getLessonStatus, getEventProgress, onSelectLesson,
  earnedBadges, totalXP, currentWeek, completedLessons,
}) {
  if (currentView === 'progress') {
    const completedIds = completedLessons ?? []
    const earned = earnedBadges ?? []
    const weeks = [1, 2, 3, 4]

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
