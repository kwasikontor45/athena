import { useState, useRef, useEffect } from 'react'
import './doc-editor-sim.css'

export default function DocEditorSim({ onClose, onAthenaEvent }) {
  const [filename, setFilename]   = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isBold, setIsBold]       = useState(false)
  const [isItalic, setIsItalic]   = useState(false)
  const [isUnder, setIsUnder]     = useState(false)
  const [saveLabel, setSaveLabel] = useState('Save')
  const [fired, setFired]         = useState(new Set())
  const editorRef = useRef(null)

  function fire(event) {
    onAthenaEvent?.({ lesson: 'doc-editor', event })
    setFired(prev => {
      const next = new Set(prev)
      next.add(event)
      const all = ['started-typing', 'used-bold', 'saved-doc', 'named-doc']
      if (all.every(e => next.has(e)) && !prev.has('lesson-complete')) {
        next.add('lesson-complete')
        setTimeout(() => onAthenaEvent?.({ lesson: 'doc-editor', event: 'lesson-complete' }), 600)
      }
      return next
    })
  }

  function handleEditorInput() {
    const text = editorRef.current?.innerText ?? ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
  }

  function handleEditorKeyDown(e) {
    setFired(prev => {
      if (!prev.has('started-typing')) {
        const next = new Set(prev)
        next.add('started-typing')
        onAthenaEvent?.({ lesson: 'doc-editor', event: 'started-typing' })
        return next
      }
      return prev
    })
  }

  function format(cmd) {
    document.execCommand(cmd, false, null)
    editorRef.current?.focus()
    if (cmd === 'bold') {
      setIsBold(v => !v)
      setFired(prev => {
        if (!prev.has('used-bold')) {
          const next = new Set(prev)
          next.add('used-bold')
          onAthenaEvent?.({ lesson: 'doc-editor', event: 'used-bold' })
          return next
        }
        return prev
      })
    }
    if (cmd === 'italic') setIsItalic(v => !v)
    if (cmd === 'underline') setIsUnder(v => !v)
  }

  function handleSave() {
    setSaveLabel('saved ✓')
    setTimeout(() => setSaveLabel('Save'), 1500)
    fire('saved-doc')
  }

  function handleExport() {
    const text = editorRef.current?.innerText ?? ''
    const name = (filename.trim() || 'untitled-document') + '.txt'
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
    fire('exported-doc')
  }

  function handleFilenameBlur() {
    if (filename.trim()) fire('named-doc')
  }

  return (
    <div className="de">
      <div className="de__titlebar">
        <div className="de__dots">
          <button className="de__dot de__dot--red" onClick={onClose} aria-label="Close" />
          <span className="de__dot de__dot--yellow" />
          <span className="de__dot de__dot--green" />
        </div>
        <span className="de__title">{filename || 'untitled-document'}</span>
        <span />
      </div>

      <div className="de__toolbar">
        <input
          className="de__filename"
          placeholder="untitled-document"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          onBlur={handleFilenameBlur}
        />
        <div className="de__divider" />
        <button className={`de__fmt-btn${isBold ? ' de__fmt-btn--active' : ''}`} onClick={() => format('bold')}><b>B</b></button>
        <button className={`de__fmt-btn${isItalic ? ' de__fmt-btn--active' : ''}`} onClick={() => format('italic')}><i>I</i></button>
        <button className={`de__fmt-btn${isUnder ? ' de__fmt-btn--active' : ''}`} onClick={() => format('underline')}><u>U</u></button>
        <div className="de__divider" />
        <button className="de__save-btn" onClick={handleSave}>{saveLabel}</button>
        <button className="de__save-btn" onClick={handleExport}>Export</button>
      </div>

      {/* Task strip */}
      {!fired.has('lesson-complete') && (
        <div className="de__tasks">
          {[
            { key: 'started-typing', label: 'start typing',   hint: 'click in the page and type' },
            { key: 'used-bold',      label: 'make text bold', hint: 'select text → click B or Ctrl+B' },
            { key: 'named-doc',      label: 'name your doc',  hint: 'type a name in the filename box' },
            { key: 'saved-doc',      label: 'save it',        hint: 'Ctrl+S or click Save' },
          ].map(({ key, label, hint }) => {
            const done = fired.has(key)
            return (
              <div key={key} className={`de__task${done ? ' de__task--done' : ''}`}>
                <span className="de__task-check">{done ? '✓' : '○'}</span>
                <span className="de__task-label">{label}</span>
                {!done && <span className="de__task-hint">{hint}</span>}
              </div>
            )
          })}
        </div>
      )}

      <div className="de__page-wrap">
        <div className="de__page">
          <div
            ref={editorRef}
            className="de__editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            data-placeholder="Start typing your document here..."
          />
        </div>
      </div>

      <div className="de__footer">
        <span className="de__wordcount">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
