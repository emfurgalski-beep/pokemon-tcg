export default async function handler(req, res) {
  try {
    const url = 'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=50'

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': process.env.TCG_API_KEY,
        'Accept': 'application/json',
      },
    })

    const bodyText = await response.text()

    // pokażemy Ci dokładnie co zwraca serwer
    res.status(200).json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      // utnijmy, żeby nie zalać ekranu
      bodyPreview: bodyText.slice(0, 800),
      url,
    })
  } catch (err) {
    res.status(200).json({ ok: false, error: String(err) })
  }
}
