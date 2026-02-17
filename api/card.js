export default async function handler(req, res) {
  try {
    const { setId } = req.query
    if (!setId) return res.status(400).json({ error: 'Missing setId' })

    // Wszystkie karty EN (duży plik) – ale CDN + cache robi robotę
    const url =
      'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/cards/en.json'

    const r = await fetch(url)
    if (!r.ok) throw new Error(`cards source error: ${r.status}`)

    const cards = await r.json()

    // filtr po set.id
    const filtered = cards.filter(c => c?.set?.id === setId)

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ data: filtered })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}
