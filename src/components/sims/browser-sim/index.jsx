import { useState, useRef } from 'react'
import './browser-sim.css'

const MAX_TABS = 4

function normalizeUrl(raw) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '')
}

function pageForUrl(url) {
  const u = normalizeUrl(url)
  if (u.includes('google')) return 'google'
  if (u.includes('school') || u.includes('portal') || u.includes('kontor.edu')) return 'school'
  if (u.includes('library')) return 'library'
  if (u.includes('prizez') || u.includes('free-prize') || u.includes('claim-now') || u.includes('winner')) return 'sketchy'
  if (u === '') return 'blank'
  return 'notfound'
}

function GooglePage({ onSearch, onSearchFocus }) {
  const [q, setQ] = useState('')
  return (
    <div className="bsp bsp--google">
      <div className="bsp__google-logo">Google</div>
      <input className="bsp__google-search" placeholder="Search Google..."
        value={q} onChange={e => setQ(e.target.value)}
        onFocus={onSearchFocus}
        onKeyDown={e => e.key === 'Enter' && q && onSearch(q)} />
      <button className="bsp__google-btn" onClick={() => q && onSearch(q)}>Google Search</button>
    </div>
  )
}

function SearchResults({ query }) {
  return (
    <div className="bsp bsp--results">
      <p className="bsp__results-label">Results for "<strong>{query}</strong>"</p>
      {[`${query} — Wikipedia`, `${query} - Study Guide`, `What is ${query}? - Khan Academy`].map(r => (
        <div key={r} className="bsp__result">
          <span className="bsp__result-title">{r}</span>
          <span className="bsp__result-url">https://example.com/{query.replace(/\s/g, '-').toLowerCase()}</span>
        </div>
      ))}
    </div>
  )
}

function SchoolPage() {
  return (
    <div className="bsp bsp--school">
      <div className="bsp__school-logo">🎓 Kontor Community College</div>
      <nav className="bsp__school-nav">
        <span>Admissions</span><span>Courses</span><span>Student Life</span><span>Contact</span>
      </nav>
      <h2 className="bsp__school-headline">Empowering Students Since 1998</h2>
      <button className="bsp__school-btn">Student Login →</button>
    </div>
  )
}

function LibraryPage() {
  return (
    <div className="bsp bsp--library">
      <div className="bsp__library-logo">📚 Kontor Community Library</div>
      <input className="bsp__library-search" placeholder="Search the catalog..." />
      <div className="bsp__book-list">
        {['Introduction to Business (Textbook)', 'Microsoft Office Essentials', 'Study Skills for College Students'].map(b => (
          <div key={b} className="bsp__book">📖 {b}</div>
        ))}
      </div>
    </div>
  )
}

function NotFound({ url, onNavigate }) {
  return (
    <div className="bsp bsp--notfound">
      <p className="bsp__notfound-code">Page not found</p>
      <p className="bsp__notfound-msg">"{url}" didn't load. Try one of these:</p>
      <div className="bsp__notfound-links">
        <button className="bsp__notfound-link" onClick={() => onNavigate('google.com')}>google.com</button>
        <button className="bsp__notfound-link" onClick={() => onNavigate('school.edu')}>school.edu</button>
        <button className="bsp__notfound-link" onClick={() => onNavigate('library.edu')}>library.edu</button>
        <button className="bsp__notfound-link" onClick={() => onNavigate('free-prizez.net')}>free-prizez.net</button>
      </div>
    </div>
  )
}

function SketchyPage({ onSpotted }) {
  return (
    <div className="bsp bsp--sketchy">
      <div className="bsp__sketchy-banner">⚠️ CONGRATULATIONS WINNER ⚠️</div>
      <div className="bsp__sketchy-body">
        <p className="bsp__sketchy-claim">YOU HAVE BEEN SELECTED!!</p>
        <p className="bsp__sketchy-sub">Claim your FREE prize before it expires!!<br />This offer ends in <strong>00:04:59</strong> — ACT NOW!!!</p>
        <button className="bsp__sketchy-btn" onClick={onSpotted}>👉 CLICK HERE TO CLAIM YOUR PRIZE 👈</button>
        <p className="bsp__sketchy-fine">By clicking you agree to our terms. Prize shippping and handeling fee of $49.99 applys. Limited time offfer. Not responsible for unclaimed rewards.</p>
      </div>
    </div>
  )
}

function BlankPage() {
  return <div className="bsp bsp--blank"><span className="bsp__blank-hint">Type a web address above and press Enter</span></div>
}

export default function BrowserSim({ onClose, onAthenaEvent }) {
  const [tabs, setTabs] = useState([{ id: 1, url: 'google.com', page: 'google', searchQuery: null }])
  const [activeTab, setActiveTab] = useState(1)
  const [urlInput, setUrlInput] = useState('google.com')
  const [history, setHistory] = useState([])
  const [fired, setFired] = useState(new Set())
  const urlRef = useRef(null)

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0]

  function fire(event) {
    onAthenaEvent?.({ lesson: 'browser', event })
    setFired(prev => {
      const next = new Set(prev)
      next.add(event)
      const all = ['typed-url', 'opened-tab', 'used-back-button']
      if (all.every(e => next.has(e)) && !prev.has('lesson-complete')) {
        next.add('lesson-complete')
        setTimeout(() => onAthenaEvent?.({ lesson: 'browser', event: 'lesson-complete' }), 600)
      }
      return next
    })
  }

  function navigate(rawUrl) {
    const url = normalizeUrl(rawUrl)
    const page = pageForUrl(url)
    setHistory(h => [...h, currentTab.url])
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url, page, searchQuery: null } : t))
    setUrlInput(url)
    fire('typed-url')
  }

  function handleSearch(query) {
    setHistory(h => [...h, currentTab.url])
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, page: 'search', searchQuery: query } : t))
    setUrlInput(`google.com/search?q=${query}`)
  }

  function goBack() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    const page = pageForUrl(prev)
    setTabs(prevTabs => prevTabs.map(t => t.id === activeTab ? { ...t, url: prev, page, searchQuery: null } : t))
    setUrlInput(prev)
    fire('used-back-button')
  }

  function openTab() {
    if (tabs.length >= MAX_TABS) return
    const id = Date.now()
    setTabs(prev => [...prev, { id, url: '', page: 'blank', searchQuery: null }])
    setActiveTab(id)
    setUrlInput('')
    setHistory([])
    fire('opened-tab')
  }

  function closeTab(id) {
    if (tabs.length === 1) return
    const remaining = tabs.filter(t => t.id !== id)
    setTabs(remaining)
    if (activeTab === id) setActiveTab(remaining[remaining.length - 1].id)
  }

  function switchTab(id) {
    const tab = tabs.find(t => t.id === id)
    setActiveTab(id)
    setUrlInput(tab?.url ?? '')
    setHistory([])
  }

  function renderPage() {
    if (currentTab.page === 'google') return <GooglePage onSearch={handleSearch} onSearchFocus={() => fire('found-search-bar')} />
    if (currentTab.page === 'search') return <SearchResults query={currentTab.searchQuery ?? ''} />
    if (currentTab.page === 'school') return <SchoolPage />
    if (currentTab.page === 'library') return <LibraryPage />
    if (currentTab.page === 'sketchy') return <SketchyPage onSpotted={() => fire('spotted-sketchy-site')} />
    if (currentTab.page === 'blank') return <BlankPage />
    return <NotFound url={currentTab.url} onNavigate={navigate} />
  }

  return (
    <div className="bs">
      <div className="bs__titlebar">
        <div className="bs__dots">
          <button className="bs__dot bs__dot--red" onClick={onClose} aria-label="Close" />
          <span className="bs__dot bs__dot--yellow" />
          <span className="bs__dot bs__dot--green" />
        </div>

        <div className="bs__chrome">
          <button className="bs__nav-btn" onClick={goBack} disabled={history.length === 0} title="Back">←</button>
          <button className="bs__nav-btn bs__nav-btn--disabled" disabled title="Forward">→</button>
          <button className="bs__nav-btn bs__nav-btn--disabled" disabled title="Refresh">↻</button>
          <input
            ref={urlRef}
            className="bs__url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onFocus={e => e.target.select()}
            onKeyDown={e => e.key === 'Enter' && navigate(urlInput)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="bs__tabbar">
        {tabs.map(tab => (
          <div key={tab.id} className={`bs__tab${tab.id === activeTab ? ' bs__tab--active' : ''}`}
            onClick={() => switchTab(tab.id)}>
            <span className="bs__tab-label">{tab.url || 'new tab'}</span>
            {tabs.length > 1 && (
              <button className="bs__tab-close" onClick={e => { e.stopPropagation(); closeTab(tab.id) }}>×</button>
            )}
          </div>
        ))}
        {tabs.length < MAX_TABS
          ? <button className="bs__new-tab" onClick={openTab}>+</button>
          : <span className="bs__tab-limit">max tabs</span>
        }
      </div>

      <div className="bs__content">{renderPage()}</div>
    </div>
  )
}
