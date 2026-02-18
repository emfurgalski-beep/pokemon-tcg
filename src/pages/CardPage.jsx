import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import '../styles/card.css'

export default function CardPage() {
  const { cardId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const variant = searchParams.get('variant') || 'normal'

  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        setLoading(true)
        setError('')
        setCard(null)

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

    load()
    return () => { alive = false }
  }, [cardId])

  const setId = card?.set?.id
  const setName = card?.set?.name

  const facts = useMemo(() => {
    if (!card) return []
    const out = []
    out.push(['Card ID', card.id])
    if (setName) out.push(['Set', `${setName} (${setId})`])
    if (card.number) out.push(['Number', `#${card.number}`])
    if (card.rarity) out.push(['Rarity', card.rarity])
    if (card.supertype) out.push(['Supertype', card.supertype])
    if (card.subtypes?.length) out.push(['Subtypes', card.subtypes.join(', ')])
    if (card.types?.length) out.push(['Types', card.types.join(', ')])
    if (card.hp) out.push(['HP', String(card.hp)])
    if (card.artist) out.push(['Artist', card.artist])
    if (card.evolvesFrom) out.push(['Evolves from', card.evolvesFrom])
    if (card.rules?.length) out.push(['Rules', card.rules.join(' • ')])
    return out
  }, [card, setName, setId])

  function setVariant(next) {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.set('variant', next)
      return p
    })
  }

  const breadcrumbItems = [
    { label: 'Expansions', to: '/pokemon/expansions' }
  ]
  if (setId && setName) {
    breadcrumbItems.push({ label: setName, to: `/pokemon/expansions/${setId}` })
  }
  if (card) {
    breadcrumbItems.push({ label: card.name })
  }

  return (
    <main className="page">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="cardHead">
        <div className="variantTabs" role="tablist" aria-label="Variant">
          <button className={`tab ${variant === 'normal' ? 'tabActive' : ''}`} onClick={() => setVariant('normal')}>
            Normal
          </button>
          <button className={`tab ${variant === 'holo' ? 'tabActive' : ''}`} onClick={() => setVariant('holo')}>
            Holo
          </button>
          <button className={`tab ${variant === 'reverse' ? 'tabActive' : ''}`} onClick={() => setVariant('reverse')}>
            Reverse
          </button>
        </div>

        <span className="pill">variant: {variant}</span>
      </div>

      {loading && <div className="center muted">Loading card…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loading && !error && card && (
        <div className="cardLayout">
          {/* LEFT */}
          <section className="cardPanel">
            <div className="cardImgWrap">
              <div className="cardImgFrame">
                <img className="cardImg" src={card.images?.large || card.images?.small} alt={card.name} />
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="cardPanel">
            <div className="cardInfo">
              <h1 className="cardTitle">{card.name}</h1>

              <div className="cardSub">
                {setName && <span>{setName}</span>}
                {card.number && <><span>•</span><span>#{card.number}</span></>}
                {card.rarity && <><span>•</span><span>{card.rarity}</span></>}
              </div>

              <div className="factGrid">
                {facts.map(([k, v]) => (
                  <div className="fact" key={k}>
                    <div className="factLabel">{k}</div>
                    <div className="factValue">{v}</div>
                  </div>
                ))}
              </div>

              <div className="cardActions">
                {setId && (
                  <Link className="btn btnAccent" to={`/pokemon/expansions/${setId}`}>
                    View all cards in set
                  </Link>
                )}
                <Link className="btn" to="/pokemon/expansions">
                  Browse expansions
                </Link>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
