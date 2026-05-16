import { useState, useEffect } from 'react'
import './taskbar.css'

const NAV_ITEMS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'practice', label: 'Practice' },
  { id: 'progress', label: 'Progress' },
]

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getWeekProgress() {
  const now = new Date()
  const day = now.getDay() // 0=Sun … 6=Sat
  if (day === 0) return 0
  if (day === 6) return 100
  const schoolDayIndex = day - 1 // 0=Mon … 4=Fri
  const hours = now.getHours() + now.getMinutes() / 60
  return Math.round(((schoolDayIndex * 24 + hours) / (5 * 24)) * 100)
}

export default function Taskbar({ currentView, onNavigate }) {
  const [time, setTime] = useState(formatTime(new Date()))
  const [weekProgress, setWeekProgress] = useState(getWeekProgress())

  useEffect(() => {
    const tick = () => {
      setTime(formatTime(new Date()))
      setWeekProgress(getWeekProgress())
    }
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="taskbar">
      <div className="taskbar__brand">
        <span className="taskbar__brand-owl">🦉</span>
        <span>athena</span>
      </div>

      <nav className="taskbar__nav">
        {NAV_ITEMS.map(({ id, label }) => (
          <button
            key={id}
            className={`taskbar__nav-btn${currentView === id ? ' taskbar__nav-btn--active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="taskbar__right">
        <span className="taskbar__time">{time}</span>
        <div className="taskbar__week-bar" title={`Week ${weekProgress}% complete`}>
          <div className="taskbar__week-fill" style={{ width: `${weekProgress}%` }} />
        </div>
      </div>
    </header>
  )
}
