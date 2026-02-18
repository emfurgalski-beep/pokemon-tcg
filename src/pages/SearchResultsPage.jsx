import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../styles/search-results.css'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    searchCards()
  }, [query])

  async function searchCards() {
    try {
      setLoading(true)
      setError(null)
      
      // Get all sets
      const setsResponse = await fetch('/api/tcg?endpoint=sets')
      const setsData = await setsResponse.json()
      const sets = setsData.data || []

      // Search through all sets
      const allResults = []
      const searchQuery = query.toLowerCase()

      for (const set of sets) {
        try {
          const cardsResponse = await fetch(`/api/tcg?endpoint=cards&setId=${set.id}`)
          const cardsData = await cardsResponse.json()
          const cards = cardsData.data || []

          // Filter cards matching query
          const matchingCards = cards.filter(card =>
            card.name?.toLowerCase().includes(searchQuery) ||
            card.number?.toString().includes(searchQuery)
          )

          // Add to results with set info
          matchingCards.forEach(card => {
            allResults.push({
              ...card,
              setName: set.name,
              setId: set.id
            })
          })
        } catch (error) {
          console.error(`Failed to search set ${set.id}:`, error)
        }
      }

      setResults(allResults)
    } catch (err) {
      console.error('Search error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="container">
          <h1>Searching for "{query}"...</h1>
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="search-results-page">
        <div className="container">
          <h1>Search Error</h1>
          <p className="error-message">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results-page">
      <div className="container">
        <div className="search-header">
          <h1>Search Results</h1>
          <p className="search-query">
            Found <strong>{results.length}</strong> cards matching "<strong>{query}</strong>"
          </p>
        </div>

        {results.length === 0 ? (
          <div className="no-results">
            <h2>No cards found</h2>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((card, idx) => (
              <Link
                key={`${card.id}-${idx}`}
                to={`/cards/${card.id}`}
                className="result-card"
              >
                <div className="result-card-image-wrapper">
                  {card.images?.small && (
                    <img
                      src={card.images.small}
                      alt={card.name}
                      className="result-card-image"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="result-card-info">
                  <h3 className="result-card-name">{card.name}</h3>
                  <p className="result-card-meta">
                    {card.setName} • #{card.number}
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
