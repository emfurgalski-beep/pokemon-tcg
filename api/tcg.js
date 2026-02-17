// Multiple data sources as fallback
const BACKUP_SOURCES = [
  'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/en.json',
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'
]

const SETS_SOURCES = [
  'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json',
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'
]

// In-memory cache
let setsCache = null
let cardsCache = null
let cacheTime = null
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

function setHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

async function fetchFromSources(sources) {
  for (const url of sources) {
    try {
      console.log(`Trying ${url}`)
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (r.ok) {
        const data = await r.json()
        console.log(`✓ Success from ${url}`)
        return data
      }
      
      console.log(`✗ Failed ${url}: HTTP ${r.status}`)
    } catch (e) {
      console.log(`✗ Failed ${url}:`, e.message)
    }
  }
  
  throw new Error('All data sources failed')
}

async function loadAllSets() {
  const now = Date.now()
  if (setsCache && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    return setsCache
  }

  setsCache = await fetchFromSources(SETS_SOURCES)
  cacheTime = now
  return setsCache
}

async function loadAllCards() {
  const now = Date.now()
  if (cardsCache && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    return cardsCache
  }

  cardsCache = await fetchFromSources(BACKUP_SOURCES)
  cacheTime = now
  return cardsCache
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

      const allCards = await loadAllCards()
      const filtered = allCards.filter(c => c?.set?.id === setId)
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: filtered })
    }

    // Single card
    if (endpoint === 'card') {
      const id = String(req.query.id || '').trim()
      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      const allCards = await loadAllCards()
      const card = allCards.find(c => c?.id === id)
      
      if (!card) {
        return res.status(404).json({ error: 'Card not found' })
      }
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: card })
    }

    // Health
    if (endpoint === 'ping') {
      setHeaders(res, 60)
      return res.status(200).json({ 
        ok: true, 
        cached: !!(setsCache && cardsCache)
      })
    }

    return res.status(400).json({
      error: `Unknown endpoint: ${endpoint}`
    })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: String(err.message || err) })
  }
}