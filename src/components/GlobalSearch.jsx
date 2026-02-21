import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/global-search.css'

// Module-level cache so index is fetched only once per session
let _indexCache = null
let _indexPromise = null

function loadIndex() {
  if (_indexCache) return Promise.resolve(_indexCache)
  if (_indexPromise) return _indexPromise
  _indexPromise = fetch('/api/tcg?endpoint=searchIndex')
    .then(r => r.json())
    .then(d => { _indexCache = d.data || []; return _indexCache })
  return _indexPromise
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [cardResults, setCardResults] = useState([])
  const [artistResults, setArtistResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      setShowResults(false)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
    if (e.key === 'Escape') {
      setShowResults(false)
    }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setCardResults([])
      setArtistResults([])
      setShowResults(false)
      return
    }

    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const index = await loadIndex()
        const q = query.toLowerCase().trim()

        // Artist matches — collect unique artists
        const artistMap = {}
        index.forEach(c => {
          if (c.artist && c.artist.toLowerCase().includes(q)) {
            artistMap[c.artist] = (artistMap[c.artist] || 0) + 1
          }
        })
        const artists = Object.entries(artistMap)
          .map(([name, count]) => ({ name, count }))
          .slice(0, 3)

        // Card matches — by name or number
        const cards = index
          .filter(c => c.name.includes(q) || c.number.includes(q))
          .slice(0, 12)

        setArtistResults(artists)
        setCardResults(cards)
        setShowResults(true)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => clearTimeout(t)
  }, [query])

  function closeAndClear() {
    setShowResults(false)
    setQuery('')
  }

  const hasResults = artistResults.length > 0 || cardResults.length > 0

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="search"
          placeholder="Search cards or artists..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="global-search-input"
        />
        {loading && <div className="search-spinner" />}
      </div>

      {showResults && (hasResults || (!loading && query.length >= 2)) && (
        <div className="search-results-dropdown">
          {/* Artist results */}
          {artistResults.length > 0 && (
            <>
              <div className="search-section-label">Artists</div>
              {artistResults.map(a => (
                <Link
                  key={a.name}
                  to={`/artist/${encodeURIComponent(a.name)}`}
                  className="search-artist-item"
                  onClick={closeAndClear}
                >
                  <span className="search-artist-icon">✦</span>
                  <div className="search-artist-info">
                    <div className="search-artist-name">{a.name}</div>
                    <div className="search-artist-count">{a.count} card{a.count !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="search-artist-arrow">→</span>
                </Link>
              ))}
            </>
          )}

          {/* Card results */}
          {cardResults.length > 0 && (
            <>
              {artistResults.length > 0 && <div className="search-section-label">Cards</div>}
              {cardResults.map((card, idx) => (
                <Link
                  key={`${card.id}-${idx}`}
                  to={`/cards/${card.id}`}
                  className="search-result-item"
                  onClick={closeAndClear}
                >
                  {card.image && (
                    <img src={card.image} alt={card.name} className="search-result-image" />
                  )}
                  <div className="search-result-info">
                    <div className="search-result-name">{card.name}</div>
                    <div className="search-result-meta">
                      {card.setName} · #{card.number}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {!hasResults && !loading && (
            <div className="search-no-results">No results for "{query}"</div>
          )}
        </div>
      )}
    </div>
  )
}
