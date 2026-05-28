import { useState, useEffect, useRef } from 'react'
import useAthena from '../../utils/use-athena'
import './athena-widget.css'

const MAX_MESSAGES   = 20
const FAIL_THRESHOLD = 3

// Dashboard access — hash only, phrase lives nowhere in code
const DASHBOARD_HASH = '0b7e80cfaccb6214ca7089cd1f4f38f32c2d26c7e0a5038307d14eb055f8a06c'

async function matchesPhrase(input) {
  const encoded = new TextEncoder().encode(input.trim()) // exact match — case and punctuation matter
  const buf = await crypto.subtle.digest('SHA-256', encoded)
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === DASHBOARD_HASH
}

const WELCOME = {
  id: crypto.randomUUID(),
  type: 'athena',
  text: "I'm Athena — I'm with you every step of the way. Click anything to get started, or ask me anything.",
  timestamp: Date.now(),
}

const LESSON_LABELS = {
  'mouse-basics':       'mouse basics',
  'keyboard-basics':    'keyboard basics',
  'desktop-navigation': 'desktop navigation',
  'file-explorer':      'files & folders',
  'email':              'email',
  'browser':            'browser',
  'doc-editor':         'document editor',
  'school-portal':      'school portal',
}

const EVENT_LABELS = {
  'lesson-complete':     'lesson complete',
  'first-click':         'first click',
  'opened-folder':       'folder opened',
  'created-folder':      'folder created',
  'renamed-file':        'item renamed',
  'moved-file':          'item moved',
  'deleted-file':        'item trashed',
  'typed-url':           'url typed',
  'opened-tab':          'new tab opened',
  'used-back-button':    'back button used',
  'sent-email':          'email sent',
  'submitted-assignment':'assignment submitted',
  'step-advanced':       'step complete',
  'step-failed':         'step failed',
  'python-run':          'python executed',
  'bootcamp-opened':     'code bootcamp opened',
  'git-opened':          'git terminal opened',
}

function systemLabel(lesson, event) {
  const l = LESSON_LABELS[lesson] ?? lesson
  const e = EVENT_LABELS[event]  ?? event
  return `${l} — ${e}`
}

function addMsg(prev, msg) {
  const next = [...prev, msg]
  return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next
}

export default function AthenaWidget({
  currentEvent, currentLesson, onEventHandled, badges = [], currentApp
}) {
  const [open,      setOpen]      = useState(false)
  const [messages,  setMessages]  = useState([WELCOME])
  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)
  const [unread,    setUnread]    = useState(0)
  const [pulse,     setPulse]     = useState(false)
  const [failCount, setFailCount] = useState(0)
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const prevApp    = useRef(currentApp)
  const { ask }    = useAthena()

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  // Auto-clear + reset fail counter when sim changes
  useEffect(() => {
    if (currentApp !== prevApp.current) {
      prevApp.current = currentApp
      setFailCount(0)
      // Give fresh context — clear to just welcome
      setMessages([{
        ...WELCOME,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      }])
    }
  }, [currentApp])

  // Handle incoming events from sims + lessons
  useEffect(() => {
    if (!currentEvent) return

    const { lesson, event, context = '' } = currentEvent
    const isFail = event === 'step-failed'
    const isSuccess = event === 'step-advanced' || event === 'lesson-complete'

    // Track consecutive failures for proactive engagement
    setFailCount(prev => {
      const next = isFail ? prev + 1 : isSuccess ? 0 : prev
      if (next >= FAIL_THRESHOLD) {
        setOpen(true)   // surface Athena after too many failures
        return 0        // reset counter
      }
      return next
    })

    // Add system event label
    setMessages(prev => addMsg(prev, {
      id: crypto.randomUUID(),
      type: 'system',
      text: systemLabel(lesson, event),
      timestamp: Date.now(),
    }))

    setIsTyping(true)
    ask({ lesson, event, context }).then(text => {
      setIsTyping(false)
      setMessages(prev => addMsg(prev, {
        id: crypto.randomUUID(),
        type: 'athena',
        text,
        timestamp: Date.now(),
      }))

      // Pulse + increment unread if chat is closed
      if (!open) {
        setUnread(u => u + 1)
        setPulse(true)
        setTimeout(() => setPulse(false), 2000)
      }
    })

    onEventHandled?.()
  }, [currentEvent])

  async function handleSend() {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')

    // Secret phrase — masked in history, dashboard info whispered back
    if (await matchesPhrase(text)) {
      setMessages(prev => addMsg(prev, {
        id: crypto.randomUUID(), type: 'user',
        text: '••••••••', timestamp: Date.now(),
      }))
      setMessages(prev => addMsg(prev, {
        id: crypto.randomUUID(), type: 'athena',
        text: `🔒 dashboard → athena.kontor.studio/dashboard\n🗝 secret → k0nt0r-d4sh-34a81412b13c`,
        timestamp: Date.now(),
      }))
      return
    }

    setMessages(prev => addMsg(prev, {
      id: crypto.randomUUID(),
      type: 'user',
      text,
      timestamp: Date.now(),
    }))

    setIsTyping(true)
    const response = await ask({
      lesson: currentLesson ?? 'desktop-navigation',
      event: 'direct-question',
      context: text,
    })
    setIsTyping(false)
    setMessages(prev => addMsg(prev, {
      id: crypto.randomUUID(),
      type: 'athena',
      text: response,
      timestamp: Date.now(),
    }))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClear() {
    setMessages([{
      ...WELCOME,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }])
    setUnread(0)
  }

  function toggleOpen() {
    setOpen(o => {
      if (!o) setUnread(0)
      return !o
    })
  }

  return (
    <>
      {/* Chat panel — slides up from button */}
      {open && (
        <div className="aw__panel">
          <div className="aw__header">
            <div className="aw__header-brand">
              <span className="aw__header-owl">🦉</span>
              <span className="aw__header-name">Athena</span>
              <span className="aw__header-dot" />
            </div>
            <div className="aw__header-actions">
              <button className="aw__action-btn" onClick={handleClear} title="clear chat">🗑</button>
              <button className="aw__action-btn" onClick={() => setOpen(false)} title="close">✕</button>
            </div>
          </div>

          <div className="aw__messages">
            {messages.map(msg => (
              <div key={msg.id} className={`aw__bubble aw__bubble--${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div className="aw__bubble aw__bubble--athena">
                <span className="aw__typing">
                  <span /><span /><span />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="aw__input-row">
            <input
              ref={inputRef}
              className="aw__input"
              placeholder="ask Athena anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              className="aw__send"
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              aria-label="send"
            >→</button>
          </div>
        </div>
      )}

      {/* Floating owl button — always visible */}
      <button
        className={`aw__button${pulse ? ' aw__button--pulse' : ''}${open ? ' aw__button--open' : ''}`}
        onClick={toggleOpen}
        aria-label={open ? 'close Athena' : 'open Athena'}
        title={open ? 'close Athena' : 'ask Athena'}
      >
        <span className="aw__button-owl">🦉</span>
        {!open && unread > 0 && (
          <span className="aw__unread">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
    </>
  )
}
