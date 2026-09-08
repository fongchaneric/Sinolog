// Thin wrapper around the RapidAPI-hosted "Taobao 1688 API" (host
// taobao-1688-api1.p.rapidapi.com). The key is only ever read here,
// server-side - it must never reach the browser.
//
// Endpoints (both confirmed against real cURL snippets pulled from the
// RapidAPI dashboard - two earlier guesses, /v53/... and /1688/search,
// were both ruled out by live 404s before these were found):
//   GET /1688/search-keyword  ?keyword=&page=
//   GET /1688/detail          ?itemId=
// The exact response field names are not documented anywhere reachable from
// here, so _lib/normalize.js stays defensive (many candidate field names)
// and api/search.js / api/product.js keep a ?raw=1 escape hatch to inspect
// the real payload shape after deploy.

function getHost() {
  const host = process.env.RAPIDAPI_HOST
  if (!host) {
    throw new Error('RAPIDAPI_HOST is not configured on the server')
  }
  return host
}

function getKey() {
  const key = process.env.RAPIDAPI_KEY
  if (!key) {
    throw new Error('RAPIDAPI_KEY is not configured on the server')
  }
  return key
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callRapidApi(path, params, { maxRetries = 2, attempt = 0, timeoutMs = 8000 } = {}) {
  const host = getHost()
  const key = getKey()
  const url = new URL(`https://${host}${path}`)
  for (const [k, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(k, value)
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let res
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host
      }
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      // The upstream is intermittently slow rather than consistently down
      // (confirmed: the same call succeeds seconds later), so a second,
      // shorter attempt often gets through where a single long wait
      // wouldn't - as long as the combined time stays under Vercel's own
      // ~10s function execution cap.
      if (attempt < maxRetries) {
        const nextTimeout = Math.max(2500, timeoutMs - 3000)
        return callRapidApi(path, params, { maxRetries, attempt: attempt + 1, timeoutMs: nextTimeout })
      }
      throw new Error('RapidAPI timed out')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`RapidAPI returned a non-JSON response (status ${res.status})`)
  }

  if (res.status === 429 && attempt < maxRetries) {
    await sleep(900 * (attempt + 1))
    return callRapidApi(path, params, { maxRetries, attempt: attempt + 1, timeoutMs })
  }

  if (res.status === 429) {
    const err = new Error('Be loatra ny fangatahana amin\'izao fotoana izao, andramo indray afaka kelikely')
    err.rateLimited = true
    throw err
  }

  if (!res.ok) {
    throw new Error(`RapidAPI request failed with status ${res.status}: ${text.slice(0, 300)}`)
  }

  return json
}

export function searchItems(keyword, page = 1, opts) {
  return callRapidApi('/1688/search-keyword', { keyword, page }, opts)
}

export function getItemDetail(itemId, opts) {
  // Detail lookups return far more data (images, SKU trees, description)
  // than a search row and are typically slower upstream - give the single
  // attempt most of the function's time budget instead of splitting it
  // into a retry, since a second full-length attempt would risk the
  // platform's own execution limit.
  return callRapidApi('/1688/detail', { itemId }, { timeoutMs: 8800, maxRetries: 0, ...opts })
}
