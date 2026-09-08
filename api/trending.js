import { searchItems } from './_lib/justoneapi.js'
import { normalizeSearchResponse } from './_lib/normalize.js'

// A small, fixed set of keywords for the homepage "trending" grid.
// Kept short and fetched sequentially with spacing (below) because
// JustOneAPI enforces a strict per-second rate limit - firing several
// searches at once from the client used to trip "TOO FAST" (429) errors.
const KEYWORDS = ['手机壳', '钥匙扣', '数据线', '蓝牙耳机']
const ITEMS_PER_KEYWORD = 6
const SPACING_MS = 1100
const PER_CALL_TIMEOUT_MS = 3500
// Vercel's default function timeout is 10s on the Hobby plan (higher plans
// can raise it via vercel.json, but this must still work on the default).
// Stop starting new keyword lookups once this much time has elapsed and
// just return whatever was gathered so far - the response is cached hard
// at the edge afterwards, so a rare partial result self-heals on the next
// cache refresh instead of ever risking a function timeout.
const DEADLINE_MS = 7500

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const startedAt = Date.now()
  const items = []
  for (let i = 0; i < KEYWORDS.length; i++) {
    if (Date.now() - startedAt > DEADLINE_MS) break
    if (i > 0) await sleep(SPACING_MS)
    try {
      // A single upfront call already used the retry budget upstream;
      // skip a keyword outright on failure rather than retrying, so one
      // slow/rate-limited keyword can't blow the whole request's time budget.
      const raw = await searchItems(KEYWORDS[i], 1, { maxRetries: 0, timeoutMs: PER_CALL_TIMEOUT_MS })
      const normalized = normalizeSearchResponse(raw, KEYWORDS[i], 1)
      items.push(...normalized.items.slice(0, ITEMS_PER_KEYWORD))
    } catch (err) {
      console.error(`trending: keyword "${KEYWORDS[i]}" failed`, err.message)
    }
  }

  // Cached hard at the edge - most visitors get an instant cached response
  // and JustOneAPI only actually gets called roughly once every 10 minutes.
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600')
  res.status(200).json({ items })
}
