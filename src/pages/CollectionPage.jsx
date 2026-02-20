import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getOwned, countOwnedInSet, getTotalValue, getSetValue, exportCollection, importCollection } from '../utils/collection'
import { getWantList } from '../utils/wantlist'
import { getBinders } from '../utils/binders'
import '../styles/collection.css'

export default function CollectionPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState(() => getOwned())
  const [wantList, setWantList] = useState(() => getWantList())
  const [binders, setBinders] = useState(() => getBinders())
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

  // Refresh from localStorage when page is focused
  useEffect(() => {
    function onFocus() {
      setCollection(getOwned())
      setWantList(getWantList())
      setBinders(getBinders())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const setsWithProgress = useMemo(() => {
    return sets
      .map(set => ({
        ...set,
        ownedCount: countOwnedInSet(set.id, collection),
        setValue: getSetValue(set.id, collection),
      }))
      .filter(set => set.ownedCount > 0)
      .sort((a, b) => b.ownedCount - a.ownedCount)
  }, [sets, collection])

  const totalOwned = Object.values(collection).reduce((sum, e) => sum + (e.qty || 0), 0)
  const uniqueOwned = Object.keys(collection).length
  const completedSets = setsWithProgress.filter(s => s.ownedCount >= s.total).length
  const totalValue = getTotalValue(collection)

  const wantEntries = Object.entries(wantList)
  const binderList = Object.values(binders)

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
        setCollection(getOwned())
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
            <div className="stat-label">Total Cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uniqueOwned}</div>
            <div className="stat-label">Unique Cards</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{setsWithProgress.length}</div>
            <div className="stat-label">Sets Started</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completedSets}</div>
            <div className="stat-label">Sets Completed</div>
          </div>
          <div className="stat-card stat-card-value">
            <div className="stat-value">${totalValue.toFixed(2)}</div>
            <div className="stat-label">Est. Value</div>
          </div>
        </div>

        {/* Export / Import */}
        <div className="collection-actions">
          <button onClick={handleExport} className="collection-btn" disabled={uniqueOwned === 0}>
            Export JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="collection-btn collection-btn-secondary">
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          {importError && <span className="collection-feedback collection-feedback-error">{importError}</span>}
          {importSuccess && <span className="collection-feedback collection-feedback-success">Collection imported!</span>}
        </div>

        {/* Binders */}
        {binderList.length > 0 && (
          <section className="collection-section">
            <div className="collection-section-header">
              <h2 className="collection-section-title">My Binders</h2>
              <Link to="/binders" className="collection-section-link">Manage Binders →</Link>
            </div>
            <div className="binders-preview-grid">
              {binderList.map(binder => (
                <Link key={binder.id} to={`/binders/${binder.id}`} className="binder-preview-card">
                  <div className="binder-preview-images">
                    {binder.cards.slice(0, 4).map(card => (
                      <img key={card.id} src={card.image} alt={card.name} className="binder-preview-thumb" />
                    ))}
                    {binder.cards.length === 0 && (
                      <div className="binder-preview-empty">Empty</div>
                    )}
                  </div>
                  <div className="binder-preview-info">
                    <div className="binder-preview-name">{binder.name}</div>
                    <div className="binder-preview-count">{binder.cards.length} cards</div>
                  </div>
                </Link>
              ))}
              <Link to="/binders" className="binder-preview-card binder-preview-new">
                <div className="binder-preview-new-icon">+</div>
                <div className="binder-preview-info">
                  <div className="binder-preview-name">New Binder</div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Want List */}
        {wantEntries.length > 0 && (
          <section className="collection-section">
            <div className="collection-section-header">
              <h2 className="collection-section-title">Want List</h2>
              <span className="collection-section-count">{wantEntries.length} cards</span>
            </div>
            <div className="want-list-grid">
              {wantEntries.map(([id, card]) => (
                <Link key={id} to={`/cards/${id}`} className="want-card-item">
                  {card.image ? (
                    <img src={card.image} alt={card.name} className="want-card-img" />
                  ) : (
                    <div className="want-card-placeholder">{card.name?.[0]}</div>
                  )}
                  <div className="want-card-name">{card.name}</div>
                  <div className="want-card-meta">#{card.number} · {card.setId}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sets */}
        {setsWithProgress.length === 0 && wantEntries.length === 0 && binderList.length === 0 ? (
          <div className="collection-empty">
            <div className="collection-empty-icon">📦</div>
            <p className="collection-empty-title">Your collection is empty</p>
            <p className="collection-empty-sub">
              Browse a set and click <strong>+ Collect</strong> on any card to start tracking.
              Use <strong>♡</strong> to add to your Want List.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/expansions" className="collection-btn">Browse Expansions</Link>
              <Link to="/binders" className="collection-btn collection-btn-secondary">Create a Binder</Link>
            </div>
          </div>
        ) : setsWithProgress.length > 0 ? (
          <section className="collection-section">
            <div className="collection-section-header">
              <h2 className="collection-section-title">By Set</h2>
            </div>
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
                      <div className="collection-set-count">
                        {set.ownedCount} / {set.total} cards
                        {set.setValue > 0 && <span className="collection-set-value"> · est. ${set.setValue.toFixed(2)}</span>}
                      </div>
                    </div>
                    <div className={`collection-set-pct${pct === 100 ? ' complete' : ''}`}>
                      {pct}%
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
