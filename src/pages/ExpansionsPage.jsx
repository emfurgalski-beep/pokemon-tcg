import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'
import { formatDate } from '../lib/format.js'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        setLoading(true)
        const r = await fetch('/api/tcg?endpoint=sets')
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        if (alive) setSets(j.data || [])
      } catch (e) {
        if (alive) setError(String(e.message || e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sets
    return sets.filter(s =>
      String(s.name).toLowerCase().includes(q) ||
      String(s.series).toLowerCase().includes(q) ||
      String(s.id).toLowerCase().includes(q)
    )
  }, [sets, query])

  const grouped = useMemo(() => {
    // group by series, keep original (already sorted newest first)
    const map = new Map()
    for (const s of filtered) {
      const key = s.series || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="h1">Pokémon TCG Expansions</h1>
        <p className="muted">
          Browse sets like Scrydex-style. Click any expansion to view cards.
        </p>

        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expansions (name, series, id)..."
        />
      </div>

      {loading && <div className="center muted">Loading expansions…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loading && !error && grouped.map(([series, list]) => (
        <section key={series} className="series">
          <div className="series__head">
            <h2 className="h2">{series}</h2>
            <div className="series__count">{list.length}</div>
          </div>

          <div className="grid">
            {list.map(set => (
              <Link key={set.id} to={`/pokemon/expansions/${set.id}`} className="set">
                <div className="set__top">
                  <img className="set__logo" src={set.images?.logo} alt={set.name} loading="lazy" />
                </div>

                <div className="set__body">
                  <div className="set__name">{set.name}</div>
                  <div className="set__meta">
                    <span className="pill">{set.id}</span>
                    <span className="pill">{formatDate(set.releaseDate)}</span>
                    <span className="pill">{set.total} cards</span>
                  </div>
                </div>

                <div className="set__symbolWrap">
                  <img className="set__symbol" src={set.images?.symbol} alt="" loading="lazy" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
