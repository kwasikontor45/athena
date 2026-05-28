import { useState } from 'react'

const KEY_COUNT = 'athena_streak_count'
const KEY_DATE  = 'athena_streak_date'

export function useStreak() {
  const [streak] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastDate  = localStorage.getItem(KEY_DATE)
    const lastCount = parseInt(localStorage.getItem(KEY_COUNT) || '0', 10)

    let count
    if (!lastDate) {
      count = 1
    } else if (lastDate === today) {
      count = lastCount || 1
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      count = lastDate === yesterday.toISOString().slice(0, 10) ? lastCount + 1 : 1
    }

    if (lastDate !== today) {
      localStorage.setItem(KEY_COUNT, String(count))
      localStorage.setItem(KEY_DATE, today)
    }

    return count
  })

  return streak
}
