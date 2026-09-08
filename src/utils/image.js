// 1688's image CDN (alicdn.com) blocks hotlinking from other domains, so
// product images are routed through our own /api/image proxy instead of
// being loaded directly in <img> tags.
export function proxyImage(url) {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('.alicdn.com')) {
      return `/api/image?url=${encodeURIComponent(url)}`
    }
  } catch {
    // not a valid absolute URL - leave as-is
  }
  return url
}
