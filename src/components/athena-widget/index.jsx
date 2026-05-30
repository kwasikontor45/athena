import { useState, useEffect, useRef, useCallback } from 'react'
import useAthena from '../../utils/use-athena'
import './athena-widget.css'

const MAX_MESSAGES   = 20
const FAIL_THRESHOLD = 3

const DASHBOARD_HASH = '0b7e80cfaccb6214ca7089cd1f4f38f32c2d26c7e0a5038307d14eb055f8a06c'

async function matchesPhrase(input) {
  const encoded = new TextEncoder().encode(input.trim())
  const buf = await crypto.subtle.digest('SHA-256', encoded)
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === DASHBOARD_HASH
}

const WELCOME = {
  id: crypto.randomUUID(),
  type: 'athena',
  text: "I'm Athena — I'm with you every step of the way. Click any lesson to get started, or ask me anything.",
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
  'lesson-complete':      'lesson complete',
  'first-click':          'first click',
  'opened-folder':        'folder opened',
  'created-folder':       'folder created',
  'renamed-file':         'item renamed',
  'moved-file':           'item moved',
  'deleted-file':         'item trashed',
  'typed-url':            'url typed',
  'opened-tab':           'new tab opened',
  'used-back-button':     'back button used',
  'sent-email':           'email sent',
  'submitted-assignment': 'assignment submitted',
  'step-advanced':        'step complete',
  'step-failed':          'step failed',
  'python-run':           'python executed',
  'bootcamp-opened':      'code bootcamp opened',
  'git-opened':           'git terminal opened',
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

// orbState: 'idle' | 'thinking' | 'success' | 'struggling'
export default function AthenaWidget({ currentEvent, currentLesson, onEventHandled, currentApp, onOrbStateChange }) {
  const [messages,   setMessages]   = useState([WELCOME])
  const [input,      setInput]      = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const [orbState,   setOrbState]   = useState('idle')
  const [failCount,  setFailCount]  = useState(0)
  const [orbPos,     setOrbPos]     = useState(null)
  const [unread,     setUnread]     = useState(0)
  const [collapsed,  setCollapsed]  = useState(() => {
    try { return localStorage.getItem('athena_panel_collapsed') === 'true' } catch { return false }
  }) // null = CSS default bottom-right
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const prevApp    = useRef(currentApp)
  const orbTimer   = useRef(null)
  const { ask }    = useAthena()

  const handleOrbDrag = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    const el   = e.currentTarget
    const rect = el.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    const sl = rect.left,  st = rect.top
    function onMove(e) {
      setOrbPos({
        left:   Math.max(8, sl + (e.clientX - sx)),
        top:    Math.max(8, st + (e.clientY - sy)),
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Orb follows typing state
  useEffect(() => {
    if (isTyping) { setOrbState('thinking'); onOrbStateChange?.('thinking') }
  }, [isTyping])

  // Reset on sim change
  useEffect(() => {
    if (currentApp !== prevApp.current) {
      prevApp.current = currentApp
      setFailCount(0)
      setMessages([{ ...WELCOME, id: crypto.randomUUID(), timestamp: Date.now() }])
    }
  }, [currentApp])

  function pulseOrb(state, duration = 2200) {
    if (orbTimer.current) clearTimeout(orbTimer.current)
    setOrbState(state)
    onOrbStateChange?.(state)
    orbTimer.current = setTimeout(() => { setOrbState('idle'); onOrbStateChange?.('idle') }, duration)
  }

  // Handle incoming events
  useEffect(() => {
    if (!currentEvent) return
    const { lesson, event, context = '' } = currentEvent
    const isFail    = event === 'step-failed'
    const isSuccess = event === 'step-advanced' || event === 'lesson-complete'

    setFailCount(prev => {
      const next = isFail ? prev + 1 : isSuccess ? 0 : prev
      if (next >= FAIL_THRESHOLD) { pulseOrb('struggling', 3000); return 0 }
      return next
    })

    if (isSuccess) pulseOrb('success', 2000)

    setMessages(prev => addMsg(prev, {
      id: crypto.randomUUID(), type: 'system',
      text: systemLabel(lesson, event), timestamp: Date.now(),
    }))

    setIsTyping(true)
    ask({ lesson, event, context }).then(text => {
      setIsTyping(false)
      setOrbState('idle')
      setMessages(prev => addMsg(prev, {
        id: crypto.randomUUID(), type: 'athena', text, timestamp: Date.now(),
      }))
      setUnread(u => u + 1)
    })

    onEventHandled?.()
  }, [currentEvent])

  async function handleSend() {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')

    if (await matchesPhrase(text)) {
      setMessages(prev => addMsg(prev, { id: crypto.randomUUID(), type: 'user', text: '••••••••', timestamp: Date.now() }))
      setMessages(prev => addMsg(prev, {
        id: crypto.randomUUID(), type: 'athena',
        text: `🔒 dashboard → athena.kontor.studio/dashboard\n🗝 secret → k0nt0r-d4sh-34a81412b13c`,
        timestamp: Date.now(),
      }))
      return
    }

    setMessages(prev => addMsg(prev, { id: crypto.randomUUID(), type: 'user', text, timestamp: Date.now() }))
    setIsTyping(true)
    const response = await ask({ lesson: currentLesson ?? 'desktop-navigation', event: 'direct-question', context: text })
    setIsTyping(false)
    setOrbState('idle')
    setMessages(prev => addMsg(prev, { id: crypto.randomUUID(), type: 'athena', text: response, timestamp: Date.now() }))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleClear() {
    setMessages([{ ...WELCOME, id: crypto.randomUUID(), timestamp: Date.now() }])
  }

  function focusInput() {
    setUnread(0)
    inputRef.current?.focus()
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('athena_panel_collapsed', String(next)) } catch {}
  }

  return (
    <>
      {/* ── Permanent left panel ── */}
      <div className={`aw__panel${collapsed ? ' aw__panel--collapsed' : ''}`}>
        <div className="aw__header">
          {!collapsed && (
            <div className="aw__header-brand">
              <span className="aw__header-name">Athena</span>
              <span className={`aw__header-dot aw__header-dot--${orbState}`} />
            </div>
          )}
          {collapsed && <span className={`aw__header-dot aw__header-dot--${orbState}`} style={{ margin: '0 auto' }} />}
          <button className="aw__action-btn aw__collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'expand Athena' : 'collapse panel'}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed && <div className="aw__messages">
          {messages.map(msg => (
            <div key={msg.id} className={`aw__bubble aw__bubble--${msg.type}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="aw__bubble aw__bubble--athena">
              <span className="aw__typing"><span /><span /><span /></span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>}

        {!collapsed && <div className="aw__input-row">
          <input
            ref={inputRef}
            className="aw__input"
            placeholder="ask Athena anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />
          <button className="aw__send" onClick={handleSend} disabled={isTyping || !input.trim()} aria-label="send">→</button>
        </div>}
      </div>

      {/* ── Floating orb — visible when collapsed, unread, or active ── */}
      {(collapsed || unread > 0 || orbState !== 'idle') && (
        <div
          className={`aw__orb aw__orb--${orbState}`}
          style={orbPos ? { left: orbPos.left, top: orbPos.top, bottom: 'auto', right: 'auto' } : {}}
          onClick={focusInput}
          onMouseDown={handleOrbDrag}
          title="Athena"
          aria-label="Athena"
        >
          <div className="aw__orb-sphere">
            <span className="aw__orb-owl">🦉</span>
          </div>
          {unread > 0 && (
            <span className="aw__orb-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </div>
      )}
    </>
  )
}
