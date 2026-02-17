export default async function handler(req, res) {
  const response = await fetch(
    'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate',
    { headers: { 'X-Api-Key': process.env.VITE_TCG_API_KEY } }
  )

  const data = await response.json()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json(data)
