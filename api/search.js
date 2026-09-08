import { searchItems } from './_lib/rapidapi.js'
import { normalizeSearchResponse } from './_lib/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const keyword = (req.query.keyword || '').toString().trim()
  const page = (req.query.page || '1').toString()

  if (!keyword) {
    res.status(400).json({ error: 'keyword is required' })
    return
  }

  try {
    // The upstream search call is noticeably slower for some keywords than
    // the shared 8s default, and a 429 retry there would risk stacking up
    // past Vercel's own ~10s execution cap - so give it a bit more of the
    // budget and only one retry (matches api/trending.js's already-working
    // settings for the exact same call).
    const raw = await searchItems(keyword, page, { timeoutMs: 8800, maxRetries: 1 })

    // Temporary diagnostic escape hatch: ?raw=1 returns RapidAPI's
    // untouched response so the field-name mapping in _lib/normalize.js
    // can be corrected against the real payload shape. Safe to keep - it
    // never touches the key, only what RapidAPI already sent back.
    if (req.query.raw === '1') {
      res.setHeader('Cache-Control', 'no-store')
      res.status(200).json(raw)
      return
    }

    const normalized = normalizeSearchResponse(raw, keyword, page)
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(normalized)
  } catch (err) {
    console.error('search error', err)
    if (err.rateLimited) {
      res.status(429).json({ error: err.message })
      return
    }
    if (err.upstreamBusinessError) {
      res.status(503).json({ error: "Tsy afaka mividy amin'izao fotoana izao - mifandraisa amin'ny admin", detail: err.message })
      return
    }
    res.status(502).json({ error: 'Tsy nahazo ny lisitry ny entana', detail: err.message })
  }
}
