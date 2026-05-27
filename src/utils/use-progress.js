import { useState, useCallback } from 'react'
import { LESSONS, WEEKS } from './lessons'

const STORAGE_KEY = 'athena-progress'

const BADGE_RULES = [
  { badge: 'first-click', lessonId: 'mouse-basics' },
  { badge: 'explorer',    lessonId: 'file-explorer' },
  { badge: 'emailer',     lessonId: 'email' },
  { badge: 'scholar',     lessonId: 'school-portal' },
]

function serialize(s) {
  return JSON.stringify({
    completedLessons: [...s.completedLessons],
    completedEvents: Object.fromEntries(
      Object.entries(s.completedEvents).map(([k, v]) => [k, [...v]])
    ),
    earnedBadges: s.earnedBadges,
    totalXP: s.totalXP,
  })
}

function deserialize(json) {
  try {
    const raw = JSON.parse(json)
    return {
      completedLessons: new Set(raw.completedLessons ?? []),
      completedEvents: Object.fromEntries(
        Object.entries(raw.completedEvents ?? {}).map(([k, v]) => [k, new Set(v)])
      ),
      earnedBadges: raw.earnedBadges ?? [],
      totalXP: raw.totalXP ?? 0,
    }
  } catch {
    return blank()
  }
}

function blank() {
  return { completedLessons: new Set(), completedEvents: {}, earnedBadges: [], totalXP: 0 }
}

export function exportProgress() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  return raw
}

export function importProgress(json) {
  const parsed = deserialize(json)
  localStorage.setItem(STORAGE_KEY, serialize(parsed))
  return parsed
}

function deriveCurrentWeek(completedLessons) {
  for (const week of WEEKS) {
    const weekLessons = LESSONS.filter(l => l.week === week)
    if (!weekLessons.every(l => completedLessons.has(l.id))) return week
  }
  return WEEKS[WEEKS.length - 1]
}

export default function useProgress() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? deserialize(saved) : blank()
  })

  const recordEvent = useCallback((lessonId, eventName) => {
    if (eventName === 'lesson-complete') return

    setState(prev => {
      const lesson = LESSONS.find(l => l.id === lessonId)
      if (!lesson) return prev

      const prevEvents = prev.completedEvents[lessonId] ?? new Set()
      if (prevEvents.has(eventName)) return prev

      const nextEvents = new Set(prevEvents)
      nextEvents.add(eventName)
      const nextCompletedEvents = { ...prev.completedEvents, [lessonId]: nextEvents }
      const nextCompletedLessons = new Set(prev.completedLessons)
      let nextBadges = [...prev.earnedBadges]
      let nextXP = prev.totalXP + 10

      const allDone = lesson.requiredEvents.every(e => nextEvents.has(e))
      if (allDone && !prev.completedLessons.has(lessonId)) {
        nextCompletedLessons.add(lessonId)
        nextXP += 50

        for (const { badge, lessonId: lid } of BADGE_RULES) {
          if (lid === lessonId && !nextBadges.includes(badge)) {
            nextBadges = [...nextBadges, badge]
          }
        }
        if (LESSONS.every(l => nextCompletedLessons.has(l.id)) && !nextBadges.includes('graduate')) {
          nextBadges = [...nextBadges, 'graduate']
        }
      }

      const next = {
        completedLessons: nextCompletedLessons,
        completedEvents: nextCompletedEvents,
        earnedBadges: nextBadges,
        totalXP: nextXP,
      }
      localStorage.setItem(STORAGE_KEY, serialize(next))
      return next
    })
  }, [])

  const getLessonStatus = useCallback((lessonId) => {
    if (state.completedLessons.has(lessonId)) return 'complete'
    const lesson = LESSONS.find(l => l.id === lessonId)
    if (!lesson) return 'locked'
    const currentWeek = deriveCurrentWeek(state.completedLessons)
    return lesson.week <= currentWeek ? 'active' : 'locked'
  }, [state.completedLessons])

  const getWeekProgress = useCallback((weekNumber) => {
    const weekLessons = LESSONS.filter(l => l.week === weekNumber)
    const completed = weekLessons.filter(l => state.completedLessons.has(l.id)).length
    return { total: weekLessons.length, completed }
  }, [state.completedLessons])

  const getEventProgress = useCallback((lessonId) => {
    const lesson = LESSONS.find(l => l.id === lessonId)
    if (!lesson) return { total: 0, completed: 0 }
    const done = state.completedEvents[lessonId] ?? new Set()
    const completed = lesson.requiredEvents.filter(e => done.has(e)).length
    return { total: lesson.requiredEvents.length, completed }
  }, [state.completedEvents])

  const isEventDone = useCallback((lessonId, event) => {
    return state.completedEvents[lessonId]?.has(event) ?? false
  }, [state.completedEvents])

  const currentWeek = deriveCurrentWeek(state.completedLessons)
  const { total: weekTotal, completed: weekCompleted } = getWeekProgress(currentWeek)

  return {
    earnedBadges: state.earnedBadges,
    completedLessons: state.completedLessons,
    totalXP: state.totalXP,
    currentWeek,
    weekTotal,
    weekCompleted,
    recordEvent,
    getLessonStatus,
    getWeekProgress,
    getEventProgress,
    isEventDone,
    exportProgress,
    importProgress,
  }
}
