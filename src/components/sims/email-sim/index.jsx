import { useState } from 'react'
import './email-sim.css'

const INBOX = [
  {
    id: 'e0',
    from: 'Kontor College Admissions',
    subject: 'Welcome — Your Student Login Details',
    body: 'Welcome to Kontor Community College!\n\nHere are your student portal credentials:\n\n  Username:  student2026\n  Password:  welcome1\n\nLog in at kontor.edu to access your courses, check your grades, and submit assignments.\n\nYour first class — BUS 101 with Professor Mensah — starts this week. Course materials are available in the Library.\n\nSee you on campus!\n— Admissions Team, Kontor College',
    read: false,
  },
  {
    id: 'e1',
    from: 'Professor Mensah',
    subject: 'Welcome to BUS 101',
    body: 'Welcome to BUS 101 — Introduction to Business!\n\nPlease reply to confirm you received this email. The syllabus is available in the Kontor Library — search for BUS 101.\n\nSee you in class.\n— Prof. Mensah',
    read: false,
  },
  {
    id: 'e2',
    from: 'Financial Aid Office',
    subject: 'Your award letter is ready',
    body: 'Your financial aid award letter is ready to view.\n\nLog in to the student portal at kontor.edu using your student credentials and navigate to Financial Aid → Award Letter.\n\nDeadline to accept: end of the month.',
    read: false,
  },
  {
    id: 'e3',
    from: 'Library Services',
    subject: 'Your library card is active',
    body: 'Your Kontor Library card is now active.\n\nCard number: 00847\n\nYou can borrow up to 5 items at a time. Visit the Library tab in your browser to search the catalog and download course materials.\n\n— Kontor Community Library',
    read: false,
  },
]

export default function EmailSim({ onClose, onAthenaEvent, simContext, onSimContext }) {
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
    if (email.id === 'e0') onSimContext?.({ credentialsRead: true })
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
    fire('wrote-subject')
    fire(isReply ? 'replied' : 'sent-email')
    if (isReply && selected?.id === 'e1') onSimContext?.({ repliedToMensah: true })
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
