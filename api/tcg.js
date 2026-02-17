const SETS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

const CARDS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

function getQuery(req) {
  // req.url bywa relatywny na Vercelu, więc dajemy bezpieczną bazę
  const host = req.headers?.host || 'localhost'
  const url = new URL(req.url, `https://${host}`)
  return url.searchParams
}

export default async function handler(req, res) {
  try {
    const q = getQuery(req)
    const endpoint = q.get('endpoint')

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

    if (endpoint === 'sets') {
      const r = await fetch(SETS_URL)
      if (!r.ok) return res.status(502).json({ error: `Sets source error: ${r.status}` })

      const sets = await r.json()
      sets.sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)))
      return res.status(200).json({ data: sets })
    }

    if (endpoint === 'cards') {
      const setId = q.get('setId')
      if (!setId) return res.status(400).json({ error: 'Missing setId' })

      const r = await fetch(CARDS_URL)
      if (!r.ok) return res.status(502).json({ error: `Cards source error: ${r.status}` })

      const cards = await r.json()
      const filtered = cards.filter(c => c?.set?.id === setId)
      return res.status(200).json({ data: filtered })
    }

    if (endpoint === 'card') {
      const id = q.get('id')
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const r = await fetch(CARDS_URL)
      if (!r.ok) return res.status(502).json({ error: `Cards source error: ${r.status}` })

      const cards = await r.json()
      const card = cards.find(c => c?.id === id)
      if (!card) return res.status(404).json({ error: 'Card not found' })

      return res.status(200).json({ data: card })
    }

    return res.status(400).json({ error: 'Missing or invalid endpoint' })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
