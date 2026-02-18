import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadSets()
  }, [])

  async function loadSets() {
    try {
      setLoading(true)
      const response = await fetch('/api/tcg?endpoint=sets')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load sets')
      }
      
      setSets(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredSets = sets.filter(set => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      set.name?.toLowerCase().includes(query) ||
      set.series?.toLowerCase().includes(query) ||
      set.id?.toLowerCase().includes(query)
    )
  })

  // Sort by release date (newest first)
  const sortedSets = [...filteredSets].sort((a, b) => {
    const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0)
    const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0)
    return dateB - dateA // Newest first
  })

  // Group by series (maintaining date order within groups)
  const groupedBySeries = sortedSets.reduce((acc, set) => {
    const series = set.series || 'Other'
    if (!acc[series]) acc[series] = []
    acc[series].push(set)
    return acc
  }, {})

  // Sort series groups by the newest set in each series
  const seriesWithNewestDate = Object.entries(groupedBySeries).map(([series, sets]) => {
    const newestDate = sets[0]?.releaseDate ? new Date(sets[0].releaseDate) : new Date(0)
    return { series, sets, newestDate }
  })

  const sortedSeriesGroups = seriesWithNewestDate.sort((a, b) => b.newestDate - a.newestDate)

  if (loading) {
    return <div className="loading">Loading expansions...</div>
  }

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <div className="expansions-page">
      <div className="expansions-hero">
        <h1>Pokemon TCG Expansions</h1>
        <p className="subtitle">{sets.length} sets • {filteredSets.length} showing</p>
      </div>

      <div className="container">
        <div className="search-bar">
          <input
            type="search"
            placeholder="Search sets by name, series, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {sortedSeriesGroups.map(({ series, sets: seriesSets }) => (
          <section key={series} className="series-section">
            <h2 className="series-title">{series}</h2>
            
            <div className="sets-grid">
              {seriesSets.map(set => (
                <Link 
                  key={set.id} 
                  to={`/expansions/${set.id}`}
                  className="set-card"
                >
                  <div className="set-logo-wrapper">
                    {set.images?.logo ? (
                      <img 
                        src={set.images.logo}
                        alt={set.name}
                        className="set-logo"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextElementSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="set-logo-placeholder" 
                      style={{ display: set.images?.logo ? 'none' : 'flex' }}
                    >
                      {set.id.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="set-info">
                    <h3 className="set-name">{set.name}</h3>
                    <div className="set-meta">
                      <span className="meta-item">{set.total} cards</span>
                      {set.releaseDate && (
                        <span className="meta-item">{set.releaseDate}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
