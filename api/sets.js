export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate',
      { headers: { 'X-Api-Key': process.env.TCG_API_KEY } }
    )

    if (!response.ok) {
      throw new Error(`pokemontcg API error: ${response.status}`)
    }

    const data = await response.json()

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}