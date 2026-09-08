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

async function callJustOneApi(path, params) {
  const token = getToken()
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('token', token)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString())
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`JustOneAPI returned a non-JSON response (status ${res.status})`)
  }
  if (!res.ok) {
    throw new Error(`JustOneAPI request failed with status ${res.status}: ${text.slice(0, 300)}`)
  }
  return json
}

export function searchItems(keyword, page = 1) {
  return callJustOneApi('/search-item-list/v1', { keyword, page })
}

export function getItemDetail(itemId) {
  return callJustOneApi('/get-item-detail/v1', { itemId })
}
