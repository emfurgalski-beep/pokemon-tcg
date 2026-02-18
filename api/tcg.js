// Using TCGdex API - free, unlimited, reliable
const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en'

// In-memory cache
let setsCache = null
let cardsBySet = new Map()
let cacheTime = null
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

function setHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

async function fetchTCGdex(endpoint) {
  const r = await fetch(`${TCGDEX_BASE}/${endpoint}`)
  if (!r.ok) throw new Error(`TCGdex HTTP ${r.status}`)
  return await r.json()
}

async function loadAllSets() {
  const now = Date.now()
  if (setsCache && cacheTime && (now - cacheTime < CACHE_DURATION)) {
    return setsCache
  }

  // TCGdex returns sets in different format - adapt it
  const sets = await fetchTCGdex('sets')
  
  // Convert TCGdex format to pokemontcg.io format
  setsCache = sets.map(s => ({
    id: s.id,
    name: s.name,
    series: s.serie?.name || s.serie || 'Unknown',
    printedTotal: s.cardCount?.total || 0,
    total: s.cardCount?.total || 0,
    releaseDate: s.releaseDate,
    ptcgoCode: s.tcgOnline,
    images: {
      logo: s.logo ? `${s.logo}.png` : null,
      symbol: s.symbol ? `${s.symbol}.png` : null
    }
  }))
  
  cacheTime = now
  return setsCache
}

async function loadSetCards(setId) {
  const now = Date.now()
  
  if (cardsBySet.has(setId)) {
    const cached = cardsBySet.get(setId)
    if (cacheTime && (now - cacheTime < CACHE_DURATION)) {
      return cached
    }
  }

  // Fetch cards for specific set
  const cards = await fetchTCGdex(`sets/${setId}`)
  
  // Convert format
  const converted = (cards.cards || []).map(c => ({
    id: c.id || `${setId}-${c.localId}`,
    name: c.name,
    number: c.localId,
    rarity: c.rarity,
    set: {
      id: setId,
      name: cards.name
    },
    images: {
      small: c.image ? `${c.image}/low.webp` : null,
      large: c.image ? `${c.image}/high.webp` : null
    },
    types: c.types || [],
    hp: c.hp,
    artist: c.illustrator
  }))
  
  cardsBySet.set(setId, converted)
  return converted
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

      const cards = await loadSetCards(setId)
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: cards })
    }

    // Single card
    if (endpoint === 'card') {
      const id = String(req.query.id || '').trim()
      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      // TCGdex card ID format: setId-localId (e.g., "base1-4")
      const parts = id.split('-')
      if (parts.length < 2) {
        return res.status(400).json({ error: 'Invalid card ID format (expected: setId-localId)' })
      }
      
      const setId = parts[0]
      const localId = parts.slice(1).join('-')
      
      const card = await fetchTCGdex(`sets/${setId}/${localId}`)
      
      // Convert format
      const converted = {
        id: card.id || `${setId}-${localId}`,
        name: card.name,
        number: card.localId,
        rarity: card.rarity,
        set: card.set,
        images: {
          small: card.image ? `${card.image}/low.webp` : null,
          large: card.image ? `${card.image}/high.webp` : null
        },
        types: card.types || [],
        hp: card.hp,
        artist: card.illustrator,
        supertype: card.category,
        subtypes: card.stage ? [card.stage] : [],
        evolvesFrom: card.evolveFrom
      }
      
      setHeaders(res, 60 * 60)
      return res.status(200).json({ data: converted })
    }

    // Health
    if (endpoint === 'ping') {
      setHeaders(res, 60)
      return res.status(200).json({ 
        ok: true, 
        source: 'TCGdex',
        cached: !!setsCache
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