import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import BackButton from '../components/BackButton'
import '../styles/search-results.css'

export default function ArtistPage() {
  const { artistName } = useParams()
  const artist = decodeURIComponent(artistName)

  const [searchIndex, setSearchIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/tcg?endpoint=searchIndex')
      .then(r => r.json())
      .then(data => {
        setSearchIndex(data.data || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const cards = useMemo(() => {
    if (!searchIndex) return []
    return searchIndex.filter(c => c.artist?.toLowerCase() === artist.toLowerCase())
  }, [searchIndex, artist])

  const setCount = useMemo(() => new Set(cards.map(c => c.setId)).size, [cards])

  if (loading) return (
    <div className="search-results-page">
      <div className="container">
        <div className="loading">Loading cards by {artist}…</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="search-results-page">
      <div className="container">
        <p className="error-message">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="search-results-page">
      <div className="container">
        <Breadcrumbs items={[
          { label: 'Expansions', to: '/expansions' },
          { label: `Artist: ${artist}` },
        ]} />

        <BackButton fallbackPath="/expansions" label="Back" />

        <div className="search-header">
          <h1>✦ {artist}</h1>
          <p className="search-query">
            <strong>{cards.length}</strong> card{cards.length !== 1 ? 's' : ''} across <strong>{setCount}</strong> set{setCount !== 1 ? 's' : ''}
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="no-results">
            <h2>No cards found</h2>
            <p>No cards illustrated by this artist in the index yet.</p>
          </div>
        ) : (
          <div className="results-grid">
            {cards.map((card, idx) => (
              <Link
                key={`${card.id}-${idx}`}
                to={`/cards/${card.id}`}
                className="result-card"
              >
                <div className="result-card-image-wrapper">
                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.name}
                      className="result-card-image"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="result-card-info">
                  <h3 className="result-card-name">{card.name}</h3>
                  <p className="result-card-meta">
                    {card.setName} · #{card.number}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
