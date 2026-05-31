import { useState, useRef, useEffect } from 'react'
import './browser-sim.css'

const BOOKMARKS = [
  { label: '🎓 School',   url: 'kontor.edu'   },
  { label: '📚 Library',  url: 'library.edu'  },
  { label: '▶ ViewTube',  url: 'viewtube.com' },
  { label: '🔍 Google',   url: 'google.com'   },
]

const MAX_TABS = 4

function normalizeUrl(raw) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, '')
}

function pageForUrl(url) {
  const u = normalizeUrl(url)
  if (u.includes('google'))                                                    return 'google'
  if (u.includes('school') || u.includes('portal') || u.includes('kontor.edu')) return 'school'
  if (u.includes('library'))                                                   return 'library'
  if (u.includes('youtube') || u.includes('viewtube'))                         return 'video'
  if (u.includes('wiki') || u.includes('khan') || u.includes('openwiki'))      return 'wiki'
  if (u.includes('news') || u.includes('bbc') || u.includes('cnn') || u.includes('daily')) return 'news'
  if (u.includes('prizez') || u.includes('free-prize') || u.includes('claim-now') || u.includes('winner')) return 'sketchy'
  if (u === '')                                                                return 'blank'
  return 'notfound'
}

function topicFromUrl(url) {
  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1]?.replace(/-|_/g, ' ') || 'this topic'
}

/* ── Pages ─────────────────────────────────────────────────────────────── */

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

function SearchResults({ query, onNavigate }) {
  const slug = query.replace(/\s+/g, '-').toLowerCase()
  const results = [
    { title: `${query} — OpenWiki`, url: `openwiki.org/wiki/${slug}` },
    { title: `${query} explained — Khan Learning`, url: `khanlearning.org/${slug}` },
    { title: `Daily News: ${query} update`, url: `dailynews.com/${slug}` },
  ]
  return (
    <div className="bsp bsp--results">
      <p className="bsp__results-label">Results for "<strong>{query}</strong>"</p>
      {results.map(r => (
        <div key={r.url} className="bsp__result" onClick={() => onNavigate(r.url)} role="button">
          <span className="bsp__result-title">{r.title}</span>
          <span className="bsp__result-url">https://{r.url}</span>
        </div>
      ))}
    </div>
  )
}

function SchoolPage({ onOpenPortal, onNavigateLibrary }) {
  return (
    <div className="bsp bsp--school">
      <div className="bsp__school-header">
        <div className="bsp__school-logo">🎓 Kontor Community College</div>
        <nav className="bsp__school-nav">
          <span>Admissions</span><span>Academics</span>
          <button className="bsp__school-nav-link" onClick={onNavigateLibrary}>Library</button>
          <span>Student Life</span><span>Contact</span>
        </nav>
      </div>
      <div className="bsp__school-body">
        <div className="bsp__school-hero">
          <h2 className="bsp__school-headline">Empowering Students Since 1998</h2>
          <p className="bsp__school-sub">Building skills for life, careers, and community.</p>
          <div className="bsp__school-actions">
            <button className="bsp__school-btn bsp__school-btn--primary" onClick={onOpenPortal}>Student Portal →</button>
            <button className="bsp__school-btn">Course Catalog</button>
          </div>
        </div>
        <div className="bsp__school-notices">
          <div className="bsp__school-notices-title">📢 Announcements</div>
          {[
            { icon: '📅', text: 'Week 1 classes begin Monday. Check your email for room assignments.' },
            { icon: '📚', text: 'Library orientation sessions available — visit library.edu to book a slot.' },
            { icon: '💰', text: 'Financial aid award letters are now available in the student portal.' },
          ].map((n, i) => (
            <div key={i} className="bsp__school-notice">
              <span>{n.icon}</span>
              <span>{n.text}</span>
            </div>
          ))}
        </div>
        <div className="bsp__school-links">
          {[
            { icon: '🎓', label: 'Student Portal', action: onOpenPortal },
            { icon: '📅', label: 'Class Schedule', action: null },
            { icon: '📝', label: 'Assignment Hub', action: onOpenPortal },
            { icon: '💬', label: 'Student Support', action: null },
          ].map(l => (
            <button
              key={l.label}
              className={`bsp__school-link${l.action ? '' : ' bsp__school-link--inert'}`}
              onClick={l.action ?? undefined}
            >
              <span className="bsp__school-link-icon">{l.icon}</span>
              <span className="bsp__school-link-label">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const CATALOG = [
  { id: 'b1', title: 'Introduction to Business', author: 'T. Bateman',  subject: 'Business',    available: true  },
  { id: 'b2', title: 'Financial Literacy: The Basics', author: 'A. Mensah', subject: 'Business', available: true  },
  { id: 'b3', title: 'Microsoft Office Essentials',  author: 'K. Linden',  subject: 'Technology', available: false },
  { id: 'b4', title: 'Digital Literacy in the Modern Age', author: 'R. Osei', subject: 'Technology', available: true },
  { id: 'b5', title: 'Study Skills for College Students', author: 'P. Ellis', subject: 'General',   available: true  },
  { id: 'b6', title: 'English Composition Handbook',  author: 'C. Walsh',   subject: 'English',    available: true  },
  { id: 'b7', title: 'Introduction to Psychology',    author: 'D. Myers',   subject: 'Psychology', available: false },
  { id: 'b8', title: 'College Mathematics',           author: 'B. Blitzer', subject: 'Maths',      available: true  },
]

const DOWNLOADS = [
  { id: 'd1', name: 'BUS101-Syllabus.pdf',   label: 'BUS 101 Syllabus',      meta: 'Prof. Mensah · Introduction to Business' },
  { id: 'd2', name: 'BUS101-Week1-Slides.pdf', label: 'BUS 101 Week 1 Slides', meta: 'Prof. Mensah · Introduction to Business' },
  { id: 'd3', name: 'StudySkills-Guide.pdf',  label: 'Study Skills Guide',    meta: 'Student Support Services' },
]

function LibraryPage({ onAthenaEvent, simContext, onSimContext }) {
  const [query,     setQuery]     = useState(() => simContext?.repliedToMensah ? 'BUS 101' : '')
  const [downloaded, setDownloaded] = useState({})

  const results = query.trim()
    ? CATALOG.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase()) ||
        b.subject.toLowerCase().includes(query.toLowerCase())
      )
    : CATALOG

  function handleDownload(file) {
    setDownloaded(prev => ({ ...prev, [file.id]: true }))
    onAthenaEvent?.({ lesson: 'browser', event: 'downloaded-file', context: file.name })
    onSimContext?.({ downloads: [...(simContext?.downloads ?? []), file.name] })
  }

  return (
    <div className="bsp bsp--library">
      <div className="bsp__library-header">
        <div className="bsp__library-logo">📚 Kontor Community Library</div>
        <div className="bsp__library-hours">Mon–Fri 8am–9pm · Sat 9am–5pm</div>
      </div>

      <div className="bsp__library-search-row">
        <input
          className="bsp__library-search"
          placeholder="Search by title, author, or subject…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="bsp__library-clear" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      <div className="bsp__library-section">
        <div className="bsp__library-section-title">📋 Course Materials</div>
        {DOWNLOADS.map(file => (
          <div key={file.id} className="bsp__library-resource">
            <span className="bsp__library-resource-icon">📄</span>
            <div className="bsp__library-resource-info">
              <div className="bsp__library-resource-name">{file.name}</div>
              <div className="bsp__library-resource-meta">{file.meta}</div>
            </div>
            <button
              className={`bsp__library-download${downloaded[file.id] ? ' bsp__library-download--done' : ''}`}
              onClick={() => handleDownload(file)}
              disabled={!!downloaded[file.id]}
            >
              {downloaded[file.id] ? '✓ saved' : '↓ download'}
            </button>
          </div>
        ))}
      </div>

      <div className="bsp__library-section">
        <div className="bsp__library-section-title">
          📖 Catalog {query ? `— ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : `— ${CATALOG.length} titles`}
        </div>
        {results.length === 0 ? (
          <div className="bsp__library-empty">No titles found for "{query}"</div>
        ) : results.map(b => (
          <div key={b.id} className="bsp__book">
            <div className="bsp__book-info">
              <span className="bsp__book-title">{b.title}</span>
              <span className="bsp__book-author">{b.author} · {b.subject}</span>
            </div>
            <span className={`bsp__book-status${b.available ? '' : ' bsp__book-status--out'}`}>
              {b.available ? 'Available' : 'Checked out'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const VIDEOS = [
  { e: '💻', title: 'How Computers Work — Beginner Guide',   views: '2.1M', dur: '12:05' },
  { e: '📧', title: 'Email Tips You Need to Know',           views: '890K', dur: '5:31'  },
  { e: '🔐', title: 'How to Stay Safe Online',               views: '1.4M', dur: '7:18'  },
  { e: '🎓', title: 'Study Skills for College',              views: '445K', dur: '9:47'  },
  { e: '🌐', title: 'Internet Basics Explained',             views: '3.1M', dur: '15:22' },
  { e: '⌨️', title: 'Learn to Type Fast — Full Tutorial',   views: '672K', dur: '8:24'  },
]

function VideoPage() {
  return (
    <div className="bsp bsp--video">
      <div className="bsp__video-header">▶ ViewTube</div>
      <div className="bsp__video-grid">
        {VIDEOS.map(v => (
          <div key={v.title} className="bsp__video-card">
            <div className="bsp__video-thumb">
              <span className="bsp__video-emoji">{v.e}</span>
              <span className="bsp__video-dur">{v.dur}</span>
            </div>
            <div className="bsp__video-info">
              <div className="bsp__video-title">{v.title}</div>
              <div className="bsp__video-views">{v.views} views</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WikiPage({ url }) {
  const topic = topicFromUrl(url)
  const cap = topic.charAt(0).toUpperCase() + topic.slice(1)
  return (
    <div className="bsp bsp--wiki">
      <div className="bsp__wiki-brand">📖 OpenWiki — The Free Encyclopedia</div>
      <h2 className="bsp__wiki-title">{cap}</h2>
      <p className="bsp__wiki-intro">
        <strong>{cap}</strong> is a subject with a rich history and broad applications in everyday life.
        Researchers and practitioners have contributed to its development across many fields and communities worldwide.
      </p>
      <div className="bsp__wiki-toc">
        <div className="bsp__wiki-toc-label">Contents</div>
        {['History', 'Overview', 'Key Concepts', 'Modern Applications', 'References'].map(s => (
          <div key={s} className="bsp__wiki-toc-item">— {s}</div>
        ))}
      </div>
      <p className="bsp__wiki-body">
        The study of {topic} has evolved significantly over recent decades. Modern approaches emphasise
        practical skills alongside theoretical understanding, making it accessible to a wide range of learners.
      </p>
    </div>
  )
}

const HEADLINES = [
  { e: '🎓', text: 'Community College Expands Digital Literacy Program',  time: '2h ago' },
  { e: '💻', text: 'Study: Computer Skills Boost Employment Rates by 40%', time: '4h ago' },
  { e: '🌐', text: 'Free Internet Access Classes Now at Local Libraries',   time: '6h ago' },
  { e: '📱', text: 'Mobile Technology Reaches More Rural Communities',      time: '8h ago' },
  { e: '🔐', text: 'Report: Online Scams Rise — How to Protect Yourself',  time: '10h ago'},
]

function NewsPage() {
  return (
    <div className="bsp bsp--news">
      <div className="bsp__news-brand">📰 Daily News</div>
      <div className="bsp__news-list">
        {HEADLINES.map(h => (
          <div key={h.text} className="bsp__news-item">
            <span className="bsp__news-emoji">{h.e}</span>
            <div className="bsp__news-text">
              <div className="bsp__news-headline">{h.text}</div>
              <div className="bsp__news-time">{h.time}</div>
            </div>
          </div>
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
        <button className="bsp__notfound-link" onClick={() => onNavigate('viewtube.com')}>viewtube.com</button>
        <button className="bsp__notfound-link" onClick={() => onNavigate('dailynews.com')}>dailynews.com</button>
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

/* ── Main sim ───────────────────────────────────────────────────────────── */

export default function BrowserSim({ onClose, onAthenaEvent, simContext, onSimContext, onOpenApp }) {
  const [tabs, setTabs] = useState([{ id: 1, url: 'google.com', page: 'google', searchQuery: null }])
  const [activeTab, setActiveTab] = useState(1)
  const [urlInput, setUrlInput] = useState('google.com')
  const [history, setHistory] = useState([])
  const [fired, setFired] = useState(new Set())
  const urlRef = useRef(null)

  useEffect(() => {
    setTimeout(() => onAthenaEvent?.({ lesson: 'browser', event: 'browser-opened' }), 800)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0]

  function fire(event) {
    onAthenaEvent?.({ lesson: 'browser', event })
    setFired(prev => {
      const next = new Set(prev)
      next.add(event)
      // nudge toward sketchy site after typed-url + opened-tab
      if (next.has('typed-url') && next.has('opened-tab') && !next.has('hint-sketchy')) {
        next.add('hint-sketchy')
        setTimeout(() => onAthenaEvent?.({ lesson: 'browser', event: 'hint-sketchy' }), 2000)
      }
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
    setUrlInput(`google.com/search?q=${encodeURIComponent(query)}`)
    fire('found-search-bar')
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
    if (currentTab.page === 'google')  return <GooglePage onSearch={handleSearch} onSearchFocus={() => fire('found-search-bar')} />
    if (currentTab.page === 'search')  return <SearchResults query={currentTab.searchQuery ?? ''} onNavigate={navigate} />
    if (currentTab.page === 'school')  return <SchoolPage onOpenPortal={() => onOpenApp?.('school-portal')} onNavigateLibrary={() => navigate('library.edu')} />
    if (currentTab.page === 'library') return <LibraryPage onAthenaEvent={onAthenaEvent} simContext={simContext} onSimContext={onSimContext} />
    if (currentTab.page === 'video')   return <VideoPage />
    if (currentTab.page === 'wiki')    return <WikiPage url={currentTab.url} />
    if (currentTab.page === 'news')    return <NewsPage />
    if (currentTab.page === 'sketchy') return <SketchyPage onSpotted={() => fire('spotted-sketchy-site')} />
    if (currentTab.page === 'blank')   return <BlankPage />
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

      <div className="bs__bookmarks">
        {BOOKMARKS.map(b => (
          <button key={b.url} className="bs__bookmark" onClick={() => navigate(b.url)}>{b.label}</button>
        ))}
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

      {/* Task strip */}
      {!fired.has('lesson-complete') && (
        <div className="bs__tasks">
          {[
            { key: 'typed-url',        label: 'type a URL',     hint: 'address bar → Enter' },
            { key: 'opened-tab',       label: 'open a new tab', hint: 'click + next to tabs' },
            { key: 'used-back-button', label: 'go back',        hint: 'click the ← button'  },
            { key: 'found-search-bar', label: 'use search',     hint: 'search on Google'     },
          ].map(({ key, label, hint }) => {
            const done = fired.has(key)
            return (
              <div key={key} className={`bs__task${done ? ' bs__task--done' : ''}`} title={done ? '' : hint}>
                <span className="bs__task-check">{done ? '✓' : '○'}</span>
                <span className="bs__task-label">{label}</span>
                {!done && <span className="bs__task-hint">{hint}</span>}
              </div>
            )
          })}
        </div>
      )}

      <div className="bs__content">{renderPage()}</div>
    </div>
  )
}
