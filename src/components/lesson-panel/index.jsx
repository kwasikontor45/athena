import { LESSONS, WEEKS } from '../../utils/lessons'
import './lesson-panel.css'

export default function LessonPanel({ getLessonStatus, getEventProgress, onSelectLesson }) {
  return (
    <section className="lp">
      <p className="lp__header">this week</p>

      {WEEKS.map(week => {
        const weekLessons = LESSONS.filter(l => l.week === week)
        return (
          <div key={week} className="lp__week">
            <div className="lp__week-divider">
              <span className="lp__week-label">week {week}</span>
              <span className="lp__week-rule" />
            </div>

            {weekLessons.map(lesson => {
              const status = getLessonStatus?.(lesson.id) ?? 'locked'
              const { total, completed } = getEventProgress?.(lesson.id) ?? { total: 0, completed: 0 }
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <button
                  key={lesson.id}
                  className={`lp__row lp__row--${status}`}
                  onClick={() => status === 'active' && onSelectLesson?.(lesson.id)}
                  disabled={status === 'locked'}
                >
                  <span className={`lp__dot lp__dot--${status}`} />
                  <span className="lp__icon">{lesson.icon}</span>

                  <span className="lp__info">
                    <span className="lp__title">{lesson.title}</span>
                    {status === 'active' && (
                      <span className="lp__bar-track">
                        <span className="lp__bar-fill" style={{ width: `${pct}%` }} />
                      </span>
                    )}
                  </span>

                  <span className="lp__badge">
                    {status === 'complete' && <span className="lp__check">✓</span>}
                    {status === 'locked'   && <span className="lp__lock">⚿</span>}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}
