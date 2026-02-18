export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&page=1&pageSize=50',
      {
        method: 'GET',
        headers: {
          'X-Api-Key': process.env.TCG_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'FromAlabastia/1.0 (vercel serverless)',
          'Cache-Control': 'no-cache'
        }
      }
    )

    const text = await response.text()

    if (!response.ok) {
      return res.status(500).json({
        status: response.status,
        body: text
      })
    }

    const data = JSON.parse(text)

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json(data)

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
