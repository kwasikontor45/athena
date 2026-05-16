import { useState, useEffect } from 'react'
import { PHASES, getPhase } from './circadian-phases'

const REENTRY_HOURS = 4
const STORAGE_KEY = 'athena_last_open'

function checkReEntry() {
  const last = localStorage.getItem(STORAGE_KEY)
  if (!last) return true
  return (Date.now() - Number(last)) / 3_600_000 >= REENTRY_HOURS
}

export function useCircadian() {
  const [hour, setHour] = useState(() => new Date().getHours())
  const [isReEntry] = useState(checkReEntry)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    const id = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(id)
  }, [])

  const phase = getPhase(hour)
  return { phase, palette: PHASES[phase], isReEntry }
}
