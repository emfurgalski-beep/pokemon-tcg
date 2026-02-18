// Pokemon TCG API using jsDelivr CDN
// Data source: github.com/PokemonTCG/pokemon-tcg-data
// CDN: cdn.jsdelivr.net (fast, global, no CORS issues)

const SETS_URL = 'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

// Cards are stored per-set, not in one big file
function getCardsUrl(setId) {
  return `https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/${setId}.json`
}

function setCacheHeaders(res, seconds = 3600) {
  res.setHeader('Cache-Control', `public, s-maxage=${seconds}, stale-while-revalidate=86400`)
  res.setHeader('Access-Control-Allow-Origin', '*')
}

async function fetchWithRetry(url, retries = 3) {
  let lastError

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      lastError = error
      // Exponential backoff: 200ms, 400ms, 800ms
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, i)))
      }
    }
  }

  throw lastError
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
        source: 'jsDelivr CDN',
        repo: 'PokemonTCG/pokemon-tcg-data'
      })
    }

    // Get all sets
    if (endpoint === 'sets') {
      const sets = await fetchWithRetry(SETS_URL)
      
      // Add Scrydex logo as fallback for sets without images
      const enhancedSets = sets.map(set => ({
        ...set,
        images: {
          logo: set.images?.logo || `https://images.scrydex.com/pokemon/${set.id}-logo/logo`,
          symbol: set.images?.symbol || `https://images.scrydex.com/pokemon/${set.id}-symbol/symbol`
        }
      }))
      
      setCacheHeaders(res, 6 * 60 * 60) // Cache 6 hours
      return res.status(200).json({ data: enhancedSets })
    }

    // Get cards for a specific set
    if (endpoint === 'cards') {
      const setId = String(req.query.setId || '').trim()
      
      if (!setId) {
        return res.status(400).json({ error: 'Missing setId parameter' })
      }

      const cardsUrl = getCardsUrl(setId)
      const cards = await fetchWithRetry(cardsUrl)
      
      setCacheHeaders(res, 60 * 60) // Cache 1 hour
      return res.status(200).json({ data: cards })
    }

    // Get single card by ID
    if (endpoint === 'card') {
      const cardId = String(req.query.id || '').trim()
      
      if (!cardId) {
        return res.status(400).json({ error: 'Missing id parameter' })
      }

      // Extract set ID from card ID (format: setId-cardNumber, e.g., "base1-4")
      const setId = cardId.split('-')[0]
      
      if (!setId) {
        return res.status(400).json({ error: 'Invalid card ID format' })
      }

      const cardsUrl = getCardsUrl(setId)
      const cards = await fetchWithRetry(cardsUrl)
      const card = cards.find(c => c?.id === cardId)
      
      if (!card) {
        return res.status(404).json({ error: 'Card not found' })
      }
      
      setCacheHeaders(res, 60 * 60) // Cache 1 hour
      return res.status(200).json({ data: card })
    }

    return res.status(400).json({ 
      error: `Unknown endpoint: ${endpoint}`,
      available: ['ping', 'sets', 'cards', 'card']
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    })
  }
}
