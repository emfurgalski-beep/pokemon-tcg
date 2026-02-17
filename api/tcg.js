const SETS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

const CARDS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

export default async function handler(req, res) {
  try {
    const endpoint = req.query.endpoint
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

    if (endpoint === 'sets') {
      const r = await fetch('/api/tcg?endpoint=sets')
const json = await r.json()
setSets(json.data)

    }

    if (endpoint === 'cards') {
      const setId = req.query.setId
      if (!setId) return res.status(400).json({ error: 'Missing setId' })

      const r = await fetch('/api/tcg?endpoint=sets')
const json = await r.json()
setSets(json.data)

    }

    if (endpoint === 'card') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing id' })

      const r = await fetch(`/api/tcg?endpoint=card&id=${encodeURIComponent(cardId)}`)
const json = await r.json()
setCard(json.data)

    }

    return res.status(400).json({ error: 'Missing or invalid endpoint' })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
