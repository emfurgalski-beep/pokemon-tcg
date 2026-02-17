export default async function handler(req, res) {
  try {
    const id = req.query.id
    if (!id) return res.status(400).json({ error: 'Missing id' })

    const url =
      'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

    const r = await fetch(url)
    if (!r.ok) throw new Error(`cards source error: ${r.status}`)
    const cards = await r.json()

    const card = cards.find(c => c.id === id)
    if (!card) return res.status(404).json({ error: 'Not found' })

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ data: card })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}
