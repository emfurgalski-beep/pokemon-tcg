let memoryCache = {
  data: null,
  savedAt: 0,
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 9000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

async function fetchSetsFromTCG() {
  // 1) mniejsza odpowiedź = mniejsza szansa timeoutu
  // 2) nie polegamy na orderBy po stronie API – posortujemy u siebie
  const url =
    'https://api.pokemontcg.io/v2/sets?page=1&pageSize=250&select=id,name,series,total,releaseDate,images'

  const headers = {
    'X-Api-Key': process.env.TCG_API_KEY,
    'Accept': 'application/json',
    // ważne: Cloudflare czasem gorzej traktuje requesty bez UA
    'User-Agent': 'FromAlabastia/1.0 (+https://from-alabastia.vercel.app)',
  }

  // Retry: 3 próby, z krótkim backoffem
  let lastErr = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { method: 'GET', headers }, 9000)

      // czytamy text, bo czasem Cloudflare zwraca HTML
      const text = await res.text()

      if (!res.ok) {
        lastErr = new Error(`TCG API not ok: ${res.status} ${res.statusText}. Body: ${text.slice(0, 200)}`)
        // mały backoff
        await sleep(400 * attempt)
        continue
      }

      let json
      try {
        json = JSON.parse(text)
      } catch {
        lastErr = new Error(`TCG API returned non-JSON. Preview: ${text.slice(0, 200)}`)
        await sleep(400 * attempt)
        continue
      }

      const sets = Array.isArray(json?.data) ? json.data : []

      // sortowanie po releaseDate lokalnie (najpierw nowe)
      sets.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''))

      return { data: sets, raw: json }
    } catch (e) {
      lastErr = e
      await sleep(400 * attempt)
    }
  }

  throw lastErr || new Error('Unknown error fetching sets')
}

export default async function handler(req, res) {
  try {
    // CACHE:
    // Jeśli mamy cache młodszy niż 1h, oddajemy go od razu (super stabilne)
    const now = Date.now()
    const cacheAgeMs = now - memoryCache.savedAt
    if (memoryCache.data && cacheAgeMs < 60 * 60 * 1000) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
      return res.status(200).json({ data: memoryCache.data, cached: true })
    }

    const result = await fetchSetsFromTCG()

    // zapis do cache w pamięci funkcji (działa, dopóki warm instance żyje)
    memoryCache = { data: result.data, savedAt: now }

    // cache na Vercelu (CDN) — kluczowe
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({ data: result.data, cached: false })
  } catch (err) {
    // FALLBACK: jeśli TCG padło, a mamy stare dane — oddaj stare dane zamiast 500
    if (memoryCache.data) {
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
      return res.status(200).json({
        data: memoryCache.data,
        cached: true,
        stale: true,
        warning: String(err?.message || err),
      })
    }

    return res.status(500).json({
      error: String(err?.message || err),
    })
  }
}
