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

  // Get basic list first
  const setsList = await fetchTCGdex('sets')
  
  // Filter: Keep only English main sets (exclude Japanese, TCG Pocket, special editions)
  const mainSets = setsList.filter(s => {
    const id = s.id.toLowerCase()
    
    // Exclude Japanese sets
    if (id.endsWith('_ja')) return false
    
    // Exclude TCG Pocket sets
    if (id.startsWith('tcgp-')) return false
    
    // Exclude McDonald's promotional sets (keep only main releases)
    // We'll keep them for now since Scrydex shows them
    
    return true
  })
  
  // Load full details for filtered sets (includes releaseDate)
  // Do it in batches to avoid overwhelming the API
  const batchSize = 25
  const setsWithDetails = []
  
  for (let i = 0; i < mainSets.length; i += batchSize) {
    const batch = mainSets.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (s) => {
        try {
          const full = await fetchTCGdex(`sets/${s.id}`)
          
          // Use Scrydex images (more reliable and complete)
          const scrydexLogo = `https://images.scrydex.com/pokemon/${s.id}-logo/logo`
          const scrydexSymbol = `https://images.scrydex.com/pokemon/${s.id}-symbol/symbol`
          
          return {
            id: full.id,
            name: full.name,
            series: full.serie?.name || 'Unknown',
            printedTotal: full.cardCount?.official || full.cardCount?.total || 0,
            total: full.cardCount?.total || 0,
            releaseDate: full.releaseDate, // "1999/01/09"
            ptcgoCode: full.tcgOnline,
            images: {
              // Try Scrydex first (more complete), fallback to TCGdex
              logo: scrydexLogo,
              symbol: scrydexSymbol
            }
          }
        } catch (e) {
          // Fallback to basic info from list
          const scrydexLogo = `https://images.scrydex.com/pokemon/${s.id}-logo/logo`
          return {
            id: s.id,
            name: s.name,
            series: 'Unknown',
            printedTotal: s.cardCount?.total || 0,
            total: s.cardCount?.total || 0,
            releaseDate: null,
            images: {
              logo: scrydexLogo,
              symbol: null
            }
          }
        }
      })
    )
    setsWithDetails.push(...batchResults)
  }
  
  setsCache = setsWithDetails
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

  try {
    // Fetch cards for specific set
    const setData = await fetchTCGdex(`sets/${setId}`)
    
    // Some sets might not have cards array
    if (!setData.cards || setData.cards.length === 0) {
      console.warn(`No cards found for set ${setId}`)
      cardsBySet.set(setId, [])
      return []
    }
    
    // Convert format
    const converted = setData.cards.map(c => {
      const imageBase = c.image || `https://assets.tcgdex.net/en/${setId}/${c.localId}`
      
      return {
        id: c.id || `${setId}-${c.localId}`,
        name: c.name,
        number: c.localId,
        rarity: c.rarity,
        set: {
          id: setId,
          name: setData.name
        },
        images: {
          small: `${imageBase}/low.webp`,
          large: `${imageBase}/high.webp`
        },
        types: c.types || [],
        hp: c.hp,
        artist: c.illustrator
      }
    })
    
    cardsBySet.set(setId, converted)
    return converted
  } catch (error) {
    console.error(`Failed to load cards for ${setId}:`, error.message)
    // Return empty array instead of failing
    cardsBySet.set(setId, [])
    return []
  }
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
      const imageBase = card.image || `https://assets.tcgdex.net/en/${setId}/${localId}`
      
      const converted = {
        id: card.id || `${setId}-${localId}`,
        name: card.name,
        number: card.localId,
        rarity: card.rarity,
        set: card.set,
        images: {
          small: `${imageBase}/low.webp`,
          large: `${imageBase}/high.webp`
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