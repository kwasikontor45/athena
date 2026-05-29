import { useState } from 'react'
import { LESSONS, WEEKS } from '../../utils/lessons'
import { progressToCode, codeToProgress, resetProgress } from '../../utils/use-progress'
import { joinCohort, getLearnerId } from '../../utils/use-sync'
import './desktop.css'

const MISSION_POOL = LESSONS.filter(l => l.id !== 'desktop-navigation')

function getDailyMission() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  return MISSION_POOL[seed % MISSION_POOL.length]
}

function DailyMission({ completedLessons, onSelectLesson }) {
  const mission = getDailyMission()
  const done = completedLessons?.has(mission.id)
  return (
    <div
      className={`desktop__mission${done ? ' desktop__mission--done' : ''}`}
      onClick={() => !done && onSelectLesson(mission.id)}
      role={done ? 'status' : 'button'}
      title={done ? 'Mission complete!' : `Start: ${mission.title}`}
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

function WeekSection({ week, lessons, currentWeek, getLessonStatus, onSelectLesson, completedLessons }) {
  const isLocked  = week > currentWeek
  const isActive  = week === currentWeek
  const doneCount = lessons.filter(l => completedLessons?.has(l.id)).length
  const pct       = Math.round((doneCount / lessons.length) * 100)

  return (
    <div className={`desktop__week${isActive ? ' desktop__week--active' : ''}${isLocked ? ' desktop__week--locked' : ''}`}>
      <div className="desktop__week-header">
        <span className="desktop__week-label">week {week}</span>
        <span className="desktop__week-count">{isLocked ? '—' : `${doneCount}/${lessons.length}`}</span>
      </div>
      <div className="desktop__week-bar">
        <div className="desktop__week-fill" style={{ width: `${pct}%` }} />
      </div>
      {lessons.map(lesson => {
        const status   = getLessonStatus(lesson.id)
        const isDone   = status === 'complete'
        const isRowLocked = status === 'locked'
        return (
          <button
            key={lesson.id}
            className={`desktop__lesson-row${isDone ? ' desktop__lesson-row--done' : ''}${isRowLocked ? ' desktop__lesson-row--locked' : ''}`}
            onClick={() => onSelectLesson(lesson.id)}
          >
            <span className="desktop__lesson-row-icon">{lesson.icon}</span>
            <span className="desktop__lesson-row-title">{lesson.title}</span>
            <span className="desktop__lesson-row-arrow">{isDone ? '✓' : isRowLocked ? '·' : '→'}</span>
          </button>
        )
      })}
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

export default function Desktop({
  currentView, onBack,
  onOpenApp, onSelectLesson,
  getLessonStatus, getEventProgress,
  earnedBadges, totalXP, currentWeek, completedLessons,
}) {
  const [cpCopied,     setCpCopied]     = useState(false)
  const [pasteCode,    setPasteCode]    = useState('')
  const [pasteError,   setPasteError]   = useState('')
  const [resetStep,    setResetStep]    = useState('idle')
  const [cohortCode,   setCohortCode]   = useState('')
  const [cohortStatus, setCohortStatus] = useState('idle')
  const [cardCopied,   setCardCopied]   = useState(false)

  const savedCode  = progressToCode()
  const restoreUrl = savedCode ? `${window.location.origin}/?restore=${savedCode}` : null

  function handleCopyCard() {
    const id = getLearnerId()
    if (!id) return
    navigator.clipboard.writeText(`${window.location.origin}/card.html?id=${id}`).then(() => {
      setCardCopied(true)
      setTimeout(() => setCardCopied(false), 2500)
    })
  }

  async function handleCohortJoin() {
    if (!cohortCode.trim()) return
    setCohortStatus('joining')
    const ok = await joinCohort(cohortCode.trim())
    setCohortStatus(ok ? 'done' : 'error')
    if (ok) setTimeout(() => setCohortStatus('idle'), 3000)
  }

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

  // ── Progress view ─────────────────────────────────────────────────────────
  if (currentView === 'progress') {
    const completedIds = Array.from(completedLessons ?? [])
    const earned = earnedBadges ?? []

    return (
      <div className="desktop">
        <div className="desktop__full-view">
          <div className="desktop__progress-screen">
            <button className="desktop__progress-back" onClick={onBack}>← back</button>

            <div className="desktop__progress-header">
              <span className="desktop__progress-owl">🦉</span>
              <div style={{ flex: 1 }}>
                <div className="desktop__progress-xp">{totalXP} <span>XP earned</span></div>
                <div className="desktop__progress-week">{completedIds.length} of {LESSONS.length} lessons complete</div>
              </div>
              {earned.includes('graduate') && (
                <button
                  className={`desktop__progress-card-btn${cardCopied ? ' desktop__progress-card-btn--done' : ''}`}
                  onClick={handleCopyCard}
                >
                  {cardCopied ? '✓ copied' : '🔗 share card'}
                </button>
              )}
            </div>

            <div className="desktop__progress-weeks">
              {WEEKS.map(w => {
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

            {completedIds.includes('code-bootcamp') && completedIds.includes('git-basics') && (
              <div className="desktop__progress-next">
                <div className="desktop__progress-next-label">what's next</div>
                <a className="desktop__progress-next-card" href="https://py-bite.kontor.studio" target="_blank" rel="noopener noreferrer">
                  <span className="desktop__progress-next-icon">🐍</span>
                  <div className="desktop__progress-next-body">
                    <div className="desktop__progress-next-title">py-bite</div>
                    <div className="desktop__progress-next-desc">18 Python lessons — basics to advanced. The natural next step.</div>
                  </div>
                  <span className="desktop__progress-next-arrow">→</span>
                </a>
              </div>
            )}

            <div className="desktop__progress-checkpoint">
              <div className="desktop__progress-cp-heading">continue on any device or browser</div>
              <p className="desktop__progress-cp-desc">Copy this link and open it anywhere — your progress restores instantly.</p>

              {restoreUrl ? (
                <div className="desktop__progress-cp-row">
                  <input readOnly className="desktop__progress-cp-input" value={restoreUrl} onFocus={e => e.target.select()} onClick={e => e.target.select()} />
                  <button className={`desktop__progress-cp-btn${cpCopied ? ' desktop__progress-cp-btn--done' : ''}`} onClick={handleCopyLink}>
                    {cpCopied ? 'copied ✓' : 'copy link'}
                  </button>
                </div>
              ) : (
                <p className="desktop__progress-cp-empty">Complete a lesson to generate your checkpoint link.</p>
              )}

              <div className="desktop__progress-cp-divider">restore from a saved link</div>
              <div className="desktop__progress-cp-row">
                <input className="desktop__progress-cp-input" placeholder="paste your link or code here" value={pasteCode} onChange={e => setPasteCode(e.target.value)} />
                <button className="desktop__progress-cp-btn" onClick={handleRestoreCode} disabled={!pasteCode.trim()}>restore</button>
              </div>
              {pasteError && <p className="desktop__progress-cp-error">{pasteError}</p>}

              <div className="desktop__progress-cp-divider">join a cohort</div>
              <div className="desktop__progress-cp-row">
                <input className="desktop__progress-cp-input" placeholder="enter cohort code e.g. BATCH1" value={cohortCode} onChange={e => setCohortCode(e.target.value.toUpperCase())} maxLength={12} />
                <button className="desktop__progress-cp-btn" onClick={handleCohortJoin} disabled={!cohortCode.trim() || cohortStatus === 'joining' || cohortStatus === 'done'}>
                  {cohortStatus === 'joining' ? '…' : cohortStatus === 'done' ? 'joined ✓' : 'join'}
                </button>
              </div>
              {cohortStatus === 'error' && <p className="desktop__progress-cp-error">couldn't join — check the code and try again.</p>}

              <div className="desktop__progress-cp-reset">
                {resetStep === 'idle' ? (
                  <button className="desktop__progress-cp-reset-btn" onClick={() => setResetStep('confirm')}>start fresh</button>
                ) : (
                  <span className="desktop__progress-cp-reset-confirm">
                    this will erase all progress —&nbsp;
                    <button onClick={() => { resetProgress(); window.location.reload() }}>yes, reset</button>
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

  // ── Main desktop view ─────────────────────────────────────────────────────
  return (
    <div className="desktop">
      <div className="desktop__content">
        <DailyMission completedLessons={completedLessons} onSelectLesson={onSelectLesson} />

        <div className="desktop__weeks">
          {WEEKS.map(w => (
            <WeekSection
              key={w}
              week={w}
              lessons={LESSONS.filter(l => l.week === w)}
              currentWeek={currentWeek}
              getLessonStatus={getLessonStatus}
              onSelectLesson={onSelectLesson}
              completedLessons={completedLessons}
            />
          ))}
        </div>

        <div className="desktop__footer">
          <button className="desktop__explore-btn" onClick={() => onOpenApp('playground')}>
            🎮 free explore — open any app
          </button>
          <div className="desktop__ext-links">
            <a href="https://kontor.studio" target="_blank" rel="noopener noreferrer" className="desktop__ext-link">kontor.studio ↗</a>
            <a href="https://kwasikontor.dev" target="_blank" rel="noopener noreferrer" className="desktop__ext-link">kwasikontor.dev ↗</a>
          </div>
        </div>
      </div>
    </div>
  )
}
