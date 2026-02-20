import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import '../styles/set.css'

export default function SetPage() {
  const { setId } = useParams()
  const [setInfo, setSetInfo] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState(null)
  const [showVariants, setShowVariants] = useState(false)
  const [apiSource, setApiSource] = useState(null)
  const [hasVariants, setHasVariants] = useState(false)

  useEffect(() => {
    loadSetData()
  }, [setId])

  async function loadSetData() {
    try {
      setLoading(true)
      console.log('Loading set:', setId)
      
      // Load set info
      const setsResponse = await fetch('/api/tcg?endpoint=sets')
      const setsData = await setsResponse.json()
      console.log('Sets loaded:', setsData.data?.length, 'Source:', setsData.meta?.source)
      
      const set = setsData.data?.find(s => s.id === setId)
      console.log('Found set:', set)
      setSetInfo(set)

      // Load cards
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

  // Group cards by name+number to detect variants
  const cardsWithVariants = useMemo(() => {
    if (showVariants || !hasVariants) {
      // Show all cards individually if variants toggled on OR source doesn't have variants
      return cards.map(card => ({ ...card, variantCount: 0 }))
    }

    // Group by name + number (pokemontcg.io has duplicate name+number for variants)
    const grouped = new Map()
    cards.forEach(card => {
      const key = `${card.name}-${card.number}`
      
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key).push(card)
    })

    // Return first card from each group with variant count
    const result = []
    grouped.forEach(variants => {
      // Sort variants by ID to get consistent first card
      const sorted = variants.sort((a, b) => a.id.localeCompare(b.id))
      
      const firstCard = sorted[0]
      result.push({
        ...firstCard,
        variantCount: variants.length > 1 ? variants.length : 0,
        allVariants: variants.length > 1 ? variants : null
      })
    })

    // Sort result by number
    return result.sort((a, b) => {
      const numA = parseInt(a.number) || 0
      const numB = parseInt(b.number) || 0
      return numA - numB
    })
  }, [cards, showVariants, hasVariants])

  const filteredCards = cardsWithVariants.filter(card => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        card.name?.toLowerCase().includes(query) ||
        card.number?.toString().includes(query) ||
        card.rarity?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }

    // Filter by selected type
    if (selectedType) {
      const hasType = card.types?.includes(selectedType)
      if (!hasType) return false
    }

    return true
  })

  // Calculate type breakdown for Pokemon cards
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

    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 8) // Top 8 types
  }, [cardsWithVariants])

  if (loading) {
    return <div className="loading">Loading set...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  if (!setInfo) {
    return <div className="error">Set not found</div>
  }

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
            </div>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="container">
        {/* Type Breakdown */}
        {typeBreakdown.length > 0 && (
          <div className="type-breakdown">
            <div className="breakdown-header">
              <h3 className="breakdown-title">Type Distribution</h3>
              {selectedType && (
                <button 
                  onClick={() => setSelectedType(null)} 
                  className="clear-type-button"
                >
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

        <div className="cards-controls">
          <input
            type="search"
            placeholder="Search cards by name, number, or rarity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <div className="cards-controls-right">
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
              {filteredCards.length} / {cardsWithVariants.length} cards
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

        {filteredCards.length === 0 ? (
          <div className="no-cards">No cards found</div>
        ) : (
          <div className="cards-grid">
            {filteredCards.map(card => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="card-item"
              >
                <div className="card-image-wrapper">
                  <img
                    src={card.images?.small || card.images?.large}
                    alt={card.name}
                    className="card-image"
                    loading="lazy"
                  />
                  {card.variantCount > 0 && (
                    <div className="variant-badge">
                      {card.variantCount} variants
                    </div>
                  )}
                </div>
                <div className="card-item-info">
                  <div className="card-item-name">{card.name}</div>
                  <div className="card-item-meta">
                    <span className="card-number">#{card.number}</span>
                    {card.rarity && (
                      <span className="card-rarity">{card.rarity}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

