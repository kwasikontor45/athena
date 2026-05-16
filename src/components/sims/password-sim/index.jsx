import { useState, useRef } from 'react'
import './password-sim.css'

const CHECKS = [
  { id: 'len',     label: 'At least 8 characters',       test: p => p.length >= 8        },
  { id: 'upper',   label: 'Contains uppercase letter',    test: p => /[A-Z]/.test(p)      },
  { id: 'number',  label: 'Contains a number',            test: p => /[0-9]/.test(p)      },
  { id: 'special', label: 'Contains a special character', test: p => /[^A-Za-z0-9]/.test(p) },
]

function strength(pwd) {
  if (!pwd) return { pct: 0, label: '', cls: '' }
  const score = CHECKS.filter(c => c.test(pwd)).length + (pwd.length >= 12 ? 1 : 0)
  if (score <= 1) return { pct: 20,  label: 'Weak',   cls: 'ps__bar--weak'   }
  if (score === 2) return { pct: 45,  label: 'Fair',   cls: 'ps__bar--fair'   }
  if (score === 3) return { pct: 70,  label: 'Good',   cls: 'ps__bar--good'   }
  return              { pct: 100, label: 'Strong', cls: 'ps__bar--strong' }
}

export default function PasswordSim({ onClose, onAthenaEvent }) {
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [screen,   setScreen]   = useState('form')
  const firedRef = useRef(new Set())

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    onAthenaEvent?.({ lesson: 'password-security', event })
  }

  const str = strength(password)
  const checks = CHECKS.map(c => ({ ...c, pass: c.test(password) }))

  function handlePasswordChange(e) {
    const val = e.target.value
    setPassword(val)
    fire('typed-password')
    if (strength(val).label === 'Strong') fire('reached-strong')
  }

  function handleSubmit() {
    if (!username.trim()) { setError('Please enter a username.'); return }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address.'); return }
    if (password.length < 6) { setError('Your password is too short.'); return }
    setError('')
    fire('created-account')
    setTimeout(() => fire('lesson-complete'), 600)
    setScreen('success')
  }

  if (screen === 'success') {
    return (
      <div className="ps">
        <div className="ps__titlebar">
          <div className="ps__dots">
            <button className="ps__dot ps__dot--red" onClick={onClose} aria-label="Close" />
            <span className="ps__dot ps__dot--yellow" />
            <span className="ps__dot ps__dot--green" />
          </div>
          <span className="ps__title">account security</span>
          <span />
        </div>
        <div className="ps__success">
          <span className="ps__success-icon">✓</span>
          <h2 className="ps__success-heading">Account created!</h2>
          <p className="ps__success-sub">Welcome, <strong>{username}</strong>. Your account is set up and secure.</p>
          <div className="ps__tips">
            <div className="ps__tips-label">Things to remember:</div>
            <div className="ps__tip">🔒 Never share your password with anyone — including school staff.</div>
            <div className="ps__tip">🔁 Use a different password for each account you create.</div>
            <div className="ps__tip">📵 Log out when using a shared or public computer.</div>
          </div>
          <button className="ps__back-btn" onClick={() => { setScreen('form'); setPassword(''); setUsername(''); setEmail('') }}>
            Try another password
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ps">
      <div className="ps__titlebar">
        <div className="ps__dots">
          <button className="ps__dot ps__dot--red" onClick={onClose} aria-label="Close" />
          <span className="ps__dot ps__dot--yellow" />
          <span className="ps__dot ps__dot--green" />
        </div>
        <span className="ps__title">account security</span>
        <span />
      </div>

      <div className="ps__body">
        <div className="ps__heading">Create your account</div>

        <div className="ps__form">
          <label className="ps__label">Username</label>
          <input
            className="ps__input"
            placeholder="e.g. alex_student"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />

          <label className="ps__label">Email</label>
          <input
            className="ps__input"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
          />

          <label className="ps__label">Password</label>
          <div className="ps__pwd-row">
            <input
              className="ps__input ps__input--pwd"
              placeholder="Create a strong password"
              value={password}
              onChange={handlePasswordChange}
              type={showPwd ? 'text' : 'password'}
            />
            <button className="ps__eye" onClick={() => setShowPwd(s => !s)} tabIndex={-1}>
              {showPwd ? '🙈' : '👁'}
            </button>
          </div>

          {password && (
            <div className="ps__strength">
              <div className="ps__bar-track">
                <div className={`ps__bar-fill ${str.cls}`} style={{ width: `${str.pct}%` }} />
              </div>
              <span className={`ps__strength-label ${str.cls}`}>{str.label}</span>
            </div>
          )}

          <div className="ps__checks">
            {checks.map(c => (
              <div key={c.id} className={`ps__check${c.pass ? ' ps__check--pass' : ''}`}>
                <span className="ps__check-icon">{c.pass ? '✓' : '○'}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>

          {error && <div className="ps__error">{error}</div>}

          <button className="ps__submit" onClick={handleSubmit}>
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
