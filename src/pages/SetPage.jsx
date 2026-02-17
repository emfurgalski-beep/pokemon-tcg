import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { slugify } from '../lib/slug'
import '../styles/set.css'

export default function SetPage() {
  const { setId } = useParams()

  const [cards, setCards] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        setCards([])

        const r = await fetch(`/api/tcg?endpoint=cards&setId=${encodeURIComponent(setId)}`)
        const j = await r.json()

        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        if (alive) setCards(j.data || [])
      } catch (e) {
        if (alive) setError(String(e.message || e))
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    return () => { alive = false }
  }, [setId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter(c =>
      String(c.name).toLowerCase().includes(q) ||
      String(c.number).toLowerCase().includes(q) ||
      String(c.rarity || '').toLowerCase().includes(q)
    )
  }, [cards, query])

  return (
    <main className="page">
      <div className="setHead">
        <div>
          <Link to="/pokemon/expansions" className="breadcrumbLink">← Back to expansions</Link>
          <h1 className="h1" style={{ marginTop: 10 }}>Set: <span className="accent">{setId}</span></h1>
          <div className="muted">
            {loading ? 'Loading…' : `${filtered.length} / ${cards.length} cards`}
          </div>
        </div>

        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards (name, number, rarity)…"
        />
      </div>

      {loading && <div className="center muted">Loading cards…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loading && !error && (
        <div className="cardGrid">
          {filtered.map(card => {
            const slug = slugify(card.name)
            return (
              <Link
                key={card.id}
                className="miniCard"
                to={`/pokemon/cards/${slug}/${card.id}?variant=normal`}
              >
                <div className="miniImgWrap">
                  <img className="miniImg" src={card.images?.small} alt={card.name} loading="lazy" />
                </div>

                <div className="miniBody">
                  <div className="miniName">{card.name}</div>
                  <div className="miniMeta">
                    <span className="pill">#{card.number}</span>
                    {card.rarity && <span className="pill">{card.rarity}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
