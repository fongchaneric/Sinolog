import { getItemDetail } from './_lib/justoneapi.js'
import { normalizeDetailResponse } from './_lib/normalize.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const itemId = (req.query.itemId || '').toString().trim()
  if (!itemId) {
    res.status(400).json({ error: 'itemId is required' })
    return
  }

  try {
    const raw = await getItemDetail(itemId)
    const normalized = normalizeDetailResponse(raw)
    if (!normalized) {
      res.status(404).json({ error: 'Tsy hita ilay entana' })
      return
    }
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600')
    res.status(200).json(normalized)
  } catch (err) {
    console.error('product detail error', err)
    if (err.rateLimited) {
      res.status(429).json({ error: err.message })
      return
    }
    res.status(502).json({ error: 'Tsy nahazo ny antsipiriany momba ilay entana', detail: err.message })
  }
}
