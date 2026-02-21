// Multi-source Pokemon TCG API with triple fallback strategy
// 1. Primary: pokemontcg.io (with API key if available) - has variants, full data
// 2. Secondary: TCGdex - has variants, free, no key needed
// 3. Tertiary: GitHub CDN - basic data, no variants, 99.9% uptime

const POKEMONTCG_API_BASE = 'https://api.pokemontcg.io/v2'
const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en'
const GITHUB_CDN_SETS = 'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

// Get API key from environment (optional)
const POKEMONTCG_API_KEY = process.env.POKEMONTCG_API_KEY || null

// In-memory search index cache
let searchIndexCache = null
let searchIndexTimestamp = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function getGithubCardsUrl(setId) {
  return `https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/${setId}.json`
}

function setCacheHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

// Fetch with timeout and retry
async function fetchWithTimeout(url, options = {}, timeout = 5000, retries = 2) {
  let lastError
  
  for (let i = 0; i <= retries; i++) {
    // Create NEW controller for each attempt (bug fix)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError
}

// Convert TCGdex format to our standard format
function convertTCGdexCard(card, setId) {
  return {
    id: card.id || `${setId}-${card.localId}`,
    name: card.name,
    supertype: card.category,
    subtypes: card.stage ? [card.stage] : [],
    hp: card.hp,
    types: card.types || [],
    number: card.localId,
    rarity: card.rarity,
    artist: card.illustrator,
    images: {
      small: card.image ? `${card.image}/low.webp` : null,
      large: card.image ? `${card.image}/high.webp` : null
    },
    attacks: card.attacks?.map(a => ({
      name: a.name,
      cost: a.cost || [],
      damage: a.damage,
      text: a.effect
    })) || [],
    abilities: card.abilities?.map(ab => ({
      name: ab.name,
      text: ab.effect,
      type: ab.type
    })) || [],
    weaknesses: card.weaknesses?.map(w => ({
      type: w.type,
      value: w.value
    })) || [],
    resistances: card.resistances?.map(r => ({
      type: r.type,
      value: r.value
    })) || [],
    retreatCost: card.retreat ? Array(card.retreat).fill('Colorless') : []
  }
}

// Cache for sets to avoid redundant fetches
let setsCache = null
let setsCacheTimestamp = null
const SETS_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Try all sources for sets
async function fetchSets() {
  // Return cached sets if available and fresh
  if (setsCache && setsCacheTimestamp && (Date.now() - setsCacheTimestamp < SETS_CACHE_TTL)) {
    return setsCache
  }
  
  // TEMPORARY: Skip pokemontcg.io and TCGdex until they're stable
  // TODO: Re-enable when APIs are working
  
  /* Disabled temporarily
  // Try pokemontcg.io first
  try {
    console.log('[API] Trying pokemontcg.io for sets...')
    const headers = { 'Content-Type': 'application/json' }
    if (POKEMONTCG_API_KEY) {
      headers['X-Api-Key'] = POKEMONTCG_API_KEY
      console.log('[API] Using API key')
    }
    
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/sets`, { headers })
    
    const sets = data.data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.series,
      total: set.total || set.printedTotal,
      releaseDate: set.releaseDate,
      images: {
        logo: set.images?.logo || `https://images.scrydex.com/pokemon/${set.id}-logo/logo`,
        symbol: set.images?.symbol || `https://images.scrydex.com/pokemon/${set.id}-symbol/symbol`
      }
    }))
    
    console.log('[API] pokemontcg.io success:', sets.length, 'sets')
    return { data: sets, source: 'pokemontcg.io' }
    
  } catch (error) {
    console.warn('[API] pokemontcg.io failed:', error.message)
  }

  // Try TCGdex second
  try {
    console.log('[API] Trying TCGdex for sets...')
    const data = await fetchWithTimeout(`${TCGDEX_API_BASE}/sets`)
    
    const sets = data.map(set => ({
      id: set.id,
      name: set.name,
      series: set.serie?.name || 'Other',
      total: set.cardCount?.total || 0,
      releaseDate: set.releaseDate,
      images: {
        logo: set.logo ? `${set.logo}.png` : `https://images.scrydex.com/pokemon/${set.id}-logo/logo`,
        symbol: set.symbol ? `${set.symbol}.png` : `https://images.scrydex.com/pokemon/${set.id}-symbol/symbol`
      }
    }))
    
    console.log('[API] TCGdex success:', sets.length, 'sets')
    return { data: sets, source: 'tcgdex' }
    
  } catch (error) {
    console.warn('[API] TCGdex failed:', error.message)
  }
  */

  // Use GitHub CDN (stable, no variants)
  try {
    console.log('[API] Using GitHub CDN (stable source)...')
    const sets = await fetchWithTimeout(GITHUB_CDN_SETS)
    
    const enhanced = sets.map(set => ({
      ...set,
      images: {
        logo: set.images?.logo || `https://images.scrydex.com/pokemon/${set.id}-logo/logo`,
        symbol: set.images?.symbol || `https://images.scrydex.com/pokemon/${set.id}-symbol/symbol`
      }
    }))
    
    console.log('[API] GitHub CDN success:', enhanced.length, 'sets')
    
    // Cache the result
    const result = { data: enhanced, source: 'github-cdn' }
    setsCache = result
    setsCacheTimestamp = Date.now()
    
    return result
    
  } catch (error) {
    console.error('[API] GitHub CDN failed')
    throw new Error('All data sources unavailable')
  }
}

// Try all sources for cards
async function fetchCards(setId) {
  // TEMPORARY: Skip pokemontcg.io and TCGdex until they're stable
  // Use GitHub CDN only for now
  
  /* Disabled temporarily
  // Try pokemontcg.io first
  try {
    console.log(`[API] Trying pokemontcg.io for cards (set: ${setId})...`)
    const headers = { 'Content-Type': 'application/json' }
    if (POKEMONTCG_API_KEY) {
      headers['X-Api-Key'] = POKEMONTCG_API_KEY
    }
    
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/cards?q=set.id:${setId}`, { headers })
    
    console.log(`[API] pokemontcg.io success: ${data.data.length} cards (with variants)`)
    return { data: data.data, source: 'pokemontcg.io', hasVariants: true }
    
  } catch (error) {
    console.warn(`[API] pokemontcg.io failed:`, error.message)
  }

  // Try TCGdex second
  try {
    console.log(`[API] Trying TCGdex for cards (set: ${setId})...`)
    const data = await fetchWithTimeout(`${TCGDEX_API_BASE}/sets/${setId}`)
    
    if (data.cards && Array.isArray(data.cards)) {
      const cards = data.cards.map(card => convertTCGdexCard(card, setId))
      console.log(`[API] TCGdex success: ${cards.length} cards (with variants)`)
      return { data: cards, source: 'tcgdex', hasVariants: true }
    }
    
    throw new Error('Invalid TCGdex response')
    
  } catch (error) {
    console.warn(`[API] TCGdex failed:`, error.message)
  }
  */

  // Use GitHub CDN (stable, no variants)
  try {
    console.log(`[API] Using GitHub CDN for cards...`)
    const [cards, setsResult] = await Promise.all([
      fetchWithTimeout(getGithubCardsUrl(setId)),
      fetchSets(),
    ])
    const setInfo = setsResult.data.find(s => s.id === setId)
    const enriched = setInfo
      ? cards.map(card => ({
          ...card,
          set: { id: setInfo.id, name: setInfo.name, series: setInfo.series, total: setInfo.total },
        }))
      : cards
    console.log(`[API] GitHub CDN success: ${enriched.length} cards (no variants)`)
    return { data: enriched, source: 'github-cdn', hasVariants: false }

  } catch (error) {
    console.error('[API] GitHub CDN failed')
    throw new Error('Card data unavailable')
  }
}

// Try all sources for single card
async function fetchCard(cardId) {
  const setId = cardId.split('-')[0]
  
  // Try pokemontcg.io first
  try {
    console.log(`[API] Trying pokemontcg.io for card ${cardId}...`)
    const headers = { 'Content-Type': 'application/json' }
    if (POKEMONTCG_API_KEY) {
      headers['X-Api-Key'] = POKEMONTCG_API_KEY
    }
    
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/cards/${cardId}`, { headers })
    
    // Add set info
    const setsResult = await fetchSets()
    const setInfo = setsResult.data.find(s => s.id === setId)
    
    if (setInfo) {
      data.data.set = {
        id: setInfo.id,
        name: setInfo.name,
        series: setInfo.series,
        total: setInfo.total,
        releaseDate: setInfo.releaseDate,
        images: setInfo.images
      }
    }
    
    console.log(`[API] pokemontcg.io card success`)
    return { data: data.data, source: 'pokemontcg.io' }
    
  } catch (error) {
    console.warn(`[API] pokemontcg.io failed:`, error.message)
  }

  // Try TCGdex second
  try {
    console.log(`[API] Trying TCGdex for card ${cardId}...`)
    const cardNumber = cardId.split('-')[1]
    const data = await fetchWithTimeout(`${TCGDEX_API_BASE}/sets/${setId}`)
    
    if (data.cards) {
      const card = data.cards.find(c => c.localId === cardNumber)
      if (card) {
        const converted = convertTCGdexCard(card, setId)
        
        // Add set info
        const setsResult = await fetchSets()
        const setInfo = setsResult.data.find(s => s.id === setId)
        
        if (setInfo) {
          converted.set = {
            id: setInfo.id,
            name: setInfo.name,
            series: setInfo.series,
            total: setInfo.total,
            releaseDate: setInfo.releaseDate,
            images: setInfo.images
          }
        }
        
        console.log(`[API] TCGdex card success`)
        return { data: converted, source: 'tcgdex' }
      }
    }
    
    throw new Error('Card not found in TCGdex')
    
  } catch (error) {
    console.warn(`[API] TCGdex failed:`, error.message)
  }

  // Fallback to GitHub CDN
  try {
    console.log(`[API] Falling back to GitHub CDN...`)
    const cards = await fetchWithTimeout(getGithubCardsUrl(setId))
    const card = cards.find(c => c.id === cardId)
    
    if (!card) {
      throw new Error('Card not found')
    }
    
    // Add set info
    const setsResult = await fetchSets()
    const setInfo = setsResult.data.find(s => s.id === setId)
    
    if (setInfo) {
      card.set = {
        id: setInfo.id,
        name: setInfo.name,
        series: setInfo.series,
        total: setInfo.total,
        releaseDate: setInfo.releaseDate,
        images: setInfo.images
      }
    }
    
    console.log(`[API] GitHub CDN card success`)
    return { data: card, source: 'github-cdn' }
    
  } catch (error) {
    console.error('[API] All sources failed')
    throw new Error('All data sources unavailable')
  }
}

// Build search index from all cards
async function buildSearchIndex() {
  console.log('[Search] Building search index...')
  const startTime = Date.now()
  
  try {
    // Get all sets
    const setsResult = await fetchSets()
    const sets = setsResult.data
    
    const index = []
    let totalCards = 0
    
    // Load cards from all sets in parallel (batches of 20)
    const BATCH_SIZE = 20
    
    for (let i = 0; i < sets.length; i += BATCH_SIZE) {
      const batch = sets.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (set) => {
        try {
          const cards = await fetchWithTimeout(getGithubCardsUrl(set.id), {}, 10000, 1)
          
          return cards.map(card => ({
            id: card.id,
            name: card.name?.toLowerCase() || '',
            number: card.number?.toString() || '',
            setId: set.id,
            setName: set.name,
            image: card.images?.small || '',
            artist: card.artist || '',
          }))
        } catch (error) {
          console.error(`[Search] Failed to load set ${set.id}:`, error.message)
          return []
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(cards => {
        index.push(...cards)
        totalCards += cards.length
      })
      
      console.log(`[Search] Indexed ${totalCards} cards so far...`)
    }
    
    const duration = Date.now() - startTime
    console.log(`[Search] Index built: ${totalCards} cards in ${duration}ms`)
    
    return index
  } catch (error) {
    console.error('[Search] Failed to build index:', error)
    throw error
  }
}

// Get or refresh search index
async function getSearchIndex() {
  const now = Date.now()
  
  // Return cached index if still valid
  if (searchIndexCache && searchIndexTimestamp && (now - searchIndexTimestamp < CACHE_TTL)) {
    console.log('[Search] Using cached index')
    return searchIndexCache
  }
  
  // Build new index
  console.log('[Search] Cache expired or missing, rebuilding...')
  searchIndexCache = await buildSearchIndex()
  searchIndexTimestamp = now
  
  return searchIndexCache
}

// Search through index
async function searchIndex(query) {
  const index = await getSearchIndex()
  const searchQuery = query.toLowerCase().trim()
  
  if (!searchQuery || searchQuery.length < 2) {
    return []
  }
  
  // Search by name or number
  const results = index.filter(card => 
    card.name.includes(searchQuery) || 
    card.number.includes(searchQuery)
  )
  
  // Limit to 100 results
  return results.slice(0, 100)
}

export default async function handler(req, res) {
  try {
    const endpoint = String(req.query.endpoint || '').trim()

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' })
    }

    // Health check
    if (endpoint === 'ping') {
      setCacheHeaders(res, 60)
      return res.status(200).json({ 
        ok: true,
        sources: {
          primary: 'pokemontcg.io' + (POKEMONTCG_API_KEY ? ' (with API key)' : ' (no key)'),
          secondary: 'tcgdex',
          tertiary: 'github-cdn'
        }
      })
    }

    // Get all sets
    if (endpoint === 'sets') {
      const result = await fetchSets()
      setCacheHeaders(res, 6 * 60 * 60) // Cache 6 hours
      return res.status(200).json({ 
        data: result.data,
        meta: { source: result.source }
      })
    }

    // Get cards for a specific set
    if (endpoint === 'cards') {
      const setId = String(req.query.setId || '').trim()
      
      if (!setId) {
        return res.status(400).json({ error: 'Missing setId parameter' })
      }

      const result = await fetchCards(setId)
      setCacheHeaders(res, 60 * 60) // Cache 1 hour
      return res.status(200).json({ 
        data: result.data,
        meta: { 
          source: result.source,
          hasVariants: result.hasVariants
        }
      })
    }

    // Warmup endpoint - pre-build search index
    if (endpoint === 'warmup') {
      console.log('[Warmup] Starting search index pre-build...')
      const startTime = Date.now()
      
      try {
        await getSearchIndex()
        const duration = Date.now() - startTime
        
        setCacheHeaders(res, 60)
        return res.status(200).json({ 
          ok: true,
          message: 'Search index warmed up',
          duration: `${duration}ms`,
          cached: !!searchIndexCache
        })
      } catch (error) {
        console.error('[Warmup] Failed:', error)
        return res.status(500).json({ 
          ok: false,
          error: error.message 
        })
      }
    }

    // Fast search endpoint
    if (endpoint === 'search') {
      const query = String(req.query.q || '').trim()
      
      if (!query || query.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' })
      }

      const results = await searchIndex(query)
      setCacheHeaders(res, 5 * 60) // Cache 5 minutes
      return res.status(200).json({ 
        data: results,
        meta: {
          query,
          count: results.length,
          cached: !!searchIndexCache
        }
      })
    }

    // Get lightweight search index for client-side search
    if (endpoint === 'searchIndex') {
      try {
        const index = await getSearchIndex()
        setCacheHeaders(res, 24 * 60 * 60) // Cache 24 hours
        return res.status(200).json({ 
          data: index,
          meta: {
            count: index.length,
            cached: !!searchIndexCache
          }
        })
      } catch (error) {
        console.error('[SearchIndex] Failed:', error)
        return res.status(500).json({ error: error.message })
      }
    }

    // Get single card by ID
    if (endpoint === 'card') {
      const cardId = String(req.query.id || '').trim()
      
      if (!cardId) {
        return res.status(400).json({ error: 'Missing id parameter' })
      }

      const result = await fetchCard(cardId)
      setCacheHeaders(res, 60 * 60) // Cache 1 hour
      return res.status(200).json({ 
        data: result.data,
        meta: { source: result.source }
      })
    }

    return res.status(400).json({ 
      error: `Unknown endpoint: ${endpoint}`,
      available: ['ping', 'sets', 'cards', 'card']
    })

  } catch (error) {
    console.error('[API] Error:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}
