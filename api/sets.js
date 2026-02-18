async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

export default async function handler(req, res) {
  try {
    // mniejszy payload = mniejsza szansa timeoutu
    const url = "https://api.pokemontcg.io/v2/sets?page=1&pageSize=50"

    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        "X-Api-Key": process.env.TCG_API_KEY,
        "Accept": "application/json",
        "User-Agent": "FromAlabastia/1.0",
      },
    }, 20000)

    const text = await response.text()

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        status: response.status,
        preview: text.slice(0, 300),
      })
    }

    // jeśli Cloudflare zwróci HTML, parse poleci – i dobrze, złapiemy to niżej
    const json = JSON.parse(text)

    // cache na CDN Vercela (żeby nie walić w ich API ciągle)
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
    return res.status(200).json(json)

  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err?.message || err) })
  }
}
