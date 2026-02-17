import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { slugify } from '../lib/slug'
import '../styles/set.css'

export default function SetPage() {
  const { setId } = useParams()

  const [setInfo, setSetInfo] = useState(null)

  const [cards, setCards] = useState([])
  const [query, setQuery] = useState('')
  const [loadingCards, setLoadingCards] = useState(true)
  const [loadingSet, setLoadingSet] = useState(true)
  const [error, setError] = useState('')

  // 1) Load set info (name, series, logo, releaseDate, etc.)
  useEffect(() => {
    let alive = true

    async function loadSet() {
      try {
        setLoadingSet(true)
        const r = await fetch('/api/tcg?endpoint=sets')
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        const found = (j.data || []).find(s => s?.id === setId)
        if (alive) setSetInfo(found || null)
      } catch (e) {
        // set header can still work without setInfo, so we don't hard-fail here
        console.error(e)
      } finally {
        if (alive) setLoadingSet(false)
      }
    }

    loadSet()
    return () => { alive = false }
  }, [setId])

  // 2) Load cards for this set
  useEffect(() => {
    let alive = true

    async function loadCards() {
      try {
        setLoadingCards(true)
        setError('')
        setCards([])

        const r = await fetch(`/api/tcg?endpoint=cards&setId=${encodeURIComponent(setId)}`)
        const j = await r.json()

        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`)
        if (alive) setCards(j.data || [])
      } catch (e) {
        if (alive) setError(String(e.message || e))
      } finally {
        if (alive) setLoadingCards(false)
      }
    }

    loadCards()
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

  const title = setInfo?.name || `Set: ${setId}`
  const series = setInfo?.series
  const date = setInfo?.releaseDate
  const total = setInfo?.total ?? cards.length
  const ptcgo = setInfo?.ptcgoCode

  return (
    <main className="page">
      <Link to="/pokemon/expansions" className="breadcrumbLink">← Back to expansions</Link>

      {/* SCRYDEX-LIKE HEADER */}
      <section className="setHero">
        <div className="setHero__left">
          {setInfo?.images?.logo ? (
            <img className="setHero__logo" src={setInfo.images.logo} alt={title} />
          ) : (
            <div className="setHero__logoFallback">{setId}</div>
          )}
        </div>

        <div className="setHero__right">
          <div className="setHero__titleRow">
            <h1 className="setHero__title">{title}</h1>
            {ptcgo && <span className="setHero__badge">{ptcgo}</span>}
          </div>

          <div className="setHero__meta">
            {/* usunęliśmy setId z UI, ale jeśli chcesz możesz go tu dodać jako pill */}
            {series && <span>{series}</span>}
            <span>•</span>
            <span>{total} cards</span>
            {date && (
              <>
                <span>•</span>
                <span>Released {date}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="setTools">
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cards (name, number, rarity)…"
        />

        <div className="muted setTools__count">
          {loadingCards ? 'Loading…' : `${filtered.length} / ${cards.length} cards`}
        </div>
      </div>

      {loadingCards && <div className="center muted">Loading cards…</div>}
      {error && <div className="center error">Error: {error}</div>}

      {!loadingCards && !error && (
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

      {/* optional tiny helper */}
      {loadingSet && <div style={{ height: 0 }} />}
    </main>
  )
}
