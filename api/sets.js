export default async function handler(req, res) {
  try {
    // CDN z GitHub repo (stabilne, szybkie)
    const url =
      'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

    const r = await fetch(url)
    if (!r.ok) throw new Error(`sets source error: ${r.status}`)

    const sets = await r.json()

    // sort: newest first (releaseDate jest stringiem YYYY/MM/DD w tych danych)
    sets.sort((a, b) => String(b.releaseDate).localeCompare(String(a.releaseDate)))

    // Cache na CDN Vercela – mega ważne
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ data: sets })
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
}
