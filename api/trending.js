import { searchItems } from './_lib/cjdropshipping.js'
import { normalizeSearchResponse } from './_lib/normalize.js'
import { getCachedSearch, setCachedSearch } from './_lib/searchCache.js'

// The homepage "trending" grid picks a keyword at random on every request
// (rather than a time-bucketed rotation) so that reloading the page, or
// scrolling to load another batch, actually shows different products each
// time. A ?keyword= override lets the client ask for one of the buyer's
// own recent searches instead of the generic default list.
const DEFAULT_KEYWORDS = ['phone case', 'keychain', 'usb cable', 'bluetooth earphone', 'power bank', 'memory card']
const ITEMS_LIMIT = 24

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const requested = (req.query.keyword || '').toString().trim()
  const keyword = requested || DEFAULT_KEYWORDS[Math.floor(Math.random() * DEFAULT_KEYWORDS.length)]

  try {
    const raw = await searchItems(keyword, 1, { maxRetries: 1, timeoutMs: 8000 })
    const normalized = normalizeSearchResponse(raw, keyword, 1)
    const items = normalized.items.slice(0, ITEMS_LIMIT)
    if (items.length) {
      await setCachedSearch(keyword, { ...normalized, items })
    }
    // Deliberately not CDN-cached: each call should be free to return a
    // different random keyword's results.
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ items })
  } catch (err) {
    console.error(`trending: keyword "${keyword}" failed`, err.message)

    // A live failure shouldn't leave the homepage grid empty - fall back to
    // the last successful result for this keyword instead.
    const cached = await getCachedSearch(keyword)
    if (cached) {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json({ items: cached.items })
      return
    }

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({ items: [] })
  }
}
