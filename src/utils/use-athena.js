import { athenaResponses } from './athena-responses'
import codebaseSummary from '../data/codebase-summary.json'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const DIRECT_KEYWORDS = [
  { match: /\b(close|exit|quit|back|leave|stop)\b/i,
    reply: 'Click the red dot in the top-left corner of the window to close it.' },
  { match: /\b(hi|hello|hey|good\s*(morning|afternoon|evening|night))\b/i,
    reply: 'Hi! I\'m Athena — choose any lesson from the left panel and I\'ll guide you through it step by step.' },
  { match: /\b(thank|thanks|cheers)\b/i,
    reply: 'You\'re welcome! Keep going — you\'re doing great.' },
  { match: /\b(help|lost|stuck|confused|what\s*do|how\s*do|what\s*now|start)\b/i,
    reply: 'Pick any lesson from the panel on the left — click it and a practice window will open. I\'ll explain each step as you go.' },
  { match: /\b(next|done|finish|complete|completed)\b/i,
    reply: 'Nice work! Check the lesson panel on the left — completed lessons show a tick, and the next one will be ready.' },
  { match: /\b(move|drag|window|screen)\b/i,
    reply: 'You can drag any window by clicking and holding its title bar, then moving your mouse.' },
]

function formatRepoContext() {
  if (!codebaseSummary?.repos) return ''
  const repos = Object.entries(codebaseSummary.repos)
  if (repos.length === 0) return ''
  const lines = repos.map(([name, info]) => {
    const stack = info.stack?.join(', ') || 'unknown'
    const naming = info.patterns?.fileNaming || 'unknown'
    return `- ${name}: ${stack}. file naming: ${naming}. key files: ${info.keyFiles?.slice(0, 3).join(', ')}`
  })
  return `\n\nThe learner\'s projects:\n${lines.join('\n')}`
}

function buildSystemPrompt(lesson, event, context) {
  const repoContext = formatRepoContext()
  const base = `You are Athena, a patient, encouraging, and concise coding mentor. You help a learner build real projects using web technologies. You speak in plain English, never use jargon without explaining it, and keep responses to 1–3 sentences. You celebrate small wins. You reference the learner\'s own projects and patterns when giving advice.${repoContext}`

  if (event === 'direct-question') {
    return `${base}\n\nThe learner asks: "${context}". Respond helpfully and briefly. If relevant, reference their project patterns above.`
  }

  return `${base}\n\nThe learner is in the "${lesson}" lesson. They just triggered: "${event}". ${context ? `Context: ${context}` : ''} Respond briefly and encouragingly.`
}

function getOfflineResponse(lesson, event, context) {
  const lessonBank = athenaResponses[lesson]
  if (lessonBank?.[event]) return pickRandom(lessonBank[event])

  if (event === 'direct-question' && context) {
    for (const { match, reply } of DIRECT_KEYWORDS) {
      if (match.test(context)) return reply
    }
  }

  const globalBank = athenaResponses._global
  if (globalBank?.[event]) return pickRandom(globalBank[event])
  return "You're doing great — keep going, one step at a time."
}

async function askGroq(prompt) {
  if (!GROQ_KEY) throw new Error('no groq key')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are Athena, a friendly and concise tech tutor.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`groq error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim()
}

async function askOpenRouter(prompt) {
  if (!OPENROUTER_KEY) throw new Error('no openrouter key')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://athena.kontor.studio',
      'X-Title': 'Athena',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: 'You are Athena, a friendly and concise tech tutor.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`openrouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim()
}

export default function useAthena() {
  const ask = async ({ lesson, event, context = '' }) => {
    const prompt = buildSystemPrompt(lesson, event, context)

    try {
      const text = await askGroq(prompt)
      if (text) return text
    } catch (e) {
      console.warn('groq failed:', e.message)
    }

    try {
      const text = await askOpenRouter(prompt)
      if (text) return text
    } catch (e) {
      console.warn('openrouter failed:', e.message)
    }

    return getOfflineResponse(lesson, event, context)
  }

  return { ask }
}
