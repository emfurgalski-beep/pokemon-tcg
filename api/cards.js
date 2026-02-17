const CARDS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

export default async function handler(req, res) {
  try {
    const setId = req.query.setId
    if (!setId) return res.status(400).json({ error: 'Missing setId' })

    const r = await fetch(CARDS_URL)
    if (!r.ok) return res.status(502).json({ error: `Cards source error: ${r.status}` })

    const cards = await r.json()

    // Keep only cards from this set
    const filtered = cards.filter(c => c?.set?.id === setId)

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ data: filtered })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
