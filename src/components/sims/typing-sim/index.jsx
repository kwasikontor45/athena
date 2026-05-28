import { useState, useRef, useEffect } from 'react'
import { playClick } from '../../../utils/sound'
import './typing-sim.css'

const SENTENCES = [
  "My name is Alex.",
  "I am a student.",
  "The file is saved.",
  "Please open the folder.",
  "I sent you an email.",
  "The class starts at nine.",
  "Please find the attached file.",
  "I completed the assignment today.",
  "Thank you for your quick response.",
  "The meeting is on Monday at 9 AM.",
  "I have attached the document below.",
  "Please review and let me know your thoughts.",
  "I am enrolled in BUS 101 this semester.",
  "My assignment has been submitted on time.",
  "Thank you for your email. I will respond shortly.",
]

// ── Keyboard data ────────────────────────────────────────────────────────────

const CHAR_TO_KEY = {}
for (const c of 'abcdefghijklmnopqrstuvwxyz') {
  CHAR_TO_KEY[c] = c
  CHAR_TO_KEY[c.toUpperCase()] = c
}
Object.assign(CHAR_TO_KEY, {
  ' ': 'space',
  '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
  '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
})
for (const c of "`1234567890-=[]\\;',./ ") {
  if (!CHAR_TO_KEY[c]) CHAR_TO_KEY[c] = c === ' ' ? 'space' : c
}

const NEEDS_SHIFT = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+{}|:"<>?')

// [label, id, zone, widthPx?]  — zone: lp/lr/lm/li/ri/rm/rr/rp/th
const KB_ROWS = [
  [
    ['`','`','lp'],['1','1','lp'],['2','2','lr'],['3','3','lm'],
    ['4','4','li'],['5','5','li'],['6','6','ri'],['7','7','ri'],
    ['8','8','rm'],['9','9','rr'],['0','0','rp'],['-','-','rp'],
    ['=','=','rp'],['⌫','bksp','rp',72],
  ],
  [
    ['Tab','tab','lp',52],['q','q','lp'],['w','w','lr'],['e','e','lm'],
    ['r','r','li'],['t','t','li'],['y','y','ri'],['u','u','ri'],
    ['i','i','rm'],['o','o','rr'],['p','p','rp'],['[','[','rp'],
    [']',']','rp'],['\\','\\','rp'],
  ],
  [
    ['Caps','caps','lp',62],['a','a','lp'],['s','s','lr'],['d','d','lm'],
    ['f','f','li'],['g','g','li'],['h','h','ri'],['j','j','ri'],
    ['k','k','rm'],['l','l','rr'],[';',';','rp'],["'","'","rp"],
    ['↵','enter','rp',78],
  ],
  [
    ['⇧','shiftl','lp',80],['z','z','lp'],['x','x','lr'],['c','c','lm'],
    ['v','v','li'],['b','b','li'],['n','n','ri'],['m','m','ri'],
    [',',',','rm'],['.','.','rr'],['/','/','rp'],
    ['⇧','shiftr','rp',96],
  ],
  [
    ['space','space','th',224],
  ],
]

function Keyboard({ nextChar }) {
  const targetKey = nextChar != null ? (CHAR_TO_KEY[nextChar] ?? null) : null
  const shiftNeeded = nextChar != null && NEEDS_SHIFT.has(nextChar)

  return (
    <div className="ts__keyboard">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="ts__kb-row">
          {row.map(([label, id, zone, w]) => {
            const isTarget = targetKey === id
            const isShift = shiftNeeded && (id === 'shiftl' || id === 'shiftr')
            const cls = `ts__key ts__key--${zone}${isTarget ? ' ts__key--active' : isShift ? ' ts__key--shift' : ''}`
            return (
              <span
                key={id}
                className={cls}
                style={w != null ? { width: `${w}px`, flexShrink: 0 } : undefined}
              >
                {label}
              </span>
            )
          })}
        </div>
      ))}
      {shiftNeeded && <div className="ts__kb-hint">Shift + key</div>}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

const PB_KEY = 'athena_typing_best'

export default function TypingSim({ onClose, onAthenaEvent }) {
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [typed, setTyped]             = useState('')
  const [wpmHistory, setWpmHistory]   = useState([])
  const [totalCorrect, setTotalCorrect]       = useState(0)
  const [totalKeypresses, setTotalKeypresses] = useState(0)
  const [completedCount, setCompletedCount]   = useState(0)
  const [allDone, setAllDone]   = useState(false)
  const [flash, setFlash]       = useState(false)
  const [personalBest, setPersonalBest] = useState(() => parseInt(localStorage.getItem(PB_KEY) || '0', 10))
  const [isNewBest, setIsNewBest]       = useState(false)
  const prevBestRef = useRef(0)

  const inputRef       = useRef(null)
  const firedRef       = useRef(new Set())
  const startTimeRef   = useRef(null)
  const mistakesRef    = useRef(false)
  const streakRef      = useRef(0)
  const sentIdxRef     = useRef(0)
  const completedRef   = useRef(0)
  const wpmHistRef     = useRef([])

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!allDone || avgWpm === 0) return
    const prev = parseInt(localStorage.getItem(PB_KEY) || '0', 10)
    prevBestRef.current = prev
    if (avgWpm > prev) {
      localStorage.setItem(PB_KEY, String(avgWpm))
      setPersonalBest(avgWpm)
      setIsNewBest(true)
    } else {
      setPersonalBest(prev)
      setIsNewBest(false)
    }
  }, [allDone])

  const sentence = SENTENCES[sentenceIdx]
  const avgWpm   = wpmHistRef.current.length > 0
    ? Math.round(wpmHistRef.current.reduce((a, b) => a + b, 0) / wpmHistRef.current.length)
    : 0
  const accuracy = totalKeypresses > 0
    ? Math.round((totalCorrect / totalKeypresses) * 100)
    : 100

  function fire(event) {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    onAthenaEvent?.({ lesson: 'keyboard-basics', event })
  }

  function handleInput(e) {
    const val  = e.target.value
    const sent = SENTENCES[sentIdxRef.current]
    if (val.length > sent.length) return

    if (val.length > 0 && !startTimeRef.current) {
      startTimeRef.current = Date.now()
    }

    const added = val.length > typed.length
    if (added) {
      playClick()
      const i       = val.length - 1
      const correct = val[i] === sent[i]
      setTotalKeypresses(k => k + 1)
      if (correct) {
        setTotalCorrect(c => c + 1)
        streakRef.current++
      } else {
        mistakesRef.current = true
        streakRef.current = 0
      }
      if (val.length === 1)        fire('first-keypress')
      if (streakRef.current >= 5)  fire('typed-word')
    }

    setTyped(val)
    if (val === sent) completeSentence(val, sent)
  }

  function completeSentence(val, sent) {
    const elapsed = startTimeRef.current
      ? Math.max((Date.now() - startTimeRef.current) / 60000, 0.001)
      : 0.001
    const sentenceWpm = Math.round((sent.length / 5) / elapsed)

    const newWpmHist = [...wpmHistRef.current, sentenceWpm]
    wpmHistRef.current = newWpmHist
    setWpmHistory(newWpmHist)

    const newCompleted = completedRef.current + 1
    completedRef.current = newCompleted
    setCompletedCount(newCompleted)

    const newAvg = Math.round(newWpmHist.reduce((a, b) => a + b, 0) / newWpmHist.length)

    if (newCompleted === 1)   fire('first-sentence-complete')
    if (newCompleted === 3)   fire('used-enter')
    if (newAvg >= 10)         fire('reached-10-wpm')
    if (!mistakesRef.current) fire('clean-run')

    setFlash(true)
    setTimeout(() => {
      setFlash(false)
      if (newCompleted === 3) fire('lesson-complete')

      const nextIdx = sentIdxRef.current + 1
      if (nextIdx >= SENTENCES.length) {
        setAllDone(true)
      } else {
        sentIdxRef.current = nextIdx
        setSentenceIdx(nextIdx)
        setTyped('')
        startTimeRef.current = null
        mistakesRef.current  = false
        streakRef.current    = 0
        setTimeout(() => inputRef.current?.focus(), 30)
      }
    }, 600)
  }

  function reset() {
    sentIdxRef.current   = 0
    completedRef.current = 0
    wpmHistRef.current   = []
    setSentenceIdx(0)
    setTyped('')
    setWpmHistory([])
    setTotalCorrect(0)
    setTotalKeypresses(0)
    setCompletedCount(0)
    setAllDone(false)
    setFlash(false)
    setIsNewBest(false)
    startTimeRef.current = null
    mistakesRef.current  = false
    streakRef.current    = 0
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function renderChars() {
    return sentence.split('').map((ch, i) => {
      let cls = 'ts__char'
      if (i < typed.length) {
        cls += typed[i] === ch ? ' ts__char--correct' : ' ts__char--incorrect'
      } else if (i === typed.length) {
        cls += ' ts__char--current'
      } else {
        cls += ' ts__char--pending'
      }
      return <span key={i} className={cls}>{ch === ' ' ? ' ' : ch}</span>
    })
  }

  const nextChar = allDone ? null : sentence[typed.length]

  return (
    <div className="ts">
      <div className="ts__titlebar">
        <div className="ts__dots">
          <button className="ts__dot ts__dot--red" onClick={onClose} aria-label="Close" />
          <span className="ts__dot ts__dot--yellow" />
          <span className="ts__dot ts__dot--green" />
        </div>
        <span className="ts__title">typing practice</span>
        <span />
      </div>

      <div className="ts__stats">
        <div className="ts__stat">
          <span className="ts__stat-label">WPM</span>
          <span className="ts__stat-value">{avgWpm}</span>
        </div>
        <div className="ts__stat">
          <span className="ts__stat-label">Best</span>
          <span className="ts__stat-value ts__stat-value--best">{personalBest > 0 ? personalBest : '—'}</span>
        </div>
        <div className="ts__stat">
          <span className="ts__stat-label">Accuracy</span>
          <span className="ts__stat-value">{accuracy}%</span>
        </div>
        <div className="ts__stat">
          <span className="ts__stat-label">Sentences</span>
          <span className="ts__stat-value">{completedCount} of {SENTENCES.length}</span>
        </div>
      </div>

      {allDone ? (
        <div className="ts__done">
          {isNewBest ? (
            <span className="ts__done-icon ts__done-icon--best">🏆</span>
          ) : (
            <span className="ts__done-icon">✓</span>
          )}
          <p className="ts__done-heading">
            {isNewBest ? 'New personal best!' : 'All 15 sentences done!'}
          </p>
          <div className="ts__done-stats">
            <span>This run: <strong>{avgWpm} WPM</strong></span>
            {personalBest > 0 && !isNewBest && (
              <span className={`ts__done-delta${avgWpm >= personalBest ? ' ts__done-delta--up' : ' ts__done-delta--down'}`}>
                {avgWpm >= personalBest ? '+' : ''}{avgWpm - personalBest} vs your best ({personalBest} WPM)
              </span>
            )}
            {isNewBest && prevBestRef.current > 0 && (
              <span className="ts__done-delta ts__done-delta--up">↑ previous best: {prevBestRef.current} WPM</span>
            )}
            <span>Accuracy: <strong>{accuracy}%</strong></span>
          </div>
          <button className="ts__retry-btn" onClick={reset}>Try again</button>
        </div>
      ) : (
        <>
          <div className={`ts__sentence-area${flash ? ' ts__sentence-area--flash' : ''}`}>
            <div className="ts__chars">{renderChars()}</div>
          </div>

          <div className="ts__progress-dots">
            {SENTENCES.map((_, i) => {
              let cls = 'ts__pdot'
              if (i < completedCount)        cls += ' ts__pdot--done'
              else if (i === sentenceIdx)    cls += ' ts__pdot--current'
              else                           cls += ' ts__pdot--pending'
              return <span key={i} className={cls} />
            })}
          </div>

          <div className="ts__input-area">
            <input
              ref={inputRef}
              className="ts__input"
              value={typed}
              onChange={handleInput}
              onPaste={e => e.preventDefault()}
              placeholder="start typing..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <Keyboard nextChar={nextChar} />
        </>
      )}
    </div>
  )
}
