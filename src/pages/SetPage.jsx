import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import '../styles/set.css'

export default function SetPage() {
  const { setId } = useParams()
  const [setInfo, setSetInfo] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
      console.log('Sets loaded:', setsData.data?.length)
      
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
      
      if (!cardsResponse.ok) {
        throw new Error(cardsData.error || `HTTP ${cardsResponse.status}`)
      }
      
      setCards(cardsData.data || [])
      console.log('Cards loaded:', cardsData.data?.length)
    } catch (err) {
      console.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = cards.filter(card => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      card.name?.toLowerCase().includes(query) ||
      card.number?.toString().includes(query) ||
      card.rarity?.toLowerCase().includes(query)
    )
  })

  // Calculate type breakdown for Pokemon cards
  const typeBreakdown = useMemo(() => {
    const pokemonCards = cards.filter(c => c.supertype === 'Pokémon')
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
  }, [cards])

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
            <h3 className="breakdown-title">Type Distribution</h3>
            <div className="type-grid">
              {typeBreakdown.map(([type, count]) => (
                <div key={type} className="type-badge">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
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
          <div className="cards-count">
            {filteredCards.length} / {cards.length} cards
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

