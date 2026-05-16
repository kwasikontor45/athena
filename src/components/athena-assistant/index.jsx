import { useState, useEffect, useRef } from 'react'
import useAthena from '../../utils/use-athena'
import './athena-assistant.css'

const WELCOME = {
  id: crypto.randomUUID(),
  type: 'athena',
  text: "Perfect — you're here! I'm Athena, and I'll be with you every step of the way. Click anything to get started.",
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
  'opened-folder':       'folder opened',
  'created-folder':      'folder created',
  'renamed-file':        'item renamed',
  'moved-file':          'item moved',
  'deleted-file':        'item trashed',
  'lesson-complete':     'lesson complete',
  'first-click':         'first click',
  'double-click':        'double click',
  'right-click':         'right click',
  'drag-complete':       'drag complete',
  'first-keypress':      'first keypress',
  'typed-word':          'word typed',
  'used-backspace':      'backspace used',
  'used-enter':          'enter pressed',
  'opened-app':          'app opened',
  'closed-window':       'window closed',
  'minimized-window':    'window minimized',
  'found-taskbar':       'taskbar found',
  'typed-url':           'url typed',
  'opened-tab':          'new tab opened',
  'used-back-button':    'back button used',
  'found-search-bar':    'search bar found',
  'started-typing':      'started typing',
  'used-bold':           'bold used',
  'saved-doc':           'document saved',
  'named-doc':           'document named',
  'opened-compose':      'compose opened',
  'wrote-subject':       'subject written',
  'wrote-body':          'message written',
  'sent-email':          'email sent',
  'replied':             'reply sent',
  'logged-in':           'logged in',
  'found-assignment':    'assignment found',
  'uploaded-file':       'file uploaded',
  'submitted-assignment':'assignment submitted',
}

function systemLabel(lesson, event) {
  const l = LESSON_LABELS[lesson] ?? lesson
  const e = EVENT_LABELS[event] ?? event
  return `${l} — ${e}`
}

function addMsg(prev, msg) {
  const next = [...prev, msg]
  return next.length > 50 ? next.slice(next.length - 50) : next
}

export default function AthenaAssistant({ currentEvent, currentLesson, onEventHandled, badges = [] }) {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const { ask, isOnline } = useAthena()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (!currentEvent) return

    const { lesson, event, context = '' } = currentEvent

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
    })

    onEventHandled?.()
  }, [currentEvent])

  async function handleSend() {
    const text = input.trim()
    if (!text || isTyping) return

    setInput('')
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

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="aa">
      <div className="aa__header">
        <div className="aa__brand">
          <span className={`aa__owl${isTyping ? ' aa__owl--talking' : ''}`}>🦉</span>
          <span className="aa__name">ATHENA</span>
        </div>
        <div className="aa__status">
          <span className={`aa__status-dot${isOnline ? '' : ' aa__status-dot--offline'}`} />
          <span className="aa__status-label">{isOnline ? 'online' : 'offline'}</span>
        </div>
      </div>

      <div className="aa__messages">
        {messages.map(msg => (
          <div key={msg.id} className={`aa__bubble aa__bubble--${msg.type}`}>
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="aa__bubble aa__bubble--athena">
            <span className="aa__typing">
              <span /><span /><span />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {badges.length > 0 && (
        <div className="aa__badges">
          {badges.map(badge => (
            <span key={badge} className="aa__badge">{badge}</span>
          ))}
        </div>
      )}

      <div className="aa__input-row">
        <input
          ref={inputRef}
          className="aa__input"
          placeholder="ask athena anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isTyping}
        />
        <button
          className="aa__send"
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          aria-label="Send"
        >
          →
        </button>
      </div>
    </div>
  )
}
