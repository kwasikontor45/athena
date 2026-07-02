import { athenaResponses } from './athena-responses'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

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

const LESSON_TOPICS = {
  'mouse-basics':        'mouse basics (clicking, right-clicking, dragging)',
  'keyboard-basics':     'keyboard basics (typing, backspace, enter)',
  'desktop-navigation':  'desktop navigation (opening apps, taskbar, managing windows)',
  'file-explorer':       'files and folders (creating, moving, renaming, deleting)',
  'email':               'email (composing, sending, replying)',
  'browser':             'web browsing (URLs, tabs, navigation, search bars)',
  'doc-editor':          'document editing (typing, formatting, saving)',
  'school-portal':       'school portal (logging in, finding assignments, uploading, submitting)',
  'typing':              'typing practice (speed, accuracy, keyboard layout)',
  'shortcuts':           'keyboard shortcuts (Ctrl+A, C, V, Z, S)',
  'password':            'password safety (creating strong passwords, staying secure)',
  'video-call':          'video calls (muting, camera, sharing, chat)',
  'code-bootcamp':       'Python programming basics (variables, functions, logic)',
  'git-basics':          'Git version control (commits, push, pull, GitHub)',
}

function buildSystemPrompt(lesson) {
  const topic = LESSON_TOPICS[lesson] || 'computer basics'
  return `You are Athena, a warm and patient computer literacy teacher. The student is currently working on a lesson about ${topic}. Answer their question in 1–2 short, clear sentences. Be encouraging, practical, and specific to their lesson. Never mention that you are an AI or a language model.`
}

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

async function askGroq(lesson, question) {
  if (!GROQ_KEY) return null
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: buildSystemPrompt(lesson) },
          { role: 'user',   content: question },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

export default function useAthena() {
  const ask = async ({ lesson, event, context = '' }) => {
    if (event === 'direct-question' && context) {
      const reply = await askGroq(lesson, context)
      if (reply) return reply
    }
    return getOfflineResponse(lesson, event, context)
  }

  return { ask }
}
