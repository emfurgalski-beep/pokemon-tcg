import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../styles/set.css'
import { slugify } from '../lib/slug.js'

export default function SetPage() {
  const { setId } = useParams()

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        setLoading(true)
        setError('')
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
    run()
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
          <div className="breadcrumb">
            <Link to="/pokemon/expansions" className="breadcrumb__link">← Expansions</Link>
          </div>
          <h1 className="h1">Set: <span className="accent">{setId}</span></h1>
          <p className="muted">{cards.length} cards</p>
        </div>

        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards (name, number, rarity)..."
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
                <div className="miniCard__imgWrap">
                  <img className="miniCard__img" src={card.images?.small} alt={card.name} loading="lazy" />
                </div>
                <div className="miniCard__body">
                  <div className="miniCard__name">{card.name}</div>
                  <div className="miniCard__meta">
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
