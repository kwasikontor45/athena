import { useState, useRef } from 'react'
import './school-portal-sim.css'

const COURSES = [
  { code: 'BUS 101', name: 'Introduction to Business', prof: 'Prof. Mensah', active: true },
  { code: 'ENG 110', name: 'English Composition',      prof: 'Prof. Osei',   active: false },
  { code: 'MTH 100', name: 'College Mathematics',      prof: 'Prof. Clarke',  active: false },
  { code: 'COM 105', name: 'Business Communication',   prof: 'Prof. Addo',    active: false },
]

export default function SchoolPortalSim({ onClose, onAthenaEvent, simContext }) {
  const [screen, setScreen]         = useState('login')
  const [username, setUsername]     = useState(() => simContext?.credentialsRead ? 'student2026' : '')
  const [password, setPassword]     = useState('')
  const [loginError, setLoginError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [chosenFile, setChosenFile] = useState(null)
  const [fired, setFired]           = useState(new Set())
  const fileInputRef = useRef(null)

  function fire(event) {
    onAthenaEvent?.({ lesson: 'school-portal', event })
    setFired(prev => {
      const next = new Set(prev)
      next.add(event)
      if (event === 'submitted-assignment' && !prev.has('lesson-complete')) {
        next.add('lesson-complete')
        setTimeout(() => onAthenaEvent?.({ lesson: 'school-portal', event: 'lesson-complete' }), 800)
      }
      return next
    })
  }

  function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter your username and password.')
      return
    }
    if (username.trim() !== 'student2026' || password.trim() !== 'welcome1') {
      setLoginError('Incorrect username or password. Check your welcome email.')
      return
    }
    setDisplayName(username.trim())
    setLoginError('')
    setScreen('dashboard')
    fire('logged-in')
  }

  function handleLoginKey(e) {
    if (e.key === 'Enter') handleLogin()
  }

  function handleCourseClick(course) {
    if (!course.active) return
    setScreen('assignment')
    fire('found-assignment')
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (f) {
      setChosenFile(f)
      fire('uploaded-file')
    }
  }

  function handleSubmit() {
    if (!chosenFile) return
    setScreen('success')
    fire('submitted-assignment')
  }

  function renderScreen() {
    if (screen === 'login') {
      return (
        <div className="sp__login">
          <div className="sp__login-card">
            <div className="sp__login-logo">🎓 Kontor Community College</div>
            <div className="sp__login-sub">Student Portal</div>
            <div className="sp__login-fields">
              <div>
                <div className="sp__field-label">Username</div>
                <input
                  className="sp__login-input"
                  placeholder="student@kontor.edu"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={handleLoginKey}
                  autoFocus
                />
              </div>
              <div>
                <div className="sp__field-label">Password</div>
                <input
                  className="sp__login-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleLoginKey}
                />
              </div>
            </div>
            {simContext?.credentialsRead
              ? <div className="sp__login-hint sp__login-hint--found">✉️ From your welcome email — username: <strong>student2026</strong> · password: <strong>welcome1</strong></div>
              : <div className="sp__login-hint">💡 Check your welcome email for your login details</div>
            }
            <div className="sp__login-error">{loginError}</div>
            <button className="sp__login-btn" onClick={handleLogin}>Sign In</button>
          </div>
        </div>
      )
    }

    if (screen === 'grades') {
      const submitted = fired.has('submitted-assignment')
      return (
        <div className="sp__assignment">
          <button className="sp__back-btn" onClick={() => setScreen('dashboard')}>← Back to Dashboard</button>
          <div className="sp__assignment-card">
            <h2 className="sp__assignment-title">My Grades</h2>
            <table className="sp__grades-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Assignment</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className={submitted ? '' : 'sp__grade-pending'}>
                  <td>BUS 101</td>
                  <td>Week 1 Reflection</td>
                  <td className="sp__grade-score">{submitted ? '10 / 10' : '—'}</td>
                  <td className={`sp__grade-status${submitted ? '' : ' sp__grade-status--pending'}`}>
                    {submitted ? '✓ Graded' : 'Not submitted'}
                  </td>
                </tr>
                <tr className="sp__grade-pending">
                  <td>BUS 101</td>
                  <td>Week 2 Case Study</td>
                  <td className="sp__grade-score">—</td>
                  <td className="sp__grade-status sp__grade-status--pending">Not yet due</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (screen === 'dashboard') {
      return (
        <div className="sp__dashboard">
          <div className="sp__welcome">Welcome back, {displayName} 👋</div>
          <div>
            <div className="sp__section-title">My Courses</div>
            <div className="sp__courses">
              {COURSES.map(c => (
                <div
                  key={c.code}
                  className={`sp__course-card${c.active ? '' : ' sp__course-card--locked'}`}
                  onClick={() => handleCourseClick(c)}
                >
                  <div className="sp__course-code">{c.code}</div>
                  <div className="sp__course-name">{c.name}</div>
                  <div className="sp__course-prof">{c.prof}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="sp__section-title">Announcements</div>
            <div className="sp__announcements">
              <div className="sp__announcement">📌 Week 1 Reflection assignments are due this Friday by 11:59 PM.</div>
              <div className="sp__announcement">📌 Campus library hours extended through finals week.</div>
            </div>
          </div>
        </div>
      )
    }

    if (screen === 'assignment') {
      return (
        <div className="sp__assignment">
          <button className="sp__back-btn" onClick={() => setScreen('dashboard')}>← Back to Dashboard</button>
          <div className="sp__assignment-card">
            <h2 className="sp__assignment-title">Week 1 Reflection</h2>
            <div className="sp__assignment-meta">
              <span className="sp__meta-chip">Due: <strong>Friday 11:59 PM</strong></span>
              <span className="sp__meta-chip">Points: <strong>10</strong></span>
              <span className="sp__meta-chip">Course: <strong>BUS 101</strong></span>
            </div>
            <div className="sp__assignment-body">
              <p>Write a short reflection (1–2 paragraphs) on what you hope to learn in Introduction to Business this semester. Consider: What drew you to this program? What skills do you want to build?</p>
              <p>Save your reflection as a document file and upload it below. Professor Mensah will provide written feedback by Monday.</p>
            </div>
            <button className="sp__assignment-btn" onClick={() => setScreen('submit')}>
              Submit Assignment →
            </button>
          </div>
        </div>
      )
    }

    if (screen === 'submit') {
      return (
        <div className="sp__submit">
          <button className="sp__back-btn" onClick={() => setScreen('assignment')}>← Back to Assignment</button>
          <div className="sp__submit-card">
            <div className="sp__submit-title">Submit: Week 1 Reflection</div>
            <div
              className={`sp__upload-zone${chosenFile ? ' sp__upload-zone--has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="sp__upload-input"
                accept=".doc,.docx,.pdf,.txt"
                onChange={handleFileChange}
              />
              {chosenFile ? (
                <div className="sp__file-chosen">
                  <span>📄</span>
                  <span>{chosenFile.name}</span>
                </div>
              ) : (
                <>
                  <span className="sp__upload-icon">📂</span>
                  <span className="sp__upload-label">Click to choose a file</span>
                  <span className="sp__upload-hint">.doc, .docx, .pdf, or .txt</span>
                </>
              )}
            </div>
            <button
              className="sp__submit-btn"
              onClick={handleSubmit}
              disabled={!chosenFile}
            >
              Submit Assignment
            </button>
          </div>
        </div>
      )
    }

    if (screen === 'success') {
      return (
        <div className="sp__success">
          <div className="sp__success-icon">✅</div>
          <h2 className="sp__success-heading">Assignment Submitted!</h2>
          <p className="sp__success-sub">
            Your Week 1 Reflection has been received. Professor Mensah will review it and post feedback by Monday.
          </p>
          <div className="sp__success-detail">
            <strong>{chosenFile?.name}</strong><br />
            Submitted to BUS 101 · 10 points possible
          </div>
          <button className="sp__grades-link" onClick={() => setScreen('grades')}>
            View My Grades →
          </button>
        </div>
      )
    }
  }

  return (
    <div className="sp">
      <div className="sp__titlebar">
        <div className="sp__dots">
          <button className="sp__dot sp__dot--red" onClick={onClose} aria-label="Close" />
          <span className="sp__dot sp__dot--yellow" />
          <span className="sp__dot sp__dot--green" />
        </div>
        <span className="sp__title">Kontor Student Portal</span>
        <span />
      </div>

      {screen !== 'login' && (
        <div className="sp__topbar">
          <span className="sp__logo">🎓 Kontor CC</span>
          <button className="sp__topbar-link" onClick={() => setScreen('dashboard')}>Dashboard</button>
          <button className="sp__topbar-link" onClick={() => setScreen('grades')}>Grades</button>
          <span className="sp__topbar-user">{displayName}</span>
          <button className="sp__logout-btn" onClick={() => { setScreen('login'); setUsername(''); setPassword('') }}>
            Sign Out
          </button>
        </div>
      )}

      <div className="sp__body">
        {renderScreen()}
      </div>
    </div>
  )
}
