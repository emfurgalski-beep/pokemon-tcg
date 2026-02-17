// In-memory cache (resets on cold start)
let setsCache = null
let cacheTime = null
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

function setHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

async function fetchWithRetry(url, tries = 3) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      lastErr = e
      console.error(`Attempt ${i + 1} failed:`, e.message)
      if (i < tries - 1) await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)))
    }
  }
  throw lastErr
}

async function loadAllSets() {
  const now = Date.now()
  if (setsCache && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    return setsCache
  }

  const data = await fetchWithRetry('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate')
  setsCache = data.data
  cacheTime = now
  return setsCache
}

export default async function handler(req, res) {
  try {
    const endpoint = String(req.query.endpoint || '').trim()

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' })
    }

    // Sets
    if (endpoint === 'sets') {
      const sets = await loadAllSets()
      setHeaders(res, 6 * 60 * 60)
      return res.status(200).json({ data: sets })
    }

    // Cards in set
    if (endpoint === 'cards') {
      const setId = String(req.query.setId || '').trim()
      if (!setId) {
        return res.status(400).json({ error: 'Missing setId' })
      }

      // Query pokemontcg.io API with set filter
      const data = await fetchWithRetry(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&pageSize=250`
      )
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: data.data })
    }

    // Single card
    if (endpoint === 'card') {
      const id = String(req.query.id || '').trim()
      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      const data = await fetchWithRetry(`https://api.pokemontcg.io/v2/cards/${id}`)
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: data.data })
    }

    // Health
    if (endpoint === 'ping') {
      setHeaders(res, 60)
      return res.status(200).json({ ok: true, cached: !!setsCache })
    }

    return res.status(400).json({
      error: `Unknown endpoint: ${endpoint}`
    })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
}