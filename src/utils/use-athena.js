import { athenaResponses } from './athena-responses'

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

export default function useAthena() {
  const ask = ({ lesson, event, context = '' }) => {
    return Promise.resolve(getOfflineResponse(lesson, event, context))
  }

  return { ask }
}
