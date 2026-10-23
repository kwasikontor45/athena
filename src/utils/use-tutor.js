// The production endpoint is public configuration, never a credential.
// Local development stays offline unless a developer opts in explicitly.
const DEFAULT_PRODUCTION_WORKER_URL = 'https://kontor-tutor-worker.kwasikontor45-995.workers.dev/'
const WORKER_URL = import.meta.env.VITE_TUTOR_WORKER_URL
  || (import.meta.env.PROD ? DEFAULT_PRODUCTION_WORKER_URL : '')
const REQUEST_TIMEOUT_MS = 14000
const MAX_QUESTION_LENGTH = 500
const MAX_REPLY_LENGTH = 2500
const MAX_RESPONSE_BYTES = 8192

function trustedWorkerUrl() {
  try {
    const url = new URL(WORKER_URL)
    const liveWorker = url.protocol === 'https:'
      && url.hostname === 'kontor-tutor-worker.kwasikontor45-995.workers.dev'
      && url.pathname === '/'
      && !url.search
      && !url.hash
    const localWorker = import.meta.env.DEV
      && url.origin === 'http://localhost:8787'
      && url.pathname === '/'
    return liveWorker || localWorker ? url.href : ''
  } catch {
    return ''
  }
}

async function readJsonResponse(response) {
  const length = Number(response.headers.get('Content-Length'))
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) throw new Error('response too large')
  if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
    throw new Error('unexpected response type')
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('empty response')
  const chunks = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {})
        throw new Error('response too large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  return JSON.parse(text)
}

function userFacingError(status) {
  if (status === 429) return 'Athena is busy. Try again in a little while.'
  return 'The live tutor is unavailable right now.'
}

export function tutorEnabled() {
  return Boolean(trustedWorkerUrl())
}

export async function askTutor({ lessonTitle, question, recentContext }) {
  const endpoint = trustedWorkerUrl()
  if (!endpoint) return { error: 'tutor not configured' }
  if (typeof question !== 'string' || !question.trim() || question.trim().length > MAX_QUESTION_LENGTH) {
    return { error: 'question must be 1–500 characters' }
  }
  if (lessonTitle !== undefined && (typeof lessonTitle !== 'string' || lessonTitle.length > 120)) {
    return { error: 'invalid lesson title' }
  }
  if (recentContext !== undefined && (typeof recentContext !== 'string' || recentContext.length > 300)) {
    return { error: 'invalid lesson context' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        site: 'athena',
        lessonTitle: (lessonTitle || '').trim(),
        question: question.trim(),
        recentContext: (recentContext || '').trim(),
      }),
    })
    const data = await readJsonResponse(res)
    if (!res.ok) return { error: userFacingError(res.status) }
    if (typeof data?.reply !== 'string' || !data.reply.trim() || data.reply.trim().length > MAX_REPLY_LENGTH) {
      return { error: 'The tutor returned an invalid reply.' }
    }
    return { reply: data.reply.trim() }
  } catch (error) {
    return { error: error?.name === 'AbortError' ? 'The tutor took too long. Try again.' : 'The live tutor is unavailable right now.' }
  } finally {
    clearTimeout(timeout)
  }
}
