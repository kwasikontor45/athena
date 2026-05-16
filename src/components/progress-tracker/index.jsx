import { useEffect, useRef, useState } from 'react'
import { LESSONS } from '../../utils/lessons'
import './progress-tracker.css'

function buildSummary({ completedLessons, earnedBadges, totalXP, currentWeek }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  }) + ' at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const totalWeeks = Math.max(...LESSONS.map(l => l.week))
  const completedCount = LESSONS.filter(l => completedLessons?.has(l.id)).length

  const lessonLines = LESSONS.map(l =>
    `  ${completedLessons?.has(l.id) ? '✓' : '○'} ${l.title}`
  ).join('\n')

  const badgeLines = earnedBadges?.length
    ? earnedBadges.map(b => `  ✦ ${b}`).join('\n')
    : '  (none yet)'

  return [
    '─────────────────────',
    'athena progress report',
    dateStr,
    '─────────────────────',
    `week ${currentWeek} of ${totalWeeks}`,
    `total xp: ${totalXP}`,
    '',
    `lessons completed (${completedCount} of ${LESSONS.length}):`,
    lessonLines,
    '',
    'badges earned:',
    badgeLines,
    '─────────────────────',
  ].join('\n')
}

export default function ProgressTracker({ currentWeek, totalXP, weekCompleted, weekTotal, completedLessons, earnedBadges }) {
  const pct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
  const prevXP = useRef(totalXP)
  const [flash, setFlash] = useState(false)
  const [shareState, setShareState] = useState('idle') // idle | copied | failed

  useEffect(() => {
    if (totalXP > prevXP.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 800)
      prevXP.current = totalXP
      return () => clearTimeout(t)
    }
    prevXP.current = totalXP
  }, [totalXP])

  function handleShare() {
    const text = buildSummary({ completedLessons, earnedBadges, totalXP, currentWeek })
    navigator.clipboard.writeText(text).then(() => {
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 1500)
    }).catch(() => {
      setShareState('failed')
      setTimeout(() => setShareState('idle'), 1500)
    })
  }

  const shareLabel = shareState === 'copied' ? 'copied! ✓' : shareState === 'failed' ? 'try again' : 'share progress'

  return (
    <div className="pt">
      <span className="pt__week">week {currentWeek}</span>
      <div className="pt__bar" title={`${weekCompleted} of ${weekTotal} lessons complete`}>
        <div className="pt__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`pt__xp${flash ? ' pt__xp--flash' : ''}`}>{totalXP} xp</span>
      <button
        className={`pt__share${shareState === 'copied' ? ' pt__share--copied' : shareState === 'failed' ? ' pt__share--failed' : ''}`}
        onClick={handleShare}
      >
        {shareLabel}
      </button>
    </div>
  )
}
