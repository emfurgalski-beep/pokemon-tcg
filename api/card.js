const CARDS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

export default async function handler(req, res) {
  try {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const r = await fetch(CARDS_URL)
    if (!r.ok) return res.status(502).json({ error: `Cards source error: ${r.status}` })

    const cards = await r.json()

    const card = cards.find(c => c.id === id)
    if (!card) return res.status(404).json({ error: 'Card not found' })

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ data: card })
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) })
  }
}
