import { useState, useEffect } from 'react'
import ProgressTracker from '../progress-tracker'
import './taskbar.css'

const NAV_ITEMS = [
  { id: 'desktop',  label: 'Desktop'  },
  { id: 'lessons',  label: 'Lessons'  },
  { id: 'practice', label: 'Practice' },
  { id: 'progress', label: 'Progress' },
]

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function Taskbar({ currentView, onNavigate, currentWeek, totalXP, weekCompleted, weekTotal }) {
  const [time, setTime] = useState(formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 60_000)
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
        <ProgressTracker
          currentWeek={currentWeek}
          totalXP={totalXP}
          weekCompleted={weekCompleted}
          weekTotal={weekTotal}
        />
      </div>
    </header>
  )
}
