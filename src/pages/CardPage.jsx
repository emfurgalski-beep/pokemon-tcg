import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import '../styles/card.css'

export default function CardPage() {
  const { cardId } = useParams()
  const [searchParams] = useSearchParams()
  const variant = searchParams.get('variant') || 'normal'

  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    async function run() {
      try {
        setLoading(true)
        setError('')
        const r = await fetch(`/api/tcg?endpoint=card&id=${encodeURIComponent(cardId)}`)
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        if (alive) setCard(j.data)
      } catch (e) {
        if (alive) setError(String(e.message || e))
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => { alive = false }
  }, [cardId])

  const setId = card?.set?.id

  const facts = useMemo(() => {
    if (!card) return []
    const out = []
    out.push(['ID', card.id])
    out.push(['Set', `${card.set?.name || ''} (${card.set?.id || ''})`])
    out.push(['Number', card.number])
    if (card.rarity) out.push(['Rarity', card.rarity])
    if (card.artist) out.push(['Artist', card.artist])
    if (card.supertype) out.push(['Supertype', card.supertype])
    if (card.subtypes?.length) out.push(['Subtypes', card.subtypes.join(', ')])
    if (card.types?.length) out.push(['Types', card.types.join(', ')])
    if (card.hp) out.push(['HP', String(card.hp)])
    if (card.level) out.push(['Level', String(card.level)])
    if (card.evolvesFrom) out.push(['Evolves from', card.evolvesFrom])
    if (card.evolvesTo?.length) out.push(['Evolves to', card.evolvesTo.join(', ')])
    if (card.rules?.length) out.push(['Rules', card.rules.join(' · ')])
    return out
  }, [card])

  return (
    <main className="page">
      <div className="cardHead">
        <Link to={setId ? `/pokemon/expansions/${setId}` : '/pokemon/expansions'} className="breadcrumb__link">
          ← Back to set
        </Link>

        <div className="cardHead__right">
          <div className="pill">variant: {variant}</div>
        </div>
      </div>

      {loading && <div className="center muted">Loading card…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loading && !error && card && (
        <div className="cardLayout">
          <section className="cardLeft">
            <div className="cardImageWrap">
              <img className="cardImage" src={card.images?.large} alt={card.name} />
            </div>
          </section>

          <section className="cardRight">
            <div className="cardTitle">
              <h1 className="h1">{card.name}</h1>
              <div className="muted">{card.set?.name} • #{card.number}</div>
            </div>

            <div className="facts">
              {facts.map(([k, v]) => (
                <div className="fact" key={k}>
                  <div className="fact__k">{k}</div>
                  <div className="fact__v">{v}</div>
                </div>
              ))}
            </div>

            <div className="actions">
              {setId && (
                <Link className="btn" to={`/pokemon/expansions/${setId}`}>
                  View all cards in set
                </Link>
              )}
              <Link className="btn btn--ghost" to="/pokemon/expansions">
                Browse expansions
              </Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
