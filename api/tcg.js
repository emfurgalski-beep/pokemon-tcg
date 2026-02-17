const SETS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

const CARDS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

function setCache(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
}

async function fetchJsonWithRetry(url, tries = 3) {
  let lastErr

  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      lastErr = e
      // backoff: 200ms, 400ms, 800ms
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, i)))
    }
  }

  throw lastErr
}

export default async function handler(req, res) {
  try {
    // accept multiple param names (new + old)
    const endpoint = String(
      req.query.endpoint ??
      req.query.endPoint ??
      req.query.endpoi ??
      req.query.end ??
      ''
    ).trim()

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing or invalid endpoint' })
    }

    // health
    if (endpoint === 'ping') {
      setCache(res, 60)
      return res.status(200).json({ ok: true, from: 'from-alabastia' })
    }

    // sets
    if (endpoint === 'sets') {
      const sets = await fetchJsonWithRetry(SETS_URL, 3)
      setCache(res, 6 * 60 * 60) // 6h
      return res.status(200).json({ data: sets })
    }

    // cards in set
    if (endpoint === 'cards') {
      const setId = String(req.query.setId || '').trim()
      if (!setId) return res.status(400).json({ error: 'Missing setId' })

      const cards = await fetchJsonWithRetry(CARDS_URL, 3)
      const filtered = cards.filter((c) => c?.set?.id === setId)

      setCache(res, 60 * 60) // 1h
      return res.status(200).json({ data: filtered })
    }

    // single card
    if (endpoint === 'card') {
      const id = String(req.query.id || '').trim()
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const cards = await fetchJsonWithRetry(CARDS_URL, 3)
      const card = cards.find((c) => c?.id === id)

      if (!card) return res.status(404).json({ error: 'Card not found' })

      setCache(res, 60 * 60) // 1h
      return res.status(200).json({ data: card })
    }

    return res.status(400).json({
      error: `Unknown endpoint "${endpoint}". Use: ping | sets | cards | card`
    })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
