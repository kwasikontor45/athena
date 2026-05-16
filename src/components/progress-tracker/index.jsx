import { useEffect, useRef, useState } from 'react'
import './progress-tracker.css'

export default function ProgressTracker({ currentWeek, totalXP, weekCompleted, weekTotal }) {
  const pct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
  const prevXP = useRef(totalXP)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (totalXP > prevXP.current) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 800)
      prevXP.current = totalXP
      return () => clearTimeout(t)
    }
    prevXP.current = totalXP
  }, [totalXP])

  return (
    <div className="pt">
      <span className="pt__week">week {currentWeek}</span>
      <div className="pt__bar" title={`${weekCompleted} of ${weekTotal} lessons complete`}>
        <div className="pt__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className={`pt__xp${flash ? ' pt__xp--flash' : ''}`}>{totalXP} xp</span>
    </div>
  )
}
