import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        setLoading(true)
        setError('')
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
    load()
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
      <div className="pageHead">
        <div>
          <h1 className="h1">Expansions</h1>
          <div className="muted">
            {loading ? 'Loading…' : `${filtered.length} / ${sets.length} sets`}
          </div>
        </div>

        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expansions (name, series, id)…"
        />
      </div>

      {loading && <div className="center muted">Loading sets…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loading && !error && grouped.map(([series, list]) => (
        <section className="series" key={series}>
          <div className="seriesHead">
            <h2 className="seriesTitle">{series}</h2>
            <span className="pill">{list.length}</span>
          </div>

          <div className="grid">
            {list.map(set => (
              <Link key={set.id} to={`/pokemon/expansions/${set.id}`} className="setCard">
                <div className="setTop">
                  <img className="setLogo" src={set.images?.logo} alt={set.name} loading="lazy" />
                </div>

                <div className="setBody">
                  <div className="setName">{set.name}</div>
                  <div className="setMeta">
                    <span className="pill">{set.id}</span>
                    <span className="pill">{set.releaseDate}</span>
                    <span className="pill">{set.total} cards</span>
                  </div>
                </div>

                <div className="setSymbolWrap">
                  <img className="setSymbol" src={set.images?.symbol} alt="" loading="lazy" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
