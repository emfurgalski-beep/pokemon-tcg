import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeries, setSelectedSeries] = useState('all')
  const [sortBy, setSortBy] = useState('date-desc')

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

  // Get unique series for filter dropdown
  const allSeries = useMemo(() => {
    const seriesSet = new Set(sets.map(s => s.series).filter(Boolean))
    return ['all', ...Array.from(seriesSet).sort()]
  }, [sets])

  // Filter by search query and series
  const filteredSets = useMemo(() => {
    let result = sets

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.series?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      )
    }

    // Filter by series
    if (selectedSeries !== 'all') {
      result = result.filter(s => s.series === selectedSeries)
    }

    return result
  }, [sets, searchQuery, selectedSeries])

  // Sort sets
  const sortedSets = useMemo(() => {
    const result = [...filteredSets]

    switch (sortBy) {
      case 'date-desc':
        return result.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0)
          const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0)
          return dateB - dateA // Newest first
        })
      case 'date-asc':
        return result.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0)
          const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0)
          return dateA - dateB // Oldest first
        })
      case 'name-asc':
        return result.sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return result.sort((a, b) => b.name.localeCompare(a.name))
      case 'cards-asc':
        return result.sort((a, b) => (a.total || 0) - (b.total || 0))
      case 'cards-desc':
        return result.sort((a, b) => (b.total || 0) - (a.total || 0))
      default:
        return result
    }
  }, [filteredSets, sortBy])

  // Group by series (maintaining sort order within groups)
  const groupedBySeries = useMemo(() => {
    const map = new Map()
    for (const s of sortedSets) {
      const key = s.series || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return Array.from(map.entries())
  }, [sortedSets])

  // Sort series groups by the first set in each group
  const sortedSeriesGroups = useMemo(() => {
    return groupedBySeries.sort((a, b) => {
      const aFirstDate = a[1][0]?.releaseDate ? new Date(a[1][0].releaseDate) : new Date(0)
      const bFirstDate = b[1][0]?.releaseDate ? new Date(b[1][0].releaseDate) : new Date(0)
      return bFirstDate - aFirstDate
    })
  }, [groupedBySeries])

  function resetFilters() {
    setSearchQuery('')
    setSelectedSeries('all')
    setSortBy('date-desc')
  }

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
        <p className="subtitle">{sets.length} sets • {sortedSets.length} showing</p>
      </div>

      <div className="container">
        <div className="filters-bar">
          <input
            type="search"
            placeholder="Search sets by name, series, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <select 
            value={selectedSeries} 
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Series</option>
            {allSeries.filter(s => s !== 'all').map(series => (
              <option key={series} value={series}>{series}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="cards-desc">Most Cards</option>
            <option value="cards-asc">Least Cards</option>
          </select>

          {(searchQuery || selectedSeries !== 'all' || sortBy !== 'date-desc') && (
            <button onClick={resetFilters} className="reset-button">
              Reset Filters
            </button>
          )}
        </div>

        {sortedSeriesGroups.map(([series, list]) => (
          <section key={series} className="series-section">
            <h2 className="series-title">{series}</h2>
            
            <div className="sets-grid">
              {list.map(set => (
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
