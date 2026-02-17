import { useState } from 'react'
import useSets from '../hooks/useSets'
import SetCard from '../components/SetCard'

const styles = {
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '48px 24px',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '8px',
    letterSpacing: '-0.5px',
  },
  accent: {
    color: '#f5c842',
  },
  subtitle: {
    fontSize: '15px',
    color: '#8888a0',
  },
  search: {
    width: '100%',
    maxWidth: '400px',
    background: '#1a1d27',
    border: '1px solid #2a2d3a',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#e8e8f0',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    marginBottom: '40px',
    display: 'block',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  message: {
    textAlign: 'center',
    padding: '80px 0',
    color: '#8888a0',
    fontSize: '15px',
  },
}

function SetsPage() {
  const { sets, loading, error } = useSets()
  const [query, setQuery]        = useState('')

  const filtered = sets.filter(set =>
    set.name.toLowerCase().includes(query.toLowerCase()) ||
    set.series.toLowerCase().includes(query.toLowerCase())
  )

  if (loading) return <div style={styles.message}>Loading sets...</div>
  if (error)   return <div style={styles.message}>{error}</div>

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <h1 style={styles.title}>
          All <span style={styles.accent}>Pokemon TCG</span> Sets
        </h1>
        <p style={styles.subtitle}>
          {sets.length} sets · click any set to browse cards
        </p>
      </div>

      <input
        style={styles.search}
        type="text"
        placeholder="🔍  Search sets..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {filtered.length === 0
        ? <div style={styles.message}>No sets found for "{query}"</div>
        : <div style={styles.grid}>
            {filtered.map(set => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
      }

    </div>
  )
}

export default SetsPage