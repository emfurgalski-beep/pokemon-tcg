import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import { getMockPrice } from '../utils/price'
import { getOwned, collectCard, decrementCard, setCardCondition, countOwnedInSet } from '../utils/collection'
import { getWantList, toggleWant } from '../utils/wantlist'
import { getBinders, addCardToBinder } from '../utils/binders'
import '../styles/set.css'

const CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'D']

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
  const [viewMode, setViewMode] = useState('cards')
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [collection, setCollection] = useState(() => getOwned())
  const [wantList, setWantList] = useState(() => getWantList())
  const [binders, setBinders] = useState(() => getBinders())

  useEffect(() => {
    loadSetData()
  }, [setId])

  // Refresh binders when switching back to this page
  useEffect(() => {
    setBinders(getBinders())
  }, [])

  async function loadSetData() {
    try {
      setLoading(true)
      console.log('Loading set:', setId)

      const setsResponse = await fetch('/api/tcg?endpoint=sets')
      const setsData = await setsResponse.json()
      console.log('Sets loaded:', setsData.data?.length, 'Source:', setsData.meta?.source)

      const set = setsData.data?.find(s => s.id === setId)
      console.log('Found set:', set)
      setSetInfo(set)

      const cardsUrl = `/api/tcg?endpoint=cards&setId=${setId}`
      console.log('Fetching cards from:', cardsUrl)

      const cardsResponse = await fetch(cardsUrl)
      const cardsData = await cardsResponse.json()

      console.log('Cards response status:', cardsResponse.status)
      console.log('Cards data:', cardsData)
      console.log('API Source:', cardsData.meta?.source)
      console.log('Has Variants:', cardsData.meta?.hasVariants)

      if (!cardsResponse.ok) {
        throw new Error(cardsData.error || `HTTP ${cardsResponse.status}`)
      }

      setCards(cardsData.data || [])
      setApiSource(cardsData.meta?.source)
      setHasVariants(cardsData.meta?.hasVariants || false)
      console.log('Cards loaded:', cardsData.data?.length)
    } catch (err) {
      console.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCollect(card) {
    setCollection(collectCard(card.id, getMockPrice(card), card.name))
  }

  function handleDecrement(cardId) {
    setCollection(decrementCard(cardId))
  }

  function handleCondition(cardId, condition) {
    setCollection(setCardCondition(cardId, condition))
  }

  function handleWant(card) {
    setWantList(toggleWant(card))
  }

  function handleAddToBinder(binderId, card) {
    addCardToBinder(binderId, card)
    setBinders(getBinders())
  }

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
      const firstCard = sorted[0]
      result.push({
        ...firstCard,
        variantCount: variants.length > 1 ? variants.length : 0,
        allVariants: variants.length > 1 ? variants : null
      })
    })

    return result.sort((a, b) => {
      const numA = parseInt(a.number) || 0
      const numB = parseInt(b.number) || 0
      return numA - numB
    })
  }, [cards, showVariants, hasVariants])

  const artistList = useMemo(() => {
    const artists = new Set()
    cardsWithVariants.forEach(card => {
      if (card.artist) artists.add(card.artist)
    })
    return [...artists].sort()
  }, [cardsWithVariants])

  const filteredCards = cardsWithVariants.filter(card => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        card.name?.toLowerCase().includes(query) ||
        card.number?.toString().includes(query) ||
        card.rarity?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    if (selectedType) {
      if (!card.types?.includes(selectedType)) return false
    }

    if (selectedArtist && card.artist !== selectedArtist) return false

    return true
  })

  const sortedCards = useMemo(() => {
    const sorted = [...filteredCards]

    switch (sortBy) {
      case 'best-match':
        return sorted.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))

      case 'value-high': {
        const rarityOrder = { 'Secret Rare': 6, 'Ultra Rare': 5, 'Rare Holo': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 }
        return sorted.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0))
      }

      case 'value-low': {
        const rarityOrder = { 'Secret Rare': 6, 'Ultra Rare': 5, 'Rare Holo': 4, 'Rare': 3, 'Uncommon': 2, 'Common': 1 }
        return sorted.sort((a, b) => (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0))
      }

      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))

      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name))

      case 'number':
        return sorted.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))

      case 'number-desc':
        return sorted.sort((a, b) => (parseInt(b.number) || 0) - (parseInt(a.number) || 0))

      case 'cards-own':
        return sorted.sort((a, b) => (collection[b.id] ? 1 : 0) - (collection[a.id] ? 1 : 0))

      case 'cards-not-own':
        return sorted.sort((a, b) => (collection[a.id] ? 1 : 0) - (collection[b.id] ? 1 : 0))

      case 'wanted':
        return sorted.sort((a, b) => (wantList[b.id] ? 1 : 0) - (wantList[a.id] ? 1 : 0))

      default:
        return sorted
    }
  }, [filteredCards, sortBy, collection, wantList])

  const typeBreakdown = useMemo(() => {
    const pokemonCards = cardsWithVariants.filter(c => c.supertype === 'Pokémon')
    const breakdown = {}
    pokemonCards.forEach(card => {
      if (card.types && card.types.length > 0) {
        card.types.forEach(type => {
          breakdown[type] = (breakdown[type] || 0) + 1
        })
      }
    })
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [cardsWithVariants])

  if (loading) return <div className="loading">Loading set...</div>
  if (error) return <div className="error">Error: {error}</div>
  if (!setInfo) return <div className="error">Set not found</div>

  const binderList = Object.values(binders)

  return (
    <div className="set-page">
      {/* Set Header */}
      <div className="set-header">
        <div className="container">
          <Breadcrumbs items={[
            { label: 'Expansions', to: '/expansions' },
            { label: setInfo.name }
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
              {(() => {
                const ownedCount = countOwnedInSet(setId, collection)
                const pct = Math.min(100, Math.round((ownedCount / setInfo.total) * 100))
                return ownedCount > 0 ? (
                  <div className="set-collection-progress">
                    <span className="set-collection-label">Collection: {ownedCount} / {setInfo.total} ({pct}%)</span>
                    <div className="set-progress-bar">
                      <div className="set-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null
              })()}
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
            {artistList.length > 0 && (
              <div className="sort-dropdown">
                <label htmlFor="artist-select" className="sort-label">Artist</label>
                <select
                  id="artist-select"
                  value={selectedArtist || ''}
                  onChange={(e) => setSelectedArtist(e.target.value || null)}
                  className="sort-select"
                >
                  <option value="">All Artists</option>
                  {artistList.map(artist => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </select>
              </div>
            )}
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
                <option value="wanted">My Want List First</option>
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
          ) : (
            <div className="cards-grid">
              {sortedCards.map(card => {
                const entry = collection[card.id]
                const wanted = !!wantList[card.id]
                return (
                  <div
                    key={card.id}
                    className={`card-item${entry ? ' owned' : ''}${wanted ? ' wanted' : ''}`}
                  >
                    <Link to={`/cards/${card.id}`} className="card-image-wrapper">
                      <img
                        src={card.images?.small || card.images?.large}
                        alt={card.name}
                        className="card-image"
                        loading="lazy"
                      />
                      <div className="card-price-badge">${getMockPrice(card)}</div>
                      {entry && (
                        <div className="owned-badge">✓ {entry.qty}×</div>
                      )}
                      {card.variantCount > 0 && (
                        <div className="variant-badge">{card.variantCount} variants</div>
                      )}
                    </Link>
                    <div className="card-item-info">
                      <Link to={`/cards/${card.id}`} className="card-item-name-link">
                        <div className="card-item-name">{card.name}</div>
                        <div className="card-item-meta">
                          <span className="card-number">#{card.number}</span>
                          {card.rarity && <span className="card-rarity">{card.rarity}</span>}
                        </div>
                      </Link>
                      <div className="card-item-actions">
                        {entry ? (
                          <div className="qty-row">
                            <button className="qty-btn" onClick={() => handleDecrement(card.id)}>−</button>
                            <span className="qty-value">{entry.qty}×</span>
                            <button className="qty-btn" onClick={() => handleCollect(card)}>+</button>
                            <select
                              value={entry.condition}
                              onChange={(e) => handleCondition(card.id, e.target.value)}
                              className="condition-select"
                            >
                              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        ) : (
                          <button className="collect-btn" onClick={() => handleCollect(card)}>+ Collect</button>
                        )}
                        <div className="card-meta-actions">
                          <button
                            className={`want-btn${wanted ? ' wanted' : ''}`}
                            onClick={() => handleWant(card)}
                            title={wanted ? 'Remove from Want List' : 'Add to Want List'}
                          >
                            {wanted ? '♥' : '♡'}
                          </button>
                          {binderList.length > 0 && (
                            <select
                              value=""
                              onChange={(e) => { if (e.target.value) handleAddToBinder(e.target.value, card) }}
                              className="binder-select"
                              title="Add to Binder"
                            >
                              <option value="">📚</option>
                              {binderList.map(b => {
                                const inBinder = b.cards.some(c => c.id === card.id)
                                return (
                                  <option key={b.id} value={b.id} disabled={inBinder}>
                                    {inBinder ? '✓ ' : ''}{b.name}
                                  </option>
                                )
                              })}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
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
