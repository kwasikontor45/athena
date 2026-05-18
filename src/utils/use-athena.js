import { useState, useEffect, useCallback } from 'react'
import { athenaResponses } from './athena-responses'

const API_URL = 'https://api.anthropic.com/v1/messages'

const SYSTEM_PROMPT =
  'You are Athena, a warm and encouraging computer literacy tutor inside a learning ' +
  'sandbox called Athena at kontor.studio. Your learner is a total beginner preparing ' +
  'for a business administration associates degree program. ' +
  'Rules: always respond in 2 sentences or fewer. Use empowering words: Perfect, ' +
  'Excellent, You\'ve got this. Never say wrong, error, failed, or incorrect. ' +
  'Be specific to what just happened (use the event context). ' +
  'Speak directly: use "you" and "your". Sound human, warm, and calm — never robotic.'

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const DIRECT_KEYWORDS = [
  { match: /\b(close|exit|quit|back|leave|stop)\b/i,
    reply: "Click the red dot in the top-left corner of the window to close it, or press the red button on the sim's title bar." },
  { match: /\b(hi|hello|hey|good\s*(morning|afternoon|evening|night))\b/i,
    reply: "Hi! I'm Athena — choose any lesson from the left panel and I'll guide you through it step by step." },
  { match: /\b(thank|thanks|cheers)\b/i,
    reply: "You're welcome! Keep going — you're doing great." },
  { match: /\b(help|lost|stuck|confused|what\s*do|how\s*do|what\s*now)\b/i,
    reply: "Pick any lesson from the panel on the left — click it and a practice window will open. I'll explain each step as you go." },
  { match: /\b(next|done|finish|complete|completed)\b/i,
    reply: "Nice work! Check the lesson panel on the left — completed lessons show a tick, and the next one will be ready for you." },
]

function getFallback(lesson, event, context) {
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

export default function useAthena() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  const ask = useCallback(async ({ lesson, event, context = '' }) => {
    if (!isOnline) return getFallback(lesson, event, context)

    setIsLoading(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-client-side-key-exposures': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 150,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: event === 'direct-question'
                ? `The learner says: "${context}". Respond conversationally. If they seem unsure what to do, guide them to pick a lesson from the left panel.`
                : `Lesson: ${lesson}. Event: ${event}. Context: ${context}`,
            },
          ],
        }),
      })

      if (!res.ok) throw new Error('api-error')
      const data = await res.json()
      return data.content?.[0]?.text ?? getFallback(lesson, event, context)
    } catch {
      return getFallback(lesson, event, context)
    } finally {
      setIsLoading(false)
    }
  }, [isOnline])

  return { ask, isOnline, isLoading }
}
