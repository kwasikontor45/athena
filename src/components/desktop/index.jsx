import AthenaAssistant from '../athena-assistant'
import LessonPanel from '../lesson-panel'
import './desktop.css'

const APP_ICONS = [
  { id: 'my-files',      emoji: '🗂️',  label: 'My Files'      },
  { id: 'email',         emoji: '📧',  label: 'Email'         },
  { id: 'browser',       emoji: '🌐',  label: 'Browser'       },
  { id: 'documents',     emoji: '📝',  label: 'Documents'     },
  { id: 'school-portal', emoji: '🏫',  label: 'School Portal' },
  { id: 'typing',        emoji: '⌨️',  label: 'Typing'        },
  { id: 'lessons',       emoji: '📚',  label: 'Lessons'       },
  { id: 'playground',    emoji: '🎮',  label: 'Playground'    },
]

export default function Desktop({ openApp, onOpenApp, currentEvent, currentLesson, onEventHandled }) {
  return (
    <div className="desktop">
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

      <aside className="desktop__sidebar">
        <AthenaAssistant
          currentEvent={currentEvent}
          currentLesson={currentLesson}
          onEventHandled={onEventHandled}
        />
        <LessonPanel />
      </aside>
    </div>
  )
}
