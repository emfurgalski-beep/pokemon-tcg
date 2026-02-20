import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import '../styles/search-results.css'

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchIndex, setSearchIndex] = useState(null)

  // Load search index once on mount
  useEffect(() => {
    loadSearchIndex()
  }, [])

  // Search locally when query changes
  useEffect(() => {
    if (!searchIndex || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    performLocalSearch()
  }, [query, searchIndex])

  async function loadSearchIndex() {
    try {
      console.log('[Search] Loading search index...')
      const startTime = Date.now()
      
      const response = await fetch('/api/tcg?endpoint=searchIndex')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load search index')
      }
      
      const duration = Date.now() - startTime
      console.log(`[Search] Index loaded: ${data.data.length} cards in ${duration}ms`)
      
      setSearchIndex(data.data)
    } catch (err) {
      console.error('Failed to load search index:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  function performLocalSearch() {
    const searchQuery = query.toLowerCase().trim()
    
    console.log(`[Search] Searching locally for: "${searchQuery}"`)
    const startTime = Date.now()
    
    const filtered = searchIndex.filter(card =>
      card.name.includes(searchQuery) ||
      card.number.includes(searchQuery)
    )
    
    const duration = Date.now() - startTime
    console.log(`[Search] Found ${filtered.length} results in ${duration}ms`)
    
    setResults(filtered.slice(0, 100)) // Limit to 100 results
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="search-results-page">
        <div className="container">
          <h1>{searchIndex ? `Searching for "${query}"...` : 'Loading search index...'}</h1>
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
        <BackButton fallbackPath="/expansions" label="Back" />

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
