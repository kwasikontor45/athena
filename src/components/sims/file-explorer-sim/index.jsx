import { useState, useRef, useEffect, useCallback } from 'react'
import './file-explorer-sim.css'

const INITIAL_FS = {
  id: 'root',
  name: 'my files',
  type: 'folder',
  children: [
    {
      id: 'folder-school',
      name: 'school',
      type: 'folder',
      children: [
        { id: 'file-1', name: 'my-first-assignment.txt', type: 'file' },
        { id: 'file-2', name: 'class-notes.txt', type: 'file' },
      ],
    },
    {
      id: 'folder-downloads',
      name: 'downloads',
      type: 'folder',
      children: [],
    },
    { id: 'file-3', name: 'welcome.txt', type: 'file' },
  ],
}

let _nextId = 1
function genId() { return `item-${Date.now()}-${_nextId++}` }

function findNode(node, id) {
  if (node.id === id) return node
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

function findParent(node, childId, parent = null) {
  if (node.id === childId) return parent
  if (node.children) {
    for (const child of node.children) {
      const found = findParent(child, childId, node)
      if (found) return found
    }
  }
  return null
}

function removeNode(root, id) {
  if (!root.children) return root
  return {
    ...root,
    children: root.children
      .filter(c => c.id !== id)
      .map(c => removeNode(c, id)),
  }
}

function insertNode(root, targetFolderId, item) {
  if (root.id === targetFolderId) {
    return { ...root, children: [...(root.children ?? []), item] }
  }
  if (!root.children) return root
  return {
    ...root,
    children: root.children.map(c => insertNode(c, targetFolderId, item)),
  }
}

function renameNode(root, id, newName) {
  if (root.id === id) return { ...root, name: newName }
  if (!root.children) return root
  return { ...root, children: root.children.map(c => renameNode(c, id, newName)) }
}

function buildCrumbs(root, targetId, trail = []) {
  if (root.id === targetId) return [...trail, root]
  if (root.children) {
    for (const child of root.children) {
      const found = buildCrumbs(child, targetId, [...trail, root])
      if (found) return found
    }
  }
  return null
}

export default function FileExplorerSim({ onClose, onAthenaEvent }) {
  const [fs, setFs] = useState(INITIAL_FS)
  const [currentId, setCurrentId] = useState('root')
  const [selectedId, setSelectedId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [trash, setTrash] = useState([])
  const [dragOverId, setDragOverId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [completed, setCompleted] = useState(new Set())
  const dragItemId = useRef(null)
  const renameInputRef = useRef(null)

  const currentFolder = findNode(fs, currentId) ?? fs
  const crumbs = buildCrumbs(fs, currentId) ?? [fs]

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  useEffect(() => {
    const close = () => setContextMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const fireEvent = useCallback((event, context = '') => {
    onAthenaEvent?.({ lesson: 'file-explorer', event, context })

    setCompleted(prev => {
      const next = new Set(prev)
      next.add(event)
      const all = ['opened-folder', 'created-folder', 'renamed-file', 'moved-file', 'deleted-file']
      if (all.every(e => next.has(e)) && !prev.has('lesson-complete')) {
        next.add('lesson-complete')
        setTimeout(() => onAthenaEvent?.({ lesson: 'file-explorer', event: 'lesson-complete', context: '' }), 600)
      }
      return next
    })
  }, [onAthenaEvent])

  function navigateTo(id) {
    const node = findNode(fs, id)
    if (!node || node.type !== 'folder') return
    setCurrentId(id)
    setSelectedId(null)
    if (id !== 'root') fireEvent('opened-folder')
  }

  function goBack() {
    const parent = findParent(fs, currentId)
    if (parent) { setCurrentId(parent.id); setSelectedId(null) }
  }

  function startRename(id, currentName) {
    setRenamingId(id)
    setRenameValue(currentName)
    setContextMenu(null)
  }

  function confirmRename() {
    const trimmed = renameValue.trim()
    if (trimmed && renamingId) {
      setFs(prev => renameNode(prev, renamingId, trimmed))
      fireEvent('renamed-file')
    }
    setRenamingId(null)
  }

  function cancelRename() {
    setRenamingId(null)
  }

  function createFolder() {
    const node = { id: genId(), name: 'new folder', type: 'folder', children: [] }
    setFs(prev => insertNode(prev, currentId, node))
    setSelectedId(node.id)
    setTimeout(() => startRename(node.id, 'new folder'), 30)
  }

  function moveToTrash(id) {
    if (!id) return
    const node = findNode(fs, id)
    if (!node) return
    setTrash(prev => [...prev, node])
    setFs(prev => removeNode(prev, id))
    if (selectedId === id) setSelectedId(null)
    if (currentId === id) setCurrentId('root')
    setContextMenu(null)
    fireEvent('deleted-file')
  }

  function onDragStart(e, id) {
    dragItemId.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e, targetId) {
    e.preventDefault()
    const target = findNode(fs, targetId)
    if (!target || target.type !== 'folder') return
    if (targetId === dragItemId.current) return
    const dragged = findNode(fs, dragItemId.current)
    if (dragged?.type === 'folder') {
      const crumbIds = (buildCrumbs(fs, targetId) ?? []).map(n => n.id)
      if (crumbIds.includes(dragItemId.current)) return
    }
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(targetId)
  }

  function onDrop(e, targetId) {
    e.preventDefault()
    setDragOverId(null)
    const id = dragItemId.current
    if (!id || id === targetId) return
    const target = findNode(fs, targetId)
    if (!target || target.type !== 'folder') return
    const dragged = findNode(fs, id)
    if (!dragged) return
    const crumbIds = (buildCrumbs(fs, targetId) ?? []).map(n => n.id)
    if (crumbIds.includes(id)) return
    setFs(prev => insertNode(removeNode(prev, id), targetId, dragged))
    fireEvent('moved-file')
  }

  function onDragEnd() {
    dragItemId.current = null
    setDragOverId(null)
  }

  function onRightClick(e, id) {
    e.preventDefault()
    e.stopPropagation()
    setSelectedId(id)
    setContextMenu({ x: e.clientX, y: e.clientY, id })
  }

  function onKeyDown(e) {
    if (e.key === 'F2' && selectedId && !renamingId) {
      const node = findNode(fs, selectedId)
      if (node) startRename(selectedId, node.name)
    }
  }

  const items = currentFolder.children ?? []

  return (
    <div className="fes" tabIndex={0} onKeyDown={onKeyDown}>
      <div className="fes__titlebar">
        <div className="fes__dots">
          <button className="fes__dot fes__dot--red" onClick={onClose} aria-label="Close" />
          <span className="fes__dot fes__dot--yellow" />
          <span className="fes__dot fes__dot--green" />
        </div>
        <span className="fes__title">my files</span>
        <span className="fes__trash-count">
          {trash.length > 0 && `🗑️ ${trash.length}`}
        </span>
      </div>

      <div className="fes__body">
        <nav className="fes__sidebar">
          <button
            className={`fes__sidebar-item${currentId === 'root' ? ' fes__sidebar-item--active' : ''}`}
            onClick={() => navigateTo('root')}
          >
            🗂️ my files
          </button>
          {(fs.children ?? []).filter(n => n.type === 'folder').map(folder => (
            <button
              key={folder.id}
              className={[
                'fes__sidebar-item',
                'fes__sidebar-item--child',
                currentId === folder.id ? 'fes__sidebar-item--active' : '',
                dragOverId === folder.id ? 'fes__sidebar-item--drop' : '',
              ].join(' ')}
              onClick={() => navigateTo(folder.id)}
              onDragOver={e => onDragOver(e, folder.id)}
              onDrop={e => onDrop(e, folder.id)}
              onDragLeave={() => setDragOverId(null)}
            >
              📁 {folder.name}
            </button>
          ))}
        </nav>

        <div className="fes__main">
          <div className="fes__toolbar">
            <button className="fes__tool-btn" onClick={goBack} disabled={currentId === 'root'}>← back</button>
            <button className="fes__tool-btn" onClick={createFolder}>+ new folder</button>
            <button
              className="fes__tool-btn"
              onClick={() => { const n = findNode(fs, selectedId); if (n) startRename(selectedId, n.name) }}
              disabled={!selectedId}
            >
              rename
            </button>
            <button
              className="fes__tool-btn fes__tool-btn--danger"
              onClick={() => moveToTrash(selectedId)}
              disabled={!selectedId}
            >
              🗑️ trash
            </button>
          </div>

          <div className="fes__crumbs">
            {crumbs.map((n, i) => (
              <span key={n.id}>
                {i > 0 && <span className="fes__crumb-sep"> / </span>}
                <button className="fes__crumb-btn" onClick={() => navigateTo(n.id)}>{n.name}</button>
              </span>
            ))}
          </div>

          <div className="fes__list">
            {items.length === 0 ? (
              <p className="fes__empty">this folder is empty — try creating one!</p>
            ) : (
              items.map(item => (
                <div
                  key={item.id}
                  className={[
                    'fes__item',
                    selectedId === item.id ? 'fes__item--selected' : '',
                    dragOverId === item.id ? 'fes__item--drop' : '',
                  ].join(' ')}
                  draggable
                  onDragStart={e => onDragStart(e, item.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={item.type === 'folder' ? e => onDragOver(e, item.id) : e => e.preventDefault()}
                  onDrop={item.type === 'folder' ? e => onDrop(e, item.id) : undefined}
                  onDragLeave={() => setDragOverId(null)}
                  onClick={() => setSelectedId(item.id)}
                  onDoubleClick={() => item.type === 'folder' && navigateTo(item.id)}
                  onContextMenu={e => onRightClick(e, item.id)}
                >
                  <span className="fes__item-icon">{item.type === 'folder' ? '📁' : '📄'}</span>

                  {renamingId === item.id ? (
                    <input
                      ref={renameInputRef}
                      className="fes__rename-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRename()
                        if (e.key === 'Escape') cancelRename()
                        e.stopPropagation()
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="fes__item-name">{item.name}</span>
                  )}

                  <span className="fes__item-meta">
                    {item.type === 'folder'
                      ? `${(item.children ?? []).length} item${(item.children ?? []).length !== 1 ? 's' : ''}`
                      : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <ul
          className="fes__ctx"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <li>
            <button className="fes__ctx-item" onClick={() => {
              const n = findNode(fs, contextMenu.id)
              if (n) startRename(contextMenu.id, n.name)
            }}>
              Rename
            </button>
          </li>
          <li>
            <button className="fes__ctx-item fes__ctx-item--danger" onClick={() => moveToTrash(contextMenu.id)}>
              Move to Trash
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
