const SETS_URL =
  'https://cdn.jsdelivr.net/gh/PokemonTCG/pokemon-tcg-data@master/sets/en.json'

export default async function handler(req, res) {
  const r = await fetch(SETS_URL)
  const sets = await r.json()
  res.status(200).json({ data: sets })
}
