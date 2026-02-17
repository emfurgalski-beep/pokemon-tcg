import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import '../styles/card.css'

export default function CardPage() {
  const { cardId } = useParams()
  const [sp] = useSearchParams()
  const variant = sp.get('variant') || 'normal'

  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        // pokemon-tcg-data nie ma endpointu "by id", więc bierzemy z TCG API gdy działa
        // NA TERAZ: pobierzemy z /api/card?id=... (zrobimy go za chwilę) – poniżej masz wersję prostą:
        const r = await fetch(`/api/card?id=${encodeURIComponent(cardId)}`)
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`)
        setCard(json.data)
      } catch (e) {
        setErr(String(e.message || e))
      } finally {
        setLoading(false)
      }
    })()
  }, [cardId])

  const variants = useMemo(() => {
    // na start: “normal” zawsze dostępny; resztę dołożymy gdy dodasz dane o wariantach/cenach
    const base = [{ key: 'normal', label: 'Normal' }]
    // Jeśli kiedyś dodasz logikę: holo/reverse/1st edition itp., tu tylko dorzucisz:
    // base.push({ key:'reverse-holo', label:'Reverse Holo' })
    return base
  }, [])

  if (loading) return <div className="container"><div className="cardMsg">Loading…</div></div>
  if (err) return <div className="container"><div className="cardMsg">Error: {err}</div></div>
  if (!card) return <div className="container"><div className="cardMsg">Card not found</div></div>

  return (
    <div className="container">
      <div className="cardTop">
        <div>
          <div className="crumbs">
            <Link to="/expansions">Expansions</Link>
            <span>›</span>
            <Link to={`/set/${card.set?.id}`}>{card.set?.name || card.set?.id}</Link>
            <span>›</span>
            <span>{card.name}</span>
          </div>

          <h1 className="cardTitle">
            {card.name}
            <span className="cardNo"> {card.set?.printedTotal ? `#${card.number}/${card.set.printedTotal}` : `#${card.number}`}</span>
          </h1>

          <div className="cardSubtitle">
            <span className="pill">{card.supertype}</span>
            {card.rarity && <span className="pill">{card.rarity}</span>}
            {card.set?.series && <span className="pill muted">{card.set.series}</span>}
          </div>
        </div>

        <div className="variantBar">
          {variants.map(v => (
            <Link
              key={v.key}
              to={`?variant=${encodeURIComponent(v.key)}`}
              className={`variantBtn ${variant === v.key ? 'active' : ''}`}
            >
              {v.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="cardLayout">
        <div className="cardImagePanel">
          <img
            className="cardImg"
            src={card.images?.large || card.images?.small}
            alt={card.name}
          />
          <div className="cardHint">Variant: <b>{variant}</b></div>
        </div>

        <div className="cardInfoPanel">
          <div className="infoGrid">
            <Info label="Set" value={card.set?.name} />
            <Info label="Set ID" value={card.set?.id} />
            <Info label="Number" value={card.number} />
            <Info label="Artist" value={card.artist} />
            <Info label="Rarity" value={card.rarity} />
            <Info label="Type" value={card.types?.join(', ')} />
            <Info label="HP" value={card.hp} />
            <Info label="Regulation" value={card.regulationMark} />
          </div>

          {card.flavorText && (
            <div className="flavor">
              <div className="flavorLabel">Flavor</div>
              <div className="flavorText">{card.flavorText}</div>
            </div>
          )}

          <div className="actions">
            <button className="primaryBtn">Add to collection</button>
            <button className="ghostBtn">Track price (later)</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="infoCell">
      <div className="infoLabel">{label}</div>
      <div className="infoValue">{value || '—'}</div>
    </div>
  )
}
