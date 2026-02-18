const SETS_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json'
const CARDS_URL = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en.json'

function cache(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
}

async function fetchJsonWithRetry(url, tries = 3) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'FromAlabastia/1.0'
        }
      })
      if (!r.ok) throw new Error(`Upstream HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      lastErr = e
      console.error(`Attempt ${i + 1} failed for ${url}:`, e.message)
      await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)))
    }
  }
  throw lastErr
}

export default async function handler(req, res) {
  try {
    const endpoint = String(req.query.endpoint || '').trim()

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' })
    }

    // Sets
    if (endpoint === 'sets') {
      const sets = await fetchJsonWithRetry(SETS_URL, 3)
      cache(res, 6 * 60 * 60)
      return res.status(200).json({ data: sets })
    }

    // Cards in set
    if (endpoint === 'cards') {
      const setId = String(req.query.setId || '').trim()
      if (!setId) {
        return res.status(400).json({ error: 'Missing setId parameter' })
      }

      const cards = await fetchJsonWithRetry(CARDS_URL, 3)
      const filtered = cards.filter(c => c?.set?.id === setId)

      cache(res, 60 * 60)
      return res.status(200).json({ data: filtered })
    }

    // Single card
    if (endpoint === 'card') {
      const id = String(req.query.id || '').trim()
      if (!id) {
        return res.status(400).json({ error: 'Missing id parameter' })
      }

      const cards = await fetchJsonWithRetry(CARDS_URL, 3)
      const card = cards.find(c => c?.id === id)

      if (!card) {
        return res.status(404).json({ error: 'Card not found' })
      }

      cache(res, 60 * 60)
      return res.status(200).json({ data: card })
    }

    // Health check
    if (endpoint === 'ping') {
      cache(res, 60)
      return res.status(200).json({ ok: true, from: 'from-alabastia' })
    }

    return res.status(400).json({
      error: `Unknown endpoint "${endpoint}". Use: sets | cards | card | ping`
    })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ 
      error: String(err?.message || err),
      hint: 'GitHub CDN may be temporarily unavailable'
    })
  }
}
