import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../context/CollectionContext'
import { getMockPrice } from '../utils/pricing'
import { getOwnedSets } from '../utils/collection'
import '../styles/collection.css'

export default function CollectionPage() {
  const {
    owned, binders, wishlist,
    uniqueCards, totalCopies,
    toggleWishlist,
    createBinder, deleteBinder,
    addCardToBinder, removeCardFromBinder,
    exportFull, importFull,
  } = useCollection()

  const [tab, setTab] = useState('overview')
  const [activeBinder, setActiveBinder] = useState(null)
  const [newBinderName, setNewBinderName] = useState('')
  const [importError, setImportError] = useState(null)
  const [setInfoMap, setSetInfoMap] = useState({})
  const fileInputRef = useRef(null)

  // ---- Fetch set metadata (logo, symbol, series) once ----
  useEffect(() => {
    fetch('/api/tcg?endpoint=sets')
      .then(r => r.json())
      .then(data => {
        const map = {}
        ;(data.data || []).forEach(s => { map[s.id] = s })
        setSetInfoMap(map)
      })
      .catch(() => {})
  }, [])

  // ---- Derived stats ----
  const ownedSets = useMemo(() => getOwnedSets(owned), [owned])

  const sortedOwnedSets = useMemo(() =>
    [...ownedSets].sort((a, b) => {
      const pA = a.setTotal ? a.owned / a.setTotal : 0
      const pB = b.setTotal ? b.owned / b.setTotal : 0
      return pB - pA
    }),
    [ownedSets]
  )

  const setsStarted = ownedSets.length
  const setsCompleted = ownedSets.filter(s => s.setTotal && s.owned >= s.setTotal).length

  const estimatedValue = useMemo(() =>
    Object.entries(owned).reduce((sum, [id, card]) =>
      sum + getMockPrice({ id, rarity: card.rarity }) * (card.count || 1), 0),
    [owned]
  )

  // ---- Handlers ----
  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importFull(ev.target.result)
        setImportError(null)
      } catch (err) {
        setImportError('Invalid file: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleCreateBinder() {
    const name = newBinderName.trim()
    if (!name) return
    createBinder(name)
    setNewBinderName('')
  }

  // ---- Empty state ----
  if (uniqueCards === 0 && Object.keys(binders).length === 0 && Object.keys(wishlist).length === 0) {
    return (
      <div className="collection-page">
        <div className="container">
          <div className="collection-empty">
            <div className="collection-empty-icon">📦</div>
            <h1>Your Collection is Empty</h1>
            <p>Browse expansions and click <strong>+ Collect</strong> on any card to start tracking!</p>
            <Link to="/expansions" className="collection-empty-btn">Browse Expansions</Link>
          </div>
        </div>
      </div>
    )
  }

  function renderCardGrid(entries, actions) {
    return (
      <div className="collection-cards-grid">
        {entries.map(([cardId, card]) => (
          <div key={cardId} className="collection-card-item">
            <Link to={`/cards/${cardId}`} className="collection-card-link">
              <div className="collection-card-image-wrapper">
                {card.image
                  ? <img src={card.image} alt={card.name} className="collection-card-image" loading="lazy" />
                  : <div className="collection-card-no-image">?</div>
                }
                {(card.count || 1) > 1 && (
                  <div className="collection-copy-badge">×{card.count}</div>
                )}
              </div>
              <div className="collection-card-info">
                <div className="collection-card-name">{card.name}</div>
                <div className="collection-card-meta">
                  <span className="collection-card-number">#{card.number}</span>
                  {card.rarity && <span className="collection-card-rarity">{card.rarity}</span>}
                </div>
                {card.setName && <div className="collection-card-set">{card.setName}</div>}
              </div>
            </Link>
            <div className="collection-card-actions">{actions(cardId, card)}</div>
          </div>
        ))}
      </div>
    )
  }

  const binderList = Object.values(binders).sort((a, b) => b.createdAt - a.createdAt)
  const activeBinderData = activeBinder ? binders[activeBinder] : null

  return (
    <div className="collection-page">
      {/* ---- Header ---- */}
      <div className="collection-header">
        <div className="container">
          <div className="collection-header-top">
            <h1 className="collection-title">My Collection</h1>
            <div className="collection-header-actions">
              <button className="collection-action-btn" onClick={exportFull}>↓ Export JSON</button>
              <button className="collection-action-btn" onClick={() => fileInputRef.current?.click()}>↑ Import JSON</button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
            </div>
          </div>
          {importError && <div className="import-error">{importError}</div>}
          <div className="collection-stats">
            <div className="collection-stat">
              <span className="collection-stat-value">{uniqueCards}</span>
              <span className="collection-stat-label">Unique Cards</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value">{totalCopies}</span>
              <span className="collection-stat-label">Total Copies</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value">{setsStarted}</span>
              <span className="collection-stat-label">Sets Started</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value collection-stat-value--gold">{setsCompleted}</span>
              <span className="collection-stat-label">Sets Completed</span>
            </div>
            <div className="collection-stat">
              <span className="collection-stat-value collection-stat-value--green">${estimatedValue.toFixed(2)}</span>
              <span className="collection-stat-label">Est. Value</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div className="collection-tabs-bar">
        <div className="container">
          <div className="collection-tabs">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'binders', label: 'Binders', count: Object.keys(binders).length },
              { key: 'wishlist', label: 'Wishlist', count: Object.keys(wishlist).length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                className={`collection-tab ${tab === key ? 'active' : ''}`}
                onClick={() => { setTab(key); setActiveBinder(null) }}
              >
                {label}
                {count > 0 && <span className="tab-count">{count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="container collection-content">

        {/* OVERVIEW — set progress */}
        {tab === 'overview' && (
          <div className="collection-overview">
            {sortedOwnedSets.length === 0 ? (
              <div className="no-cards">
                No cards yet. <Link to="/expansions">Browse Expansions</Link> and click <strong>+ Collect</strong>.
              </div>
            ) : (
              <div className="set-progress-list">
                {sortedOwnedSets.map(set => {
                  const meta = setInfoMap[set.setId]
                  // Fallback to meta.total for cards migrated without setTotal
                  const setTotal = set.setTotal || meta?.total || null
                  const pct = setTotal ? Math.round(set.owned / setTotal * 100) : null
                  const completed = setTotal && set.owned >= setTotal
                  const logoUrl = meta?.images?.logo
                  const series = meta?.series
                  const setName = set.setName && set.setName !== set.setId ? set.setName : (meta?.name || set.setId)

                  return (
                    <Link
                      key={set.setId}
                      to={`/expansions/${set.setId}`}
                      className={`set-progress-item${completed ? ' completed' : ''}`}
                    >
                      {/* Set logo */}
                      <div className="set-logo-area">
                        {logoUrl
                          ? <img
                              src={logoUrl}
                              alt=""
                              className="set-logo-img"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                            />
                          : null
                        }
                        <div className="set-logo-fallback" style={logoUrl ? { display: 'none' } : undefined}>
                          {setName}
                        </div>
                      </div>

                      {/* Main body */}
                      <div className="set-progress-body">
                        <div className="set-progress-top">
                          <div className="set-progress-names">
                            <span className="set-progress-name">{setName}</span>
                            {series && <span className="set-progress-series">{series}</span>}
                          </div>
                          <div className="set-progress-right">
                            {completed && <span className="set-complete-badge">✓ Complete</span>}
                            {pct !== null
                              ? <span className="set-progress-pct" style={completed ? { color: '#10b981' } : undefined}>{pct}%</span>
                              : <span className="set-progress-pct set-progress-pct--muted">—</span>
                            }
                          </div>
                        </div>

                        <div className="set-progress-bar-track">
                          <div
                            className="set-progress-bar-fill"
                            style={{ width: setTotal ? `${Math.min(pct, 100)}%` : '0%' }}
                          />
                        </div>

                        <div className="set-progress-count">
                          <span>{set.owned}{setTotal ? ` / ${setTotal}` : ''} cards</span>
                          {set.copies > set.owned && (
                            <span className="set-progress-copies">· {set.copies} total copies</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* BINDERS */}
        {tab === 'binders' && (
          <div className="collection-binders">
            <div className="binders-create">
              <input
                type="text"
                placeholder="Name your new binder..."
                value={newBinderName}
                onChange={(e) => setNewBinderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBinder()}
                className="binder-name-input"
                maxLength={40}
              />
              <button
                className="binder-create-btn"
                onClick={handleCreateBinder}
                disabled={!newBinderName.trim()}
              >
                + Create Binder
              </button>
            </div>

            {activeBinderData ? (
              <div className="binder-detail">
                <button className="binder-back-btn" onClick={() => setActiveBinder(null)}>
                  ← Back to Binders
                </button>
                <div className="binder-detail-header">
                  <h2 className="binder-detail-title">{activeBinderData.name}</h2>
                  <span className="binder-detail-count">
                    {Object.keys(activeBinderData.cards).length} cards
                  </span>
                  <button
                    className="binder-delete-btn binder-delete-btn--inline"
                    onClick={() => { deleteBinder(activeBinder); setActiveBinder(null) }}
                  >
                    Delete Binder
                  </button>
                </div>
                {Object.keys(activeBinderData.cards).length === 0 ? (
                  <div className="no-cards">
                    This binder is empty. Add cards from any card page using the Binder button.
                  </div>
                ) : (
                  renderCardGrid(
                    Object.entries(activeBinderData.cards),
                    (cardId) => (
                      <button
                        className="collection-remove-btn"
                        onClick={() => removeCardFromBinder(activeBinder, cardId)}
                        title="Remove from binder"
                      >✕ Remove</button>
                    )
                  )
                )}
              </div>
            ) : binderList.length === 0 ? (
              <div className="no-cards">No binders yet — create one above!</div>
            ) : (
              <div className="binders-grid">
                {binderList.map(binder => (
                  <div
                    key={binder.id}
                    className="binder-card"
                    onClick={() => setActiveBinder(binder.id)}
                  >
                    <div className="binder-card-previews">
                      {Object.values(binder.cards).slice(0, 4).map((card, i) =>
                        card.image
                          ? <img key={i} src={card.image} alt={card.name} className="binder-preview-img" />
                          : null
                      )}
                      {Object.keys(binder.cards).length === 0 && (
                        <div className="binder-empty-icon">📂</div>
                      )}
                    </div>
                    <div className="binder-card-info">
                      <div className="binder-card-name">{binder.name}</div>
                      <div className="binder-card-count">
                        {Object.keys(binder.cards).length} cards
                      </div>
                    </div>
                    <button
                      className="binder-delete-btn"
                      onClick={(e) => { e.stopPropagation(); deleteBinder(binder.id) }}
                      title="Delete binder"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST */}
        {tab === 'wishlist' && (
          Object.keys(wishlist).length === 0 ? (
            <div className="no-cards">
              No cards on wishlist. Click ⭐ on any card page to add it here.
            </div>
          ) : (
            renderCardGrid(
              Object.entries(wishlist),
              (cardId) => (
                <button
                  className="collection-remove-btn wishlist-remove"
                  onClick={() => toggleWishlist({ id: cardId })}
                  title="Remove from wishlist"
                >✕ Remove</button>
              )
            )
          )
        )}

      </div>
    </div>
  )
}
