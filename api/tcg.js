const SETS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

function cardsBySetUrl(setId) {
  return `https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en/${setId}.json`
}

function getQuery(req) {
  const host = req.headers?.host || 'localhost'
  const url = new URL(req.url, `https://${host}`)
  return url.searchParams
}

async function fetchJson(url) {
  const r = await fetch(url)
  const text = await r.text()
  if (!r.ok) {
    throw new Error(`Source error ${r.status} for ${url}. Body: ${text.slice(0, 120)}`)
  }
  return JSON.parse(text)
}

function inferSetIdFromCardId(cardId) {
  return String(cardId).split('-')[0]
}

export default async function handler(req, res) {
  try {
    const q = getQuery(req)
    const endpoint = q.get('endpoint')

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

    if (endpoint === 'sets') {
      const sets = await fetchJson(SETS_URL)
      sets.sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)))
      return res.status(200).json({ data: sets })
    }

    if (endpoint === 'cards') {
      const setId = q.get('setId')
      if (!setId) return res.status(400).json({ error: 'Missing setId' })

      const cards = await fetchJson(cardsBySetUrl(setId))
      return res.status(200).json({ data: cards })
    }

    if (endpoint === 'card') {
      const id = q.get('id')
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const setId = inferSetIdFromCardId(id)
      const cards = await fetchJson(cardsBySetUrl(setId))

      const card = cards.find(c => c?.id === id)
      if (!card) return res.status(404).json({ error: 'Card not found', setId })

      return res.status(200).json({ data: card })
    }

    return res.status(400).json({ error: 'Missing or invalid endpoint' })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
