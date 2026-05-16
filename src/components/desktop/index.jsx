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
    return (
      <div className="desktop">
        <div className="desktop__full-view">
          <div className="desktop__progress-screen">
            <button className="desktop__progress-back" onClick={onBack}>&#8592; Back to Desktop</button>
            <div className="desktop__progress-header">
              <span className="desktop__progress-owl">🦉</span>
              <div>
                <div className="desktop__progress-xp">{totalXP} <span>XP</span></div>
                <div className="desktop__progress-week">Week {currentWeek} of 4</div>
              </div>
            </div>

            <div className="desktop__progress-lessons">
              {LESSONS.map(lesson => {
                const done = completedIds.includes(lesson.id)
                return (
                  <div key={lesson.id} className={`desktop__progress-row${done ? ' desktop__progress-row--done' : ''}`}>
                    <span className="desktop__progress-icon">{lesson.icon}</span>
                    <span className="desktop__progress-name">{lesson.title}</span>
                    <span className="desktop__progress-check">{done ? '✓' : '○'}</span>
                  </div>
                )
              })}
            </div>

            {earnedBadges?.length > 0 && (
              <div className="desktop__progress-badges">
                <div className="desktop__progress-badge-label">badges earned</div>
                <div className="desktop__progress-badge-row">
                  {earnedBadges.map(b => (
                    <span key={b} className="desktop__progress-badge">
                      {BADGE_LABELS[b] ?? b}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="desktop">
      <aside className="desktop__athena-panel">
        <AthenaAssistant
          currentEvent={currentEvent}
          currentLesson={currentLesson}
          onEventHandled={onEventHandled}
          badges={earnedBadges}
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

      <aside className="desktop__lesson-panel">
        <LessonPanel
          getLessonStatus={getLessonStatus}
          getEventProgress={getEventProgress}
          onSelectLesson={onSelectLesson}
        />
      </aside>
    </div>
  )
}
