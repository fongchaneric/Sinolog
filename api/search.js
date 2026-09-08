import { searchItems } from './_lib/justoneapi.js'
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
    const raw = await searchItems(keyword, page)
    const normalized = normalizeSearchResponse(raw, keyword, page)
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(normalized)
  } catch (err) {
    console.error('search error', err)
    if (err.rateLimited) {
      res.status(429).json({ error: err.message })
      return
    }
    res.status(502).json({ error: 'Tsy nahazo ny lisitry ny entana', detail: err.message })
  }
}
