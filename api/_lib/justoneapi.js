// Thin wrapper around the JustOneAPI 1688 endpoints.
// The token is only ever read here, server-side - it must never reach the browser.

const BASE = 'https://api.justoneapi.com/api/1688'

function getToken() {
  const token = process.env.JUSTONEAPI_TOKEN
  if (!token) {
    throw new Error('JUSTONEAPI_TOKEN is not configured on the server')
  }
  return token
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// JustOneAPI enforces a strict per-second rate limit and answers with
// HTTP 429 + {"message":"TOO FAST"} when it's exceeded. A couple of short
// retries smooths over that without the caller ever seeing it, as long as
// requests aren't fired in a big burst (see api/trending.js for that).
async function callJustOneApi(path, params, { maxRetries = 2, attempt = 0, timeoutMs = 8000 } = {}) {
  const token = getToken()
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('token', token)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(url.toString(), { signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('JustOneAPI timed out')
    throw err
  } finally {
    clearTimeout(timeout)
  }
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`JustOneAPI returned a non-JSON response (status ${res.status})`)
  }

  if (res.status === 429 && attempt < maxRetries) {
    await sleep(900 * (attempt + 1))
    return callJustOneApi(path, params, { maxRetries, attempt: attempt + 1, timeoutMs })
  }

  if (res.status === 429) {
    const err = new Error('Be loatra ny fangatahana amin\'izao fotoana izao, andramo indray afaka kelikely')
    err.rateLimited = true
    throw err
  }

  if (!res.ok) {
    throw new Error(`JustOneAPI request failed with status ${res.status}: ${text.slice(0, 300)}`)
  }

  // JustOneAPI reports some failures (e.g. an empty account balance, an
  // invalid token) with a normal HTTP 200 status but data: null and a
  // business-level message/code in the body. Treat that as an error too,
  // instead of silently letting it flow through as "0 products found".
  if (json && typeof json === 'object' && json.data === null && json.message) {
    const err = new Error(`JustOneAPI: ${json.message} (code ${json.code})`)
    err.upstreamBusinessError = true
    throw err
  }

  return json
}

export function searchItems(keyword, page = 1, opts) {
  return callJustOneApi('/search-item-list/v1', { keyword, page }, opts)
}

export function getItemDetail(itemId, opts) {
  // Detail lookups return far more data (images, SKU trees, description)
  // than a search row and are noticeably slower upstream - give it more of
  // the function's time budget than the default, and don't burn time on a
  // retry (a timeout here isn't a 429, so callJustOneApi wouldn't retry it
  // anyway; a second full-length attempt would just risk the platform's
  // own execution limit instead).
  return callJustOneApi('/get-item-detail/v1', { itemId }, { timeoutMs: 8800, maxRetries: 0, ...opts })
}
