import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { slugify } from '../lib/slug'

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
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <Link to="/pokemon/expansions" style={{ opacity: 0.8, fontWeight: 700, textDecoration: 'none' }}>
            ← Back to expansions
          </Link>
          <h1 style={{ margin: '10px 0 6px' }}>Set: {setId}</h1>
          <div style={{ opacity: 0.8 }}>
            {loading ? 'Loading…' : `${filtered.length} / ${cards.length} cards`}
          </div>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards (name, number, rarity)…"
          style={{
            width: '100%',
            maxWidth: 520,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #2a2d3a',
            background: '#12151e',
            color: '#e8e8f0',
            outline: 'none'
          }}
        />
      </div>

      {loading && <div>Loading cards…</div>}
      {error && <div style={{ color: '#ff9090' }}>Error: {error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 14 }}>
          {filtered.map(card => {
            const slug = slugify(card.name)
            return (
              <Link
                key={card.id}
                to={`/pokemon/cards/${slug}/${card.id}?variant=normal`}
                style={{
                  display: 'block',
                  border: '1px solid #2a2d3a',
                  borderRadius: 14,
                  background: '#171b26',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <div style={{ background: '#0f1117', borderBottom: '1px solid #2a2d3a', padding: 10, display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={card.images?.small}
                    alt={card.name}
                    loading="lazy"
                    style={{ width: '100%', height: 180, objectFit: 'contain' }}
                  />
                </div>

                <div style={{ padding: '10px 10px 12px' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{card.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, opacity: 0.85, fontSize: 12 }}>
                    <span>#{card.number}</span>
                    {card.rarity && <span>• {card.rarity}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
