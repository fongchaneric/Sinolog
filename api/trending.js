import { searchItems } from './_lib/cjdropshipping.js'
import { normalizeSearchResponse } from './_lib/normalize.js'
import { getCachedSearch, setCachedSearch } from './_lib/searchCache.js'

// The homepage "trending" grid used to fan out to several keywords in one
// request, but that stacked up latency (spacing + retries) and regularly
// blew past the upstream's response time, timing everything out. A single
// request is exactly the same call SearchResults.vue already makes
// successfully, so it's used here too - one keyword per cache window,
// rotating over time so the grid still varies across visits. CJ Dropshipping
// searches product names in English, unlike the 1688/Taobao keywords used
// with the previous provider.
const KEYWORDS = ['phone case', 'keychain', 'usb cable', 'bluetooth earphone', 'power bank', 'memory card']
const ITEMS_LIMIT = 24
const CACHE_WINDOW_MS = 10 * 60 * 1000 // matches the s-maxage below

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const keyword = KEYWORDS[Math.floor(Date.now() / CACHE_WINDOW_MS) % KEYWORDS.length]

  try {
    const raw = await searchItems(keyword, 1, { maxRetries: 1, timeoutMs: 8000 })
    const normalized = normalizeSearchResponse(raw, keyword, 1)
    const items = normalized.items.slice(0, ITEMS_LIMIT)
    if (items.length) {
      await setCachedSearch(keyword, { ...normalized, items })
    }
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600')
    res.status(200).json({ items })
  } catch (err) {
    console.error(`trending: keyword "${keyword}" failed`, err.message)

    // A live failure shouldn't leave the homepage grid empty - fall back to
    // the last successful result for this rotation's keyword instead.
    const cached = await getCachedSearch(keyword)
    if (cached) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json({ items: cached.items })
      return
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.status(200).json({ items: [] })
  }
}
