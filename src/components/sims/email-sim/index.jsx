import { useState } from 'react'
import './email-sim.css'

const INBOX = [
  {
    id: 'e1',
    from: 'Professor Mensah',
    subject: 'Welcome to BUS 101',
    body: 'Welcome! Please reply to confirm you received this.',
    read: false,
  },
  {
    id: 'e2',
    from: 'Financial Aid Office',
    subject: 'Your award letter is ready',
    body: 'Log in to the student portal to view your award letter.',
    read: false,
  },
  {
    id: 'e3',
    from: 'Library Services',
    subject: 'Your library card is active',
    body: 'Your card number is 00847. You can now borrow up to 5 books.',
    read: false,
  },
]

export default function EmailSim({ onClose, onAthenaEvent }) {
  const [emails, setEmails]     = useState(INBOX)
  const [selected, setSelected] = useState(null)
  const [view, setView]         = useState('inbox') // 'inbox' | 'compose' | 'reply'
  const [sent, setSent]         = useState([])
  const [compose, setCompose]   = useState({ to: '', subject: '', body: '' })
  const [sendFlash, setSendFlash] = useState(false)
  const [fired, setFired]       = useState(new Set())

  function fire(event) {
    onAthenaEvent?.({ lesson: 'email', event })
    setFired(prev => {
      const next = new Set(prev)
      next.add(event)
      if (['sent-email', 'replied'].every(e => next.has(e)) && !prev.has('lesson-complete')) {
        next.add('lesson-complete')
        setTimeout(() => onAthenaEvent?.({ lesson: 'email', event: 'lesson-complete' }), 600)
      }
      return next
    })
  }

  function openEmail(email) {
    setSelected(email)
    setView('inbox')
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e))
  }

  function startCompose() {
    setCompose({ to: '', subject: '', body: '' })
    setView('compose')
    fire('opened-compose')
  }

  function startReply() {
    if (!selected) return
    setCompose({ to: selected.from, subject: `Re: ${selected.subject}`, body: '' })
    setView('reply')
    fire('opened-compose')
  }

  function handleSend(isReply) {
    if (!compose.to.trim() || !compose.subject.trim()) return
    setSent(prev => [...prev, { ...compose, id: `s${Date.now()}` }])
    setSendFlash(true)
    setTimeout(() => { setSendFlash(false); setView('inbox') }, 1200)
    fire(isReply ? 'replied' : 'sent-email')
  }

  const currentEmail = emails.find(e => e.id === selected?.id) ?? selected

  return (
    <div className="es">
      <div className="es__titlebar">
        <div className="es__dots">
          <button className="es__dot es__dot--red" onClick={onClose} aria-label="Close" />
          <span className="es__dot es__dot--yellow" />
          <span className="es__dot es__dot--green" />
        </div>
        <span className="es__title">mail</span>
        <span />
      </div>

      <div className="es__body">
        {/* Sidebar */}
        <nav className="es__sidebar">
          <button className="es__toolbar-btn es__toolbar-btn--primary" onClick={startCompose}>
            + new email
          </button>
          <div className="es__folder-list">
            <button className={`es__folder${view !== 'compose' && view !== 'reply' ? ' es__folder--active' : ''}`}
              onClick={() => setView('inbox')}>
              📥 Inbox <span className="es__unread-count">{emails.filter(e => !e.read).length || ''}</span>
            </button>
            <button className="es__folder" onClick={() => setView('inbox')}>
              📤 Sent <span className="es__unread-count">{sent.length || ''}</span>
            </button>
          </div>
          <div className="es__inbox-list">
            {emails.map(email => (
              <button
                key={email.id}
                className={`es__inbox-item${selected?.id === email.id ? ' es__inbox-item--active' : ''}`}
                onClick={() => openEmail(email)}
              >
                {!email.read && <span className="es__unread-dot" />}
                <span className="es__inbox-from">{email.from}</span>
                <span className="es__inbox-subject">{email.subject}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main pane */}
        <div className="es__main">
          {(view === 'compose' || view === 'reply') ? (
            <div className="es__compose">
              <div className="es__compose-header">
                <span className="es__compose-title">{view === 'reply' ? 'Reply' : 'New Email'}</span>
              </div>
              <div className="es__field">
                <label className="es__label">To</label>
                <input className="es__input" value={compose.to}
                  onChange={e => setCompose(p => ({ ...p, to: e.target.value }))} />
              </div>
              <div className="es__field">
                <label className="es__label">Subject</label>
                <input className="es__input" value={compose.subject}
                  onChange={e => setCompose(p => ({ ...p, subject: e.target.value }))}
                  onBlur={() => compose.subject.trim() && fire('wrote-subject')} />
              </div>
              <div className="es__field es__field--grow">
                <label className="es__label">Message</label>
                <textarea className="es__textarea" value={compose.body}
                  onChange={e => setCompose(p => ({ ...p, body: e.target.value }))}
                  onBlur={() => compose.body.length > 10 && fire('wrote-body')} />
              </div>
              <div className="es__compose-actions">
                <button className="es__toolbar-btn" onClick={() => setView('inbox')}>Cancel</button>
                {sendFlash
                  ? <span className="es__send-flash">✓ sent</span>
                  : <button className="es__toolbar-btn es__toolbar-btn--primary"
                      disabled={!compose.to.trim() || !compose.subject.trim()}
                      onClick={() => handleSend(view === 'reply')}>
                      Send →
                    </button>
                }
              </div>
            </div>
          ) : currentEmail ? (
            <div className="es__reading">
              <div className="es__reading-header">
                <p className="es__reading-subject">{currentEmail.subject}</p>
                <p className="es__reading-meta">From: {currentEmail.from}</p>
              </div>
              <div className="es__reading-body">{currentEmail.body}</div>
              <button className="es__toolbar-btn es__toolbar-btn--primary es__reply-btn"
                onClick={startReply}>
                ↩ Reply
              </button>
            </div>
          ) : (
            <div className="es__empty">Select an email to read it.</div>
          )}
        </div>
      </div>
    </div>
  )
}
