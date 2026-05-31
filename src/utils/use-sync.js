const WORKER_URL     = ''
const PASSPHRASE_KEY = 'athena_passphrase'
const LEARNER_ID_KEY = 'athena_learner_id'
const QUEUE_KEY      = 'athena_event_queue'
const FLUSH_INTERVAL = 30_000

// One session ID per page load — threads through all events so dashboard can count sessions
const SESSION_ID = crypto.randomUUID()

// ── Passphrase generation ──────────────────────────────────────────────────
const WORDS = [
  'amber','blue','cedar','dawn','echo','forge','glass','haven','indigo','jade',
  'kite','lemon','maple','nova','onyx','pearl','quartz','raven','stone','thorn',
  'ultra','vault','wheat','xenon','yew','zinc','crane','delta','ember','frost',
  'grove','haze','iris','juniper','kelp','lunar','moss','north','orbit','pine',
]

function genPassphrase() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  const num  = Math.floor(Math.random() * 90) + 10
  return `${pick()}-${pick()}-${num}`
}

function getOrCreatePassphrase() {
  let p = localStorage.getItem(PASSPHRASE_KEY)
  if (!p) {
    p = genPassphrase()
    localStorage.setItem(PASSPHRASE_KEY, p)
  }
  return p
}

// ── Event queue ────────────────────────────────────────────────────────────
function enqueue(event) {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    q.push({ ...event, timestamp: event.timestamp || Date.now() })
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-200)))
  } catch {}
}

function drainQueue() {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    localStorage.setItem(QUEUE_KEY, '[]')
    return q
  } catch { return [] }
}

// ── Flush to worker ────────────────────────────────────────────────────────
async function flush(learnerId) {
  const events = drainQueue()
  if (!events.length || !learnerId) return
  try {
    const res = await fetch(`${WORKER_URL}/events`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ learner_id: learnerId, session_id: SESSION_ID, events }),
    })
    if (!res.ok) {
      // Re-enqueue on failure so events aren't lost
      events.forEach(enqueue)
    }
  } catch {
    events.forEach(enqueue)
  }
}

// ── Identify (get or create learner) ──────────────────────────────────────
async function identify(passphrase) {
  const res = await fetch(`${WORKER_URL}/identify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ passphrase }),
  })
  if (!res.ok) throw new Error('identify failed')
  return res.json()
}

// ── Hook ──────────────────────────────────────────────────────────────────
let learnerId = localStorage.getItem(LEARNER_ID_KEY) || null
let flushTimer = null

function startFlushTimer() {
  if (flushTimer) return
  flushTimer = setInterval(() => flush(learnerId), FLUSH_INTERVAL)
}

// Initialize on import — non-blocking
;(async () => {
  try {
    if (!learnerId) {
      const passphrase = getOrCreatePassphrase()
      const result     = await identify(passphrase)
      learnerId = result.learner_id
      localStorage.setItem(LEARNER_ID_KEY, learnerId)
    }
    startFlushTimer()
    // Flush any queued events from previous sessions
    await flush(learnerId)
    // Flush on page unload
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush(learnerId)
    })
  } catch {
    // Offline or worker down — queue will persist and flush next session
  }
})()

export function trackEvent(lesson, event, context = '') {
  enqueue({ lesson, event, context })
  // Eagerly flush if we have a learner_id
  if (learnerId) flush(learnerId)
}

export function getPassphrase() {
  return localStorage.getItem(PASSPHRASE_KEY) || null
}

export function getLearnerId() {
  return learnerId || localStorage.getItem(LEARNER_ID_KEY) || null
}

export async function joinCohort(cohortCode) {
  const id = getLearnerId()
  if (!id || !cohortCode) return false
  try {
    const res = await fetch(`${WORKER_URL}/cohort/join`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ learner_id: id, cohort_code: cohortCode }),
    })
    return res.ok
  } catch { return false }
}

export async function restoreFromPassphrase(passphrase) {
  try {
    const result = await identify(passphrase)
    learnerId = result.learner_id
    localStorage.setItem(LEARNER_ID_KEY, learnerId)
    localStorage.setItem(PASSPHRASE_KEY, passphrase)
    if (!result.is_new) {
      const res = await fetch(`${WORKER_URL}/progress/${learnerId}`)
      if (res.ok) return res.json()
    }
    return { learner: result, events: [] }
  } catch { return null }
}
