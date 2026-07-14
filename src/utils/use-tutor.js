// Client for the shared kontor-tutor-worker (see the tutor-worker repo).
// Feature is off by default — VITE_TUTOR_WORKER_URL is unset until the
// Worker is actually deployed, so this quietly no-ops (offline responses
// still work) rather than breaking the site.
const WORKER_URL = import.meta.env.VITE_TUTOR_WORKER_URL || ''

export function tutorEnabled() {
  return Boolean(WORKER_URL)
}

export async function askTutor({ lessonTitle, question, recentContext }) {
  if (!WORKER_URL) return { error: 'tutor not configured' }
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: 'athena', lessonTitle, question, recentContext }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'tutor is unavailable right now' }
    return { reply: data.reply }
  } catch {
    return { error: 'tutor is unavailable right now' }
  }
}
