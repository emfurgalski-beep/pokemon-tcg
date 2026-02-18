import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('all')

  useEffect(() => {
    fetch('/api/tcg?endpoint=sets')
      .then(r => r.json())
      .then(data => {
        setSets(data.data || [])
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading expansions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Error Loading Sets</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // Get unique series for filter
  const allSeries = [...new Set(sets.map(s => s.series))].sort()

  // Filter sets
  const filtered = sets.filter(set => {
    const matchesSearch = !searchQuery || 
      set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSeries = selectedSeries === 'all' || set.series === selectedSeries

    return matchesSearch && matchesSeries
  })

  return (
    <div className="expansions-page">
      <div className="expansions-hero">
        <h1>Pokemon TCG Sets</h1>
        <p className="subtitle">{sets.length} sets • {filtered.length} showing</p>
      </div>

      <div className="expansions-controls">
        <input
          type="search"
          placeholder="Search sets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select 
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          className="series-select"
        >
          <option value="all">All Series</option>
          {allSeries.map(series => (
            <option key={series} value={series}>{series}</option>
          ))}
        </select>
      </div>

      <div className="sets-grid">
        {filtered.map(set => (
          <Link 
            key={set.id} 
            to={`/pokemon/expansions/${set.id}`}
            className="set-card-modern"
          >
            <div className="set-image-wrapper">
              {set.images?.logo ? (
                <img 
                  src={set.images.logo}
                  alt={set.name}
                  className="set-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const placeholder = e.target.nextElementSibling
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className="set-image-placeholder" style={{ display: set.images?.logo ? 'none' : 'flex' }}>
                <span className="set-code">{set.id.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="set-details">
              <h3 className="set-title">{set.name}</h3>
              <div className="set-meta-row">
                <span className="set-series">{set.series}</span>
                <span className="set-count">{set.total} cards</span>
              </div>
              {set.releaseDate && (
                <div className="set-release">
                  {new Date(set.releaseDate.replace(/\//g, '-')).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="no-results">
          <p>No sets found matching your search.</p>
        </div>
      )}
    </div>
  )
}