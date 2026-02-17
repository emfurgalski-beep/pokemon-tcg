import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

export default function CardPage() {
  const { cardId } = useParams()
  const [searchParams] = useSearchParams()
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

  const facts = useMemo(() => {
    if (!card) return []

    const out = []
    out.push(['Card ID', card.id])
    if (card.set?.name) out.push(['Set', `${card.set.name} (${card.set.id})`])
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
  }, [card])

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link
          to={setId ? `/pokemon/expansions/${setId}` : '/pokemon/expansions'}
          style={{ opacity: 0.85, fontWeight: 700, textDecoration: 'none' }}
        >
          ← Back to set
        </Link>

        <div style={{
          border: '1px solid #2a2d3a',
          background: '#0f1117',
          padding: '6px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 800,
          opacity: 0.9
        }}>
          variant: {variant}
        </div>
      </div>

      {loading && <div>Loading card…</div>}
      {error && <div style={{ color: '#ff9090' }}>Error: {error}</div>}

      {!loading && !error && card && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16
        }}>
          {/* LEFT: Image */}
          <div style={{
            border: '1px solid #2a2d3a',
            borderRadius: 14,
            background: '#171b26',
            padding: 14,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              width: '100%',
              border: '1px solid #2a2d3a',
              borderRadius: 12,
              background: '#0f1117',
              padding: 14,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <img
                src={card.images?.large || card.images?.small}
                alt={card.name}
                style={{ width: 'min(420px, 100%)', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 16px 28px rgba(0,0,0,.45))' }}
              />
            </div>
          </div>

          {/* RIGHT: Info */}
          <div style={{
            border: '1px solid #2a2d3a',
            borderRadius: 14,
            background: '#171b26',
            padding: 16
          }}>
            <h1 style={{ margin: '0 0 6px' }}>{card.name}</h1>
            <div style={{ opacity: 0.8, marginBottom: 14 }}>
              {card.set?.name} • #{card.number}
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {facts.map(([k, v]) => (
                <div key={k} style={{
                  border: '1px solid #2a2d3a',
                  borderRadius: 12,
                  padding: '10px 12px',
                  background: '#0f1117'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.75, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>
                    {k}
                  </div>
                  <div style={{ fontWeight: 800 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {setId && (
                <Link
                  to={`/pokemon/expansions/${setId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(245,200,66,.35)',
                    background: 'rgba(245,200,66,.10)',
                    fontWeight: 900,
                    textDecoration: 'none'
                  }}
                >
                  View all cards in set
                </Link>
              )}

              <Link
                to="/pokemon/expansions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #2a2d3a',
                  background: '#0f1117',
                  fontWeight: 900,
                  textDecoration: 'none'
                }}
              >
                Browse expansions
              </Link>
            </div>
          </div>

          {/* responsive simple */}
          <style>{`
            @media (max-width: 900px) {
              div[style*="gridTemplateColumns: '1fr 1fr'"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
