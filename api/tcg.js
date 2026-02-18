// Multi-source Pokemon TCG API with fallback strategy
// Primary: pokemontcg.io (has variants, full data)
// Fallback: GitHub CDN (basic data, no variants)

const POKEMONTCG_API_BASE = 'https://api.pokemontcg.io/v2'
const GITHUB_CDN_SETS = 'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

function getGithubCardsUrl(setId) {
  return `https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/${setId}.json`
}

function setCacheHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

// Fetch with timeout and retry
async function fetchWithTimeout(url, options = {}, timeout = 5000, retries = 2) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  let lastError
  for (let i = 0; i <= retries; i++) {
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
      lastError = error
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 300 * Math.pow(2, i)))
      }
    }
  }
  
  clearTimeout(timeoutId)
  throw lastError
}

// Try pokemontcg.io, fallback to GitHub CDN
async function fetchSets() {
  try {
    console.log('[API] Trying pokemontcg.io for sets...')
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/sets`)
    
    // Transform to our format
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
    console.log('[API] Falling back to GitHub CDN...')
    
    try {
      const sets = await fetchWithTimeout(GITHUB_CDN_SETS)
      
      // Add Scrydex logos
      const enhanced = sets.map(set => ({
        ...set,
        images: {
          logo: set.images?.logo || `https://images.scrydex.com/pokemon/${set.id}-logo/logo`,
          symbol: set.images?.symbol || `https://images.scrydex.com/pokemon/${set.id}-symbol/symbol`
        }
      }))
      
      console.log('[API] GitHub CDN success:', enhanced.length, 'sets')
      return { data: enhanced, source: 'github-cdn' }
      
    } catch (fallbackError) {
      console.error('[API] All sources failed')
      throw new Error('All data sources unavailable')
    }
  }
}

// Try pokemontcg.io for cards (has variants), fallback to GitHub CDN
async function fetchCards(setId) {
  try {
    console.log(`[API] Trying pokemontcg.io for cards (set: ${setId})...`)
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/cards?q=set.id:${setId}`)
    
    console.log(`[API] pokemontcg.io success: ${data.data.length} cards (with variants)`)
    return { data: data.data, source: 'pokemontcg.io', hasVariants: true }
    
  } catch (error) {
    console.warn(`[API] pokemontcg.io failed:`, error.message)
    console.log(`[API] Falling back to GitHub CDN...`)
    
    try {
      const cards = await fetchWithTimeout(getGithubCardsUrl(setId))
      console.log(`[API] GitHub CDN success: ${cards.length} cards (no variants)`)
      return { data: cards, source: 'github-cdn', hasVariants: false }
      
    } catch (fallbackError) {
      console.error('[API] All sources failed')
      throw new Error('All data sources unavailable')
    }
  }
}

// Get single card
async function fetchCard(cardId) {
  const setId = cardId.split('-')[0]
  
  try {
    console.log(`[API] Trying pokemontcg.io for card ${cardId}...`)
    const data = await fetchWithTimeout(`${POKEMONTCG_API_BASE}/cards/${cardId}`)
    
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
    console.log(`[API] Falling back to GitHub CDN...`)
    
    try {
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
      
    } catch (fallbackError) {
      console.error('[API] All sources failed')
      throw new Error('All data sources unavailable')
    }
  }
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
          primary: 'pokemontcg.io',
          fallback: 'github-cdn'
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
