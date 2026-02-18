import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        <div className="loading">Loading expansions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  // Group by series
  const bySeries = sets.reduce((acc, set) => {
    const series = set.series || 'Unknown'
    if (!acc[series]) acc[series] = []
    acc[series].push(set)
    return acc
  }, {})

  return (
    <div className="container">
      <div className="page-header">
        <h1>Pokemon TCG Expansions</h1>
        <p className="subtitle">{sets.length} sets available</p>
      </div>

      {Object.entries(bySeries).map(([series, seriesSets]) => (
        <div key={series} className="series-group">
          <h2 className="series-title">{series}</h2>
          
          <div className="sets-grid">
            {seriesSets.map(set => (
              <Link 
                key={set.id} 
                to={`/pokemon/expansions/${set.id}`}
                className="set-card"
              >
                <div className="set-logo-container">
                  {set.images?.logo ? (
                    <img 
                      src={set.images.logo} 
                      alt={set.name}
                      className="set-logo"
                      onError={(e) => {
                        // Fallback to text if image fails
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('no-logo')
                      }}
                    />
                  ) : (
                    <div className="set-logo-placeholder">
                      {set.id.toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="set-info">
                  <h3 className="set-name">{set.name}</h3>
                  <div className="set-meta">
                    <span className="set-count">{set.total} cards</span>
                    {set.releaseDate && (
                      <span className="set-date">
                        {new Date(set.releaseDate.replace(/\//g, '-')).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}