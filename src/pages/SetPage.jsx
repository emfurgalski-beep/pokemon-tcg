import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import { getMockPrice, RARITY_ORDER } from '../utils/pricing'
import { useCollection } from '../context/CollectionContext'
import '../styles/set.css'
import '../styles/collection.css'

export default function SetPage() {
  const { setId } = useParams()
  const [setInfo, setSetInfo] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [sortBy, setSortBy] = useState('best-match')
  const [showVariants, setShowVariants] = useState(false)
  const [apiSource, setApiSource] = useState(null)
  const [hasVariants, setHasVariants] = useState(false)
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'products'
  const [ownedFilter, setOwnedFilter] = useState('all') // 'all' | 'owned' | 'missing'
  const [cardLayout, setCardLayout] = useState('grid') // 'grid' | 'list'

  const { owned, isOwned, getCount, toggleCard, addCopy } = useCollection()

  useEffect(() => {
    loadSetData()
  }, [setId])

  async function loadSetData() {
    try {
      setLoading(true)

      const setsResponse = await fetch('/api/tcg?endpoint=sets')
      const setsData = await setsResponse.json()
      const set = setsData.data?.find(s => s.id === setId)
      setSetInfo(set)

      const cardsUrl = `/api/tcg?endpoint=cards&setId=${setId}`
      const cardsResponse = await fetch(cardsUrl)
      const cardsData = await cardsResponse.json()

      if (!cardsResponse.ok) {
        throw new Error(cardsData.error || `HTTP ${cardsResponse.status}`)
      }

      setCards(cardsData.data || [])
      setApiSource(cardsData.meta?.source)
      setHasVariants(cardsData.meta?.hasVariants || false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Count owned cards for this set (for progress bar)
  const ownedInSet = useMemo(() =>
    Object.values(owned).filter(e => e.setId === setId).length,
    [owned, setId]
  )

  // Group cards by name+number to detect variants
  const cardsWithVariants = useMemo(() => {
    if (showVariants || !hasVariants) {
      return cards.map(card => ({ ...card, variantCount: 0 }))
    }

    const grouped = new Map()
    cards.forEach(card => {
      const key = `${card.name}-${card.number}`
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(card)
    })

    const result = []
    grouped.forEach(variants => {
      const sorted = variants.sort((a, b) => a.id.localeCompare(b.id))
      result.push({
        ...sorted[0],
        variantCount: variants.length > 1 ? variants.length : 0,
        allVariants: variants.length > 1 ? variants : null,
      })
    })

    return result.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))
  }, [cards, showVariants, hasVariants])

  const filteredCards = useMemo(() => {
    return cardsWithVariants.filter(card => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = (
          card.name?.toLowerCase().includes(q) ||
          card.number?.toString().includes(q) ||
          card.rarity?.toLowerCase().includes(q)
        )
        if (!match) return false
      }

      if (selectedType) {
        if (!card.types?.includes(selectedType)) return false
      }

      if (ownedFilter === 'owned' && !isOwned(card.id)) return false
      if (ownedFilter === 'missing' && isOwned(card.id)) return false

      return true
    })
  }, [cardsWithVariants, searchQuery, selectedType, ownedFilter, isOwned])

  const sortedCards = useMemo(() => {
    const sorted = [...filteredCards]

    switch (sortBy) {
      case 'best-match':
      case 'number':
        return sorted.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))

      case 'number-desc':
        return sorted.sort((a, b) => (parseInt(b.number) || 0) - (parseInt(a.number) || 0))

      case 'value-high':
        return sorted.sort((a, b) => (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0))

      case 'value-low':
        return sorted.sort((a, b) => (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0))

      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))

      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name))

      case 'cards-own':
        return sorted.sort((a, b) => {
          const d = (isOwned(a.id) ? 0 : 1) - (isOwned(b.id) ? 0 : 1)
          return d !== 0 ? d : (parseInt(a.number) || 0) - (parseInt(b.number) || 0)
        })

      case 'cards-not-own':
        return sorted.sort((a, b) => {
          const d = (isOwned(a.id) ? 1 : 0) - (isOwned(b.id) ? 1 : 0)
          return d !== 0 ? d : (parseInt(a.number) || 0) - (parseInt(b.number) || 0)
        })

      default:
        return sorted
    }
  }, [filteredCards, sortBy, isOwned])

  const typeBreakdown = useMemo(() => {
    const breakdown = {}
    cardsWithVariants
      .filter(c => c.supertype === 'Pokémon')
      .forEach(card => {
        card.types?.forEach(type => {
          breakdown[type] = (breakdown[type] || 0) + 1
        })
      })
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [cardsWithVariants])

  // Guarantee the card always carries set info before writing to collection
  function withSetInfo(card) {
    if (card.set?.id) return card
    return {
      ...card,
      set: {
        id: setId,
        name: setInfo?.name || setId,
        total: setInfo?.total || 0,
      },
    }
  }

  const handleCollect = useCallback((e, card) => {
    e.preventDefault()
    e.stopPropagation()
    toggleCard(withSetInfo(card))
  }, [toggleCard, setId, setInfo])

  const handleAddCopy = useCallback((e, card) => {
    e.preventDefault()
    e.stopPropagation()
    addCopy(withSetInfo(card))
  }, [addCopy, setId, setInfo])

  if (loading) return <div className="loading">Loading set...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!setInfo) return <div className="error">Set not found</div>

  const ownedPct = setInfo.total > 0 ? Math.round(ownedInSet / setInfo.total * 100) : 0

  return (
    <div className="set-page">
      {/* Set Header */}
      <div className="set-header">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Expansions', to: '/expansions' },
            { label: setInfo.name },
          ]} />

          <BackButton fallbackPath="/expansions" label="Back to Expansions" />

          <div className="set-header-content">
            {setInfo.images?.logo && (
              <img
                src={setInfo.images.logo}
                alt={setInfo.name}
                className="set-header-logo"
              />
            )}
            <div className="set-header-info">
              <h1>{setInfo.name}</h1>
              <div className="set-header-meta">
                <span className="meta-badge">{setInfo.id}</span>
                <span className="meta-badge">{setInfo.series}</span>
                <span className="meta-badge">{setInfo.total} cards</span>
                {setInfo.releaseDate && (
                  <span className="meta-badge">{setInfo.releaseDate}</span>
                )}
              </div>

              {/* Collection progress bar — shows only when ≥1 card owned */}
              {ownedInSet > 0 && (
                <div className="set-collection-progress">
                  <div className="set-collection-progress-info">
                    <span className="set-collection-label">
                      Collection: <strong>{ownedInSet} / {setInfo.total}</strong>
                    </span>
                    <span className="set-collection-pct">{ownedPct}%</span>
                  </div>
                  <div className="set-collection-bar-track">
                    <div
                      className="set-collection-bar-fill"
                      style={{ width: `${Math.min(ownedPct, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="container">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
          >
            Cards
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'products' ? 'active' : ''}`}
            onClick={() => setViewMode('products')}
          >
            Sealed Products
          </button>
        </div>

        {/* Type Distribution */}
        {viewMode === 'cards' && typeBreakdown.length > 0 && (
          <div className="type-breakdown">
            <div className="breakdown-header">
              <h3 className="breakdown-title">Type Distribution</h3>
              {selectedType && (
                <button onClick={() => setSelectedType(null)} className="clear-type-button">
                  Clear Filter
                </button>
              )}
            </div>
            <div className="type-grid">
              {typeBreakdown.map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className={`type-badge ${selectedType === type ? 'active' : ''}`}
                >
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cards Controls */}
        {viewMode === 'cards' && (
          <div className="cards-controls">
            <input
              type="search"
              placeholder="Search cards by name, number, or rarity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="cards-controls-right">
              <div className="owned-filter">
                <button
                  className={`owned-filter-btn ${ownedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOwnedFilter('all')}
                >All</button>
                <button
                  className={`owned-filter-btn ${ownedFilter === 'owned' ? 'active-green' : ''}`}
                  onClick={() => setOwnedFilter(ownedFilter === 'owned' ? 'all' : 'owned')}
                >Owned</button>
                <button
                  className={`owned-filter-btn ${ownedFilter === 'missing' ? 'active' : ''}`}
                  onClick={() => setOwnedFilter(ownedFilter === 'missing' ? 'all' : 'missing')}
                >Missing</button>
              </div>
              <div className="sort-dropdown">
                <label htmlFor="sort-select" className="sort-label">Sort By</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="best-match">Best Match</option>
                  <option value="value-high">Value High to Low</option>
                  <option value="value-low">Value Low to High</option>
                  <option value="name-asc">Alphabetical</option>
                  <option value="name-desc">Reverse Alphabetical</option>
                  <option value="number">Card Number Lo-Hi</option>
                  <option value="number-desc">Card Number Hi-Lo</option>
                  <option value="cards-own">Cards I Own</option>
                  <option value="cards-not-own">Cards I Do Not Own</option>
                </select>
              </div>
              {hasVariants && (
                <label className="variants-toggle">
                  <input
                    type="checkbox"
                    checked={showVariants}
                    onChange={(e) => setShowVariants(e.target.checked)}
                  />
                  <span>Show Variants</span>
                </label>
              )}
              <div className="card-layout-toggle">
                <button
                  className={`layout-btn${cardLayout === 'grid' ? ' active' : ''}`}
                  onClick={() => setCardLayout('grid')}
                  title="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  className={`layout-btn${cardLayout === 'list' ? ' active' : ''}`}
                  onClick={() => setCardLayout('list')}
                  title="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="14" height="2.5" rx="1"/>
                    <rect x="1" y="6.75" width="14" height="2.5" rx="1"/>
                    <rect x="1" y="11.5" width="14" height="2.5" rx="1"/>
                  </svg>
                </button>
              </div>
              <div className="cards-count">
                {sortedCards.length} / {cardsWithVariants.length} cards
                {!showVariants && hasVariants && cards.length !== cardsWithVariants.length && (
                  <span className="variants-note"> ({cards.length} with variants)</span>
                )}
              </div>
              {apiSource && (
                <div className="api-source-badge" title={`Data from ${apiSource}`}>
                  {apiSource === 'pokemontcg.io' && '✓ Full data'}
                  {apiSource === 'tcgdex' && '✓ TCGdex data'}
                  {apiSource === 'github-cdn' && 'ℹ Basic data'}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'cards' ? (
          sortedCards.length === 0 ? (
            <div className="no-cards">No cards found</div>
          ) : cardLayout === 'grid' ? (
            <div className="cards-grid">
              {sortedCards.map(card => {
                const owned = isOwned(card.id)
                const count = getCount(card.id)
                return (
                  <div
                    key={card.id}
                    className={`card-item${owned ? ' is-owned' : ''}`}
                  >
                    <Link to={`/cards/${card.id}`} className="card-item-inner">
                      <div className="card-image-wrapper">
                        <img
                          src={card.images?.small || card.images?.large}
                          alt={card.name}
                          className="card-image"
                          loading="lazy"
                        />
                        <div className="card-price-badge">${getMockPrice(card)}</div>
                        {card.variantCount > 0 && (
                          <div className="variant-badge">{card.variantCount} variants</div>
                        )}
                      </div>
                      <div className="card-item-info">
                        <div className="card-item-name">{card.name}</div>
                        <div className="card-item-meta">
                          <span className="card-number">#{card.number}</span>
                          {card.rarity && <span className="card-rarity">{card.rarity}</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="card-collect-row">
                      <button
                        className={`card-collect-btn${owned ? ' owned' : ''}`}
                        onClick={(e) => handleCollect(e, card)}
                      >
                        {owned ? `✓ Owned${count > 1 ? ` ×${count}` : ''}` : '+ Collect'}
                      </button>
                      {owned && (
                        <button
                          className="card-add-copy-btn"
                          onClick={(e) => handleAddCopy(e, card)}
                          title="Add another copy"
                        >+</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="cards-list">
              {sortedCards.map(card => {
                const owned = isOwned(card.id)
                const count = getCount(card.id)
                return (
                  <div key={card.id} className={`card-list-item${owned ? ' is-owned' : ''}`}>
                    <Link to={`/cards/${card.id}`} className="card-list-inner">
                      <img
                        src={card.images?.small || card.images?.large}
                        alt={card.name}
                        className="card-list-thumb"
                        loading="lazy"
                      />
                      <div className="card-list-info">
                        <span className="card-list-name">{card.name}</span>
                        <span className="card-list-number">#{card.number}</span>
                      </div>
                      {card.rarity && (
                        <span className="card-list-rarity">{card.rarity}</span>
                      )}
                      {card.variantCount > 0 && (
                        <span className="card-list-variant">{card.variantCount} variants</span>
                      )}
                      <span className="card-list-price">${getMockPrice(card)}</span>
                    </Link>
                    <button
                      className={`card-list-collect-btn${owned ? ' owned' : ''}`}
                      onClick={(e) => handleCollect(e, card)}
                    >
                      {owned ? `✓ Owned${count > 1 ? ` ×${count}` : ''}` : '+ Collect'}
                    </button>
                    {owned && (
                      <button
                        className="card-list-add-copy-btn"
                        onClick={(e) => handleAddCopy(e, card)}
                        title="Add another copy"
                      >+</button>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          // Sealed Products View (Mock)
          <div className="sealed-products-grid">
            {[
              { name: 'Booster Pack', price: '$4.99', image: setInfo.images?.logo },
              { name: 'Booster Box', price: '$144.99', image: setInfo.images?.logo },
              { name: 'Elite Trainer Box', price: '$49.99', image: setInfo.images?.logo },
              { name: 'Booster Bundle', price: '$29.99', image: setInfo.images?.logo },
              { name: 'Build & Battle Box', price: '$24.99', image: setInfo.images?.logo },
              { name: 'Collection Box', price: '$34.99', image: setInfo.images?.logo },
            ].map((product, idx) => (
              <div key={idx} className="sealed-product-item">
                <div className="sealed-product-image">
                  {product.image && <img src={product.image} alt={product.name} />}
                  <div className="sealed-overlay">{product.name}</div>
                </div>
                <div className="sealed-product-info">
                  <h3>{product.name}</h3>
                  <p className="sealed-price">{product.price}</p>
                  <p className="sealed-note">Price data coming soon</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
