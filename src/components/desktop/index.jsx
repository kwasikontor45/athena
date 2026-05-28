import { useState } from 'react'
import LessonPanel from '../lesson-panel'
import { LESSONS, WEEKS } from '../../utils/lessons'
import { progressToCode, codeToProgress, resetProgress } from '../../utils/use-progress'
import { joinCohort, getPassphrase, getLearnerId } from '../../utils/use-sync'
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
  getLessonStatus, getEventProgress, onSelectLesson,
  earnedBadges, totalXP, currentWeek, completedLessons,
}) {
  const [cpCopied,         setCpCopied]         = useState(false)
  const [pasteCode,        setPasteCode]        = useState('')
  const [pasteError,       setPasteError]       = useState('')
  const [resetStep,        setResetStep]        = useState('idle')
  const [cohortCode,       setCohortCode]       = useState('')
  const [cohortStatus,     setCohortStatus]     = useState('idle') // idle | joining | done | error
  const [cardCopied,       setCardCopied]       = useState(false)
  const [lessonPanelOpen, setLessonPanelOpen] = useState(() => {
    try { return localStorage.getItem('athena_lesson_panel') !== 'closed' } catch { return true }
  })

  const savedCode  = progressToCode()
  const restoreUrl = savedCode ? `${window.location.origin}/?restore=${savedCode}` : null

  function handleCopyCard() {
    const id = getLearnerId()
    if (!id) return
    const url = `${window.location.origin}/card.html?id=${id}`
    navigator.clipboard.writeText(url).then(() => {
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

  function toggleLessonPanel() {
    const next = !lessonPanelOpen
    setLessonPanelOpen(next)
    try { localStorage.setItem('athena_lesson_panel', next ? 'open' : 'closed') } catch {}
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
              <div style={{ flex: 1 }}>
                <div className="desktop__progress-xp">{totalXP} <span>XP earned</span></div>
                <div className="desktop__progress-week">Week {currentWeek} of 4 — {completedIds.length} of {LESSONS.length} lessons complete</div>
              </div>
              {earned.includes('graduate') && (
                <button
                  className={`desktop__progress-card-btn${cardCopied ? ' desktop__progress-card-btn--done' : ''}`}
                  onClick={handleCopyCard}
                  title="copy your shareable card link"
                >
                  {cardCopied ? '✓ copied' : '🔗 share card'}
                </button>
              )}
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

            {completedIds.includes('code-bootcamp') && completedIds.includes('git-basics') && (
              <div className="desktop__progress-next">
                <div className="desktop__progress-next-label">what's next</div>
                <a
                  className="desktop__progress-next-card"
                  href="https://py-bite.kontor.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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

              <div className="desktop__progress-cp-divider">join a cohort</div>
              <div className="desktop__progress-cp-row">
                <input
                  className="desktop__progress-cp-input"
                  placeholder="enter cohort code e.g. BATCH1"
                  value={cohortCode}
                  onChange={e => setCohortCode(e.target.value.toUpperCase())}
                  maxLength={12}
                />
                <button
                  className="desktop__progress-cp-btn"
                  onClick={handleCohortJoin}
                  disabled={!cohortCode.trim() || cohortStatus === 'joining' || cohortStatus === 'done'}
                >
                  {cohortStatus === 'joining' ? '…' : cohortStatus === 'done' ? 'joined ✓' : 'join'}
                </button>
              </div>
              {cohortStatus === 'error' && (
                <p className="desktop__progress-cp-error">couldn't join — check the code and try again.</p>
              )}

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
      {lessonPanelOpen && (
        <aside className="desktop__lesson-panel">
          <LessonPanel
            getLessonStatus={getLessonStatus}
            getEventProgress={getEventProgress}
            onSelectLesson={onSelectLesson}
          />
        </aside>
      )}

      <div className="desktop__grid-area">
        <div className="desktop__grid-topbar">
          <button
            className={`desktop__panel-toggle${lessonPanelOpen ? ' desktop__panel-toggle--open' : ''}`}
            onClick={toggleLessonPanel}
            title={lessonPanelOpen ? 'Hide lessons' : 'Show lessons'}
          >
            {lessonPanelOpen ? '‹ lessons' : '› lessons'}
          </button>
        </div>
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

    </div>
  )
}
