import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/global-search.css'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search across all sets
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setLoading(true)
        
        // Get all sets
        const setsResponse = await fetch('/api/tcg?endpoint=sets')
        const setsData = await setsResponse.json()
        const sets = setsData.data || []

        // Search through each set's cards
        const allResults = []
        const searchQuery = query.toLowerCase()

        // Limit to first 5 sets for performance (can search all if needed)
        const setsToSearch = sets.slice(0, 10)

        for (const set of setsToSearch) {
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

            // Limit total results to 20
            if (allResults.length >= 20) break
          } catch (error) {
            console.error(`Failed to search set ${set.id}:`, error)
          }
        }

        setResults(allResults.slice(0, 20))
        setShowResults(true)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(searchTimeout)
  }, [query])

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="global-search-input"
        />
        {loading && <div className="search-spinner" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results-dropdown">
          {results.map((card, idx) => (
            <Link
              key={`${card.id}-${idx}`}
              to={`/cards/${card.id}`}
              className="search-result-item"
              onClick={() => {
                setShowResults(false)
                setQuery('')
              }}
            >
              {card.images?.small && (
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="search-result-image"
                />
              )}
              <div className="search-result-info">
                <div className="search-result-name">{card.name}</div>
                <div className="search-result-meta">
                  {card.setName} • #{card.number}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="search-results-dropdown">
          <div className="search-no-results">
            No cards found for "{query}"
          </div>
        </div>
      )}
    </div>
  )
}
