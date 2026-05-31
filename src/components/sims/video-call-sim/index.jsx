import { useState, useEffect, useRef } from 'react'
import './video-call-sim.css'

const PEERS = [
  { id: 'host', name: 'Prof. Mensah', emoji: '🎓', role: 'host', muted: false },
  { id: 'p1',  name: 'Jordan K.',   emoji: '😊', role: 'peer', muted: true  },
  { id: 'p2',  name: 'Maya T.',     emoji: '🌟', role: 'peer', muted: true  },
]

export default function VideoCallSim({ onClose, onAthenaEvent }) {
  const [muted,     setMuted]     = useState(false)
  const [cameraOn,  setCameraOn]  = useState(true)
  const [hand,      setHand]      = useState(false)
  const [sharing,   setSharing]   = useState(false)
  const [chatOpen,  setChatOpen]  = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages,  setMessages]  = useState([])
  const [elapsed,   setElapsed]   = useState(0)
  const firedRef   = useRef(new Set())
  const [firedSet, setFiredSet] = useState(new Set())
  const chatEndRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setElapsed(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fire('joined-call')
    const t = setTimeout(() =>
      addMsg('Prof. Mensah', 'Welcome to BUS 101! Please mute yourself when not speaking 🔇'), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function addMsg(from, text) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), from, text }])
  }

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    setFiredSet(prev => { const n = new Set(prev); n.add(event); return n })
    onAthenaEvent?.({ lesson: 'video-call', event })
    const skills = ['muted-self', 'camera-off', 'raised-hand', 'sent-message']
    if (skills.filter(s => firedRef.current.has(s)).length >= 3 && !firedRef.current.has('lesson-complete')) {
      firedRef.current.add('lesson-complete')
      setTimeout(() => onAthenaEvent?.({ lesson: 'video-call', event: 'lesson-complete' }), 600)
    }
  }

  function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const tiles = [...PEERS, { id: 'you', name: 'You', emoji: '🙂', role: 'self', muted }]

  return (
    <div className="vc">
      <div className="vc__titlebar">
        <div className="vc__dots">
          <button className="vc__dot vc__dot--red" onClick={onClose} aria-label="Close" />
          <span className="vc__dot vc__dot--yellow" />
          <span className="vc__dot vc__dot--green" />
        </div>
        <span className="vc__meeting">BUS 101 — Weekly Check-in</span>
        <span className="vc__timer">🔴 {fmt(elapsed)}</span>
      </div>

      <div className="vc__main">
        <div className="vc__grid">
          {tiles.map(p => (
            <div key={p.id} className={`vc__tile${p.role === 'host' ? ' vc__tile--host' : ''}${p.role === 'self' ? ' vc__tile--self' : ''}`}>
              {p.role === 'self' && !cameraOn
                ? <div className="vc__cam-off">📷</div>
                : <div className="vc__avatar">{p.emoji}</div>
              }
              <div className="vc__tile-footer">
                <span className="vc__tile-name">{p.name}</span>
                {p.role === 'host' && <span className="vc__host-badge">Host</span>}
                {p.role === 'self' && hand && <span className="vc__hand-badge">✋</span>}
              </div>
              {(p.muted || (p.role === 'self' && muted)) && <span className="vc__mic-off">🔇</span>}
              {p.role === 'self' && sharing && <span className="vc__share-badge">Sharing screen</span>}
            </div>
          ))}
        </div>

        {chatOpen && (
          <div className="vc__chat">
            <div className="vc__chat-head">
              <span>Chat</span>
              <button className="vc__chat-x" onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="vc__chat-msgs">
              {messages.map(m => (
                <div key={m.id} className={`vc__msg${m.from === 'You' ? ' vc__msg--you' : ''}`}>
                  <span className="vc__msg-from">{m.from}</span>
                  <span className="vc__msg-body">{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="vc__chat-row">
              <input
                className="vc__chat-input"
                placeholder="Message everyone..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMsg() }}
              />
              <button className="vc__chat-send" onClick={sendMsg}>Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Task strip */}
      {!firedSet.has('lesson-complete') && (
        <div className="vc__tasks">
          {[
            { key: 'joined-call', label: 'join the call',     hint: 'done automatically' },
            { key: 'muted-self',  label: 'mute yourself',     hint: 'click the 🔇 button' },
            { key: 'raised-hand', label: 'raise your hand',   hint: 'click the ✋ button' },
          ].map(({ key, label, hint }) => {
            const done = firedSet.has(key)
            return (
              <div key={key} className={`vc__task${done ? ' vc__task--done' : ''}`}>
                <span className="vc__task-check">{done ? '✓' : '○'}</span>
                <span className="vc__task-label">{label}</span>
                {!done && <span className="vc__task-hint">{hint}</span>}
              </div>
            )
          })}
        </div>
      )}

      <div className="vc__controls">
        <button className={`vc__ctrl${muted ? ' vc__ctrl--warn' : ''}`} onClick={() => { setMuted(m => !m); if (!muted) fire('muted-self') }}>
          <span className="vc__ctrl-icon">{muted ? '🔇' : '🎤'}</span>
          <span className="vc__ctrl-lbl">{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className={`vc__ctrl${!cameraOn ? ' vc__ctrl--warn' : ''}`} onClick={() => { setCameraOn(c => !c); if (cameraOn) fire('camera-off') }}>
          <span className="vc__ctrl-icon">📷</span>
          <span className="vc__ctrl-lbl">{cameraOn ? 'Stop Video' : 'Start Video'}</span>
        </button>
        <button className={`vc__ctrl${sharing ? ' vc__ctrl--on' : ''}`} onClick={() => { setSharing(s => !s); if (!sharing) fire('shared-screen') }}>
          <span className="vc__ctrl-icon">🖥</span>
          <span className="vc__ctrl-lbl">{sharing ? 'Stop Share' : 'Share Screen'}</span>
        </button>
        <button className={`vc__ctrl${hand ? ' vc__ctrl--on' : ''}`} onClick={toggleHand}>
          <span className="vc__ctrl-icon">✋</span>
          <span className="vc__ctrl-lbl">{hand ? 'Lower Hand' : 'Raise Hand'}</span>
        </button>
        <button className={`vc__ctrl${chatOpen ? ' vc__ctrl--on' : ''}`} onClick={openChat}>
          <span className="vc__ctrl-icon">💬</span>
          <span className="vc__ctrl-lbl">Chat</span>
        </button>
        <button className="vc__ctrl vc__ctrl--leave" onClick={onClose}>
          <span className="vc__ctrl-lbl">Leave</span>
        </button>
      </div>
    </div>
  )

  function toggleHand() {
    const next = !hand
    setHand(next)
    if (next) {
      fire('raised-hand')
      setTimeout(() => addMsg('Prof. Mensah', "I see your hand raised — we'll get to you shortly!"), 1500)
    }
  }

  function openChat() {
    if (!chatOpen) fire('opened-chat')
    setChatOpen(o => !o)
  }

  function sendMsg() {
    const text = chatInput.trim()
    if (!text) return
    addMsg('You', text)
    setChatInput('')
    fire('sent-message')
    setTimeout(() => addMsg('Prof. Mensah', 'Thanks for sharing that — great point!'), 1500)
  }
}
