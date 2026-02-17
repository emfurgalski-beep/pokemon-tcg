import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../styles/expansions.css' // użyjemy podobnych klas + minimalnie

export default function SetPage() {
  const { setId } = useParams()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        const r = await fetch(`/api/cards?setId=${encodeURIComponent(setId)}`)
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`)
        setCards(json.data || [])
      } catch (e) {
        setErr(String(e.message || e))
      } finally {
        setLoading(false)
      }
    })()
  }, [setId])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return cards
    return cards.filter(c =>
      (c.name || '').toLowerCase().includes(query) ||
      String(c.number || '').toLowerCase().includes(query)
    )
  }, [cards, q])

  return (
    <div className="container">
      <div className="expHeader">
        <div>
          <h1 className="h1">Set: {setId}</h1>
          <p className="p">{cards.length} cards</p>
        </div>
        <span className="badge">EN data</span>
      </div>

      <div className="expControls">
        <input
          className="input"
          placeholder="Search cards… (name / number)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && <div className="expMessage">Loading…</div>}
      {err && <div className="expMessage">Error: {err}</div>}

      {!loading && !err && (
        <div className="expGrid">
          {filtered.map(card => {
            const slug = (card.name || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'')
            return (
              <Link
                key={card.id}
                to={`/cards/${slug}/${card.id}?variant=normal`}
                className="expCard"
              >
                <div className="expLogoWrap" style={{height: 180}}>
                  <img
                    className="expLogo"
                    src={card.images?.small}
                    alt={card.name}
                    loading="lazy"
                    style={{maxHeight: 160}}
                  />
                </div>
                <div className="expMeta">
                  <div className="expName">{card.name}</div>
                  <div className="expSub">
                    <span>#{card.number}</span><span className="dot" />
                    <span>{card.rarity || '—'}</span>
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
