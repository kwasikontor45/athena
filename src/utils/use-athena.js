import { athenaResponses } from './athena-responses'
import { getLearnerId } from './use-sync'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const GROQ_KEY       = import.meta.env.VITE_GROQ_API_KEY
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const WORKER_URL     = 'https://athena-sync.kwasikontor45-995.workers.dev'

const DIRECT_KEYWORDS = [
  { match: /\b(close|exit|quit|back|leave|stop)\b/i,
    reply: 'Click the red dot in the top-left corner of the sim to close it.' },
  { match: /\b(hi|hello|hey|good\s*(morning|afternoon|evening|night))\b/i,
    reply: "Hi! I'm Athena — choose any lesson from the panel and I'll guide you through it step by step." },
  { match: /\b(thank|thanks|cheers)\b/i,
    reply: "You're welcome! Keep going — you're doing great." },
  { match: /\b(help|lost|stuck|confused|what\s*do|how\s*do|what\s*now|start)\b/i,
    reply: 'Pick any lesson from the panel on the left — click it and it will open right here. I\'ll explain each step as you go.' },
  { match: /\b(next|done|finish|complete|completed)\b/i,
    reply: 'Nice work! Check the lesson panel on the left — completed lessons show a tick, and the next one will be ready.' },
]

// ── Learner context cache ──────────────────────────────────────────────────
let _ctxCache    = null
let _ctxCacheAt  = 0
const CTX_TTL    = 60_000  // re-fetch at most once per minute

async function fetchLearnerContext() {
  const id = getLearnerId()
  if (!id) return null

  const now = Date.now()
  if (_ctxCache && (now - _ctxCacheAt) < CTX_TTL) return _ctxCache

  try {
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${WORKER_URL}/progress/${id}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null

    const { learner, events } = await res.json()

    // Completed lessons
    const completedLessons = [...new Set(
      events.filter(e => e.event === 'lesson-complete').map(e => e.lesson)
    )]

    // Weak spots — lessons with 2+ step-fails
    const failMap = {}
    events.filter(e => e.event === 'step-failed').forEach(e => {
      failMap[e.lesson] = (failMap[e.lesson] || 0) + 1
    })
    const weakSpots = Object.entries(failMap)
      .filter(([, n]) => n >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lesson, n]) => `${lesson} (${n} attempts)`)

    // Journey length
    const journeyDays = learner?.created_at
      ? Math.max(1, Math.round((Date.now() - learner.created_at) / 86_400_000))
      : 0

    _ctxCache   = { completedLessons, weakSpots, journeyDays, totalEvents: events.length }
    _ctxCacheAt = now
    return _ctxCache
  } catch {
    return null  // network down or worker unavailable — degrade gracefully
  }
}

const ALL_LESSONS = ['mouse-basics','keyboard-basics','desktop-navigation','file-explorer','email','browser','doc-editor','school-portal','video-call','shortcuts','password-security','code-bootcamp','git-basics']

function buildLearnerBlock(ctx) {
  if (!ctx) return ''
  const parts = []

  if (ctx.completedLessons.length === 0) {
    parts.push('This learner is just starting out — no lessons completed yet.')
  } else {
    parts.push(`Completed lessons (${ctx.completedLessons.length}): ${ctx.completedLessons.join(', ')}.`)
  }

  const nextLesson = ALL_LESSONS.find(l => !ctx.completedLessons.includes(l))
  if (nextLesson) parts.push(`Their next suggested lesson: ${nextLesson}.`)

  if (ctx.weakSpots.length > 0) {
    parts.push(`Areas of struggle: ${ctx.weakSpots.join(', ')}.`)
  }

  if (ctx.journeyDays > 1) {
    parts.push(`Has been learning for ${ctx.journeyDays} days.`)
  }

  return `\n\nLEARNER PROFILE:\n${parts.join(' ')}\nUse this to personalise your response — reference what they've done, acknowledge struggles by name, celebrate milestones. Keep it natural, not robotic.`
}

// ── System prompt builder ──────────────────────────────────────────────────
function buildSystemPrompt(lesson, event, context, learnerBlock) {
  const generalBase = `You are Athena, a patient, encouraging, and concise learning companion. You help beginners get comfortable with computers and everyday software. You speak in plain English, never use jargon without explaining it, and keep responses to 1–3 sentences. You celebrate small wins.`
  const codingBase  = `You are Athena, a patient, encouraging, and concise coding mentor. You help a learner build real projects using web technologies. You speak in plain English, never use jargon without explaining it, and keep responses to 1–3 sentences. You celebrate small wins.`

  const profile = learnerBlock || ''

  if (event === 'direct-question') {
    return `${generalBase}${profile}\n\nThe learner asks: "${context}". Respond helpfully and briefly.`
  }

  if (lesson === 'code-bootcamp') {
    const stepInfo = context ? `They are on the step: "${context}".` : ''
    if (event === 'step-failed') {
      return `${codingBase}${profile}\n\nThe learner is writing a Python grade calculator. ${stepInfo} Their code check just failed. Give one short, encouraging nudge — don't give the answer away, just help them think about what Python syntax or structure to check.`
    }
    if (event === 'step-advanced') {
      return `${codingBase}${profile}\n\nThe learner just completed the Python step: "${context}". Celebrate briefly and set up excitement for what comes next.`
    }
    if (event === 'lesson-complete') {
      return `${codingBase}${profile}\n\nThe learner just finished Code Bootcamp — they wrote a working Python grade calculator and ran it live in the browser. Celebrate genuinely. Mention that their script is ready to version-control with Git next.`
    }
  }

  if (lesson === 'git-basics') {
    const stepInfo = context ? `Current step: "${context}".` : ''
    if (event === 'step-failed') {
      return `${codingBase}${profile}\n\nThe learner is learning Git. ${stepInfo} Their command check failed. Give one short nudge — help them think about the right command without revealing it.`
    }
    if (event === 'step-advanced') {
      return `${codingBase}${profile}\n\nThe learner just completed a Git step: "${context}". Celebrate briefly and hint at what's coming next.`
    }
    if (event === 'lesson-complete') {
      return `${codingBase}${profile}\n\nThe learner just completed Git Basics — their first real version control workflow. Celebrate this genuinely.`
    }
  }

  return `${generalBase}${profile}\n\nThe learner is in the "${lesson}" lesson. They just triggered: "${event}". ${context ? `Context: ${context}` : ''} Respond briefly and encouragingly.`
}

// ── Offline fallback ───────────────────────────────────────────────────────
function getOfflineResponse(lesson, event, context) {
  const lessonBank = athenaResponses[lesson]
  if (lessonBank?.[event]) {
    const raw = pickRandom(lessonBank[event])
    return raw.replace(/\{streak\}/g, context || '')
  }

  if (event === 'direct-question' && context) {
    for (const { match, reply } of DIRECT_KEYWORDS) {
      if (match.test(context)) return reply
    }
  }

  const globalBank = athenaResponses._global
  if (globalBank?.[event]) return pickRandom(globalBank[event])
  return "You're doing great — keep going, one step at a time."
}

// ── API calls ──────────────────────────────────────────────────────────────
async function askGroq(systemPrompt, userPrompt) {
  if (!GROQ_KEY) throw new Error('no groq key')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.7,
      max_tokens:  160,
    }),
  })

  if (!res.ok) throw new Error(`groq ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim()
}

async function askOpenRouter(systemPrompt, userPrompt) {
  if (!OPENROUTER_KEY) throw new Error('no openrouter key')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://athena.kontor.studio',
      'X-Title': 'Athena',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.7,
      max_tokens:  160,
    }),
  })

  if (!res.ok) throw new Error(`openrouter ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim()
}

// ── Hook ───────────────────────────────────────────────────────────────────
export default function useAthena() {
  const ask = async ({ lesson, event, context = '' }) => {
    // Fetch learner profile — non-blocking, degrades to generic on failure
    const ctx          = await fetchLearnerContext()
    const learnerBlock = buildLearnerBlock(ctx)
    const systemPrompt = buildSystemPrompt(lesson, event, context, learnerBlock)
    const userPrompt   = `Lesson: ${lesson} | Event: ${event}${context ? ` | Context: ${context}` : ''}`

    try {
      const text = await askGroq(systemPrompt, userPrompt)
      if (text) return text
    } catch (e) {
      console.warn('groq failed:', e.message)
    }

    try {
      const text = await askOpenRouter(systemPrompt, userPrompt)
      if (text) return text
    } catch (e) {
      console.warn('openrouter failed:', e.message)
    }

    return getOfflineResponse(lesson, event, context)
  }

  return { ask }
}
