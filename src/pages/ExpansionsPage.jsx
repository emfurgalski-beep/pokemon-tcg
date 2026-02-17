import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/expansions.css'

export default function ExpansionsPage() {
  const [sets, setSets] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/sets')
        const json = await r.json()
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`)
        setSets(json.data || [])
      } catch (e) {
        setErr(String(e.message || e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = query
      ? sets.filter(s =>
          (s.name || '').toLowerCase().includes(query) ||
          (s.series || '').toLowerCase().includes(query)
        )
      : sets

    // group by series (scrydex vibe: sekcje)
    const map = new Map()
    for (const s of list) {
      const key = s.series || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }

    // sort sets inside series by releaseDate desc
    for (const [k, arr] of map.entries()) {
      arr.sort((a,b) => String(b.releaseDate).localeCompare(String(a.releaseDate)))
      map.set(k, arr)
    }

    // series order: by newest set in series
    const groups = Array.from(map.entries()).sort((a, b) => {
      const aDate = a[1][0]?.releaseDate || ''
      const bDate = b[1][0]?.releaseDate || ''
      return String(bDate).localeCompare(String(aDate))
    })

    return groups
  }, [sets, q])

  return (
    <div className="container">
      <div className="expHeader">
        <div>
          <h1 className="h1">Expansions</h1>
          <p className="p">Browse sets (logos, dates, card counts) — From Alabastia</p>
        </div>
        <span className="badge">{sets.length} total</span>
      </div>

      <div className="expControls">
        <input
          className="input"
          placeholder="Search expansions… (name / series)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && <div className="expMessage">Loading…</div>}
      {err && <div className="expMessage">Error: {err}</div>}

      {!loading && !err && filtered.map(([series, items]) => (
        <section key={series} className="expSection">
          <div className="expSectionTop">
            <h2 className="expH2">{series}</h2>
            <span className="badge">{items.length} sets</span>
          </div>

          <div className="expGrid">
            {items.map(set => (
              <Link key={set.id} to={`/set/${set.id}`} className="expCard">
                <div className="expLogoWrap">
                  <img className="expLogo" src={set.images?.logo} alt={set.name} loading="lazy" />
                </div>

                <div className="expMeta">
                  <div className="expName">{set.name}</div>
                  <div className="expSub">
                    <span>{set.releaseDate || '—'}</span>
                    <span className="dot" />
                    <span>{set.total} cards</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
