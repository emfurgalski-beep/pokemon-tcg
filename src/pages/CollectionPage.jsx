import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getOwned, countOwnedInSet, exportCollection, importCollection } from '../utils/collection'
import '../styles/collection.css'

export default function CollectionPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [owned, setOwned] = useState(() => getOwned())
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/tcg?endpoint=sets')
      .then(r => r.json())
      .then(data => {
        setSets(data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const setsWithProgress = useMemo(() => {
    return sets
      .map(set => ({ ...set, ownedCount: countOwnedInSet(set.id, owned) }))
      .filter(set => set.ownedCount > 0)
      .sort((a, b) => b.ownedCount - a.ownedCount)
  }, [sets, owned])

  const totalOwned = Object.keys(owned).length
  const completedSets = setsWithProgress.filter(s => s.ownedCount >= s.total).length

  function handleExport() {
    const json = exportCollection()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pokemon-collection.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importCollection(ev.target.result)
        setOwned(getOwned())
        setImportError(null)
        setImportSuccess(true)
        setTimeout(() => setImportSuccess(false), 3000)
      } catch {
        setImportError('Invalid file — expected a JSON collection export.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  if (loading) {
    return <div className="loading">Loading collection...</div>
  }

  return (
    <div className="collection-page">
      <div className="container">
        <h1 className="collection-title">My Collection</h1>

        {/* Stats */}
        <div className="collection-stats">
          <div className="stat-card">
            <div className="stat-value">{totalOwned}</div>
            <div className="stat-label">Cards Owned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{setsWithProgress.length}</div>
            <div className="stat-label">Sets Started</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedSets}</div>
            <div className="stat-label">Sets Completed</div>
          </div>
        </div>

        {/* Export / Import */}
        <div className="collection-actions">
          <button onClick={handleExport} className="collection-btn" disabled={totalOwned === 0}>
            Export JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="collection-btn collection-btn-secondary">
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          {importError && <span className="collection-feedback collection-feedback-error">{importError}</span>}
          {importSuccess && <span className="collection-feedback collection-feedback-success">Collection imported!</span>}
        </div>

        {/* Sets list */}
        {setsWithProgress.length === 0 ? (
          <div className="collection-empty">
            <div className="collection-empty-icon">📦</div>
            <p className="collection-empty-title">Your collection is empty</p>
            <p className="collection-empty-sub">Browse a set and click <strong>+ Collect</strong> on any card to start tracking.</p>
            <Link to="/expansions" className="collection-btn">Browse Expansions</Link>
          </div>
        ) : (
          <div className="collection-sets">
            {setsWithProgress.map(set => {
              const pct = Math.min(100, Math.round((set.ownedCount / set.total) * 100))
              return (
                <Link key={set.id} to={`/expansions/${set.id}`} className="collection-set-item">
                  <div className="collection-set-logo">
                    {set.images?.logo
                      ? <img src={set.images.logo} alt={set.name} />
                      : <div className="collection-set-logo-placeholder">{set.name[0]}</div>
                    }
                  </div>
                  <div className="collection-set-info">
                    <div className="collection-set-name">{set.name}</div>
                    <div className="collection-set-series">{set.series}</div>
                    <div className="collection-set-progress-bar">
                      <div className="collection-set-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="collection-set-count">{set.ownedCount} / {set.total} cards</div>
                  </div>
                  <div className={`collection-set-pct${pct === 100 ? ' complete' : ''}`}>
                    {pct}%
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
