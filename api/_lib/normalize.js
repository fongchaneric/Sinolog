// The upstream (RapidAPI's taobao-1688-api1, /v53/search and /v53/detail)
// doesn't have reachable field-level documentation, so these helpers stay
// defensive: every field is looked up under a list of candidate names,
// including both plain Taobao/1688 scraper conventions (num_iid, pic_url,
// promotion_price, seller_nick...) and the "smart_ui_offer" cell shape seen
// from a previous provider (offerId, priceInfo, odPicUrl, shop.text...),
// in case either turns up in the real response. Use api/search?raw=1 or
// api/product?raw=1 to inspect the actual payload and correct any mapping
// that turns out wrong.

function pick(obj, candidates) {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of candidates) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return undefined
}

function toNumber(value) {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return value
  const match = String(value).match(/[\d.]+/)
  return match ? parseFloat(match[0]) : null
}

function stripHtml(value) {
  if (!value) return ''
  return String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Sales/booking counters on 1688 are Chinese-formatted strings like
// "全网10万+件" (100,000+) or "已售2800+件" (2,800+) - extract a plain number.
function parseChineseCount(text) {
  if (!text) return null
  const str = String(text)
  const wan = str.match(/([\d.]+)\s*万/)
  if (wan) return Math.round(parseFloat(wan[1]) * 10000)
  const num = str.match(/[\d,]+/)
  if (num) return parseInt(num[0].replace(/,/g, ''), 10)
  return null
}

// First wholesale tier's quantity string (e.g. "50~499个", "≥1000个") gives
// a reasonable minimum order quantity when no explicit MOQ field exists.
function parseMoqFromTier(quantityText) {
  if (!quantityText) return null
  const match = String(quantityText).match(/[\d.]+/)
  return match ? parseInt(match[0], 10) : null
}

function findFirstArray(node, depth = 0) {
  if (depth > 6 || node === null || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'object') return node
    return null
  }
  const priorityKeys = ['items', 'item_list', 'itemList', 'list', 'result_list', 'resultList', 'goods', 'data']
  for (const key of priorityKeys) {
    if (node[key]) {
      const found = findFirstArray(node[key], depth + 1)
      if (found) return found
    }
  }
  for (const value of Object.values(node)) {
    const found = findFirstArray(value, depth + 1)
    if (found) return found
  }
  return null
}

export function normalizeItem(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') return null

  // Unwrap the 1688 "smart_ui_offer" cell wrapper when present.
  const inner = rawEntry.data
  const raw = inner && typeof inner === 'object' && (inner.offerId || inner.title) ? inner : rawEntry

  const itemId = pick(raw, ['offerId', 'itemId', 'item_id', 'num_iid', 'numIid', 'id', 'productId'])
  const rawTitle = pick(raw, ['title', 'subject', 'item_title', 'itemTitle', 'name', 'productName'])
  const title = stripHtml(rawTitle)

  let image = pick(raw, ['odPicUrl', 'image', 'imgUrl', 'img_url', 'pic_url', 'picUrl', 'pic', 'main_image', 'mainImage', 'image_url', 'imageUrl'])
  if (!image) {
    const offerPic = pick(raw, ['offerPicUrl', 'pictureUrl'])
    if (offerPic) image = String(offerPic).split(',')[0].trim()
  }

  const priceInfo = raw.priceInfo && typeof raw.priceInfo === 'object' ? raw.priceInfo : null
  const rawPrice = priceInfo
    ? pick(priceInfo, ['price'])
    : pick(raw, ['price', 'promotion_price', 'promotionPrice', 'discount_price', 'min_price', 'view_price', 'zk_final_price'])

  const afterPriceText = raw.afterPrice && typeof raw.afterPrice === 'object' ? pick(raw.afterPrice, ['text']) : null
  const sales = parseChineseCount(afterPriceText) ?? toNumber(pick(raw, ['bookedCount', 'sales', 'sold', 'sold_quantity', 'trade_count', 'sales_count', 'volume']))

  const tradeService = raw.shopAddition?.tradeService
  const rating = toNumber(tradeService ? pick(tradeService, ['compositeNewScore', 'goodsScore']) : pick(raw, ['rating', 'score', 'star']))

  const shopName =
    (raw.shop && typeof raw.shop === 'object' ? pick(raw.shop, ['text']) : null) ||
    pick(raw, ['shop_name', 'shopName', 'seller_nick', 'nick', 'company_name', 'company'])

  const link = pick(raw, ['linkUrl', 'detail_url', 'detailUrl', 'url', 'landing_url', 'item_url', 'click_url', 'product_url'])

  const quantityPrices = raw.shopAddition?.quantityPrices
  const moqFromTier = Array.isArray(quantityPrices) && quantityPrices.length ? parseMoqFromTier(pick(quantityPrices[0], ['quantity'])) : null
  const moq = pick(raw, ['moq', 'min_order_quantity', 'minOrderQuantity']) || moqFromTier

  const unit = pick(raw, ['unit', 'unitName']) || 'pcs'

  if (!itemId && !title) return null

  return {
    itemId: itemId ? String(itemId) : null,
    title: title || '(anarana tsy fantatra)',
    image: image || '',
    price: toNumber(rawPrice),
    priceMax: null,
    sales,
    rating,
    shopName: shopName || '',
    link: link || (itemId ? `https://detail.1688.com/offer/${itemId}.html` : ''),
    moq: toNumber(moq) || 1,
    unit
  }
}

export function normalizeSearchResponse(raw, keyword, page) {
  const array = findFirstArray(raw) || []
  const items = array.map(normalizeItem).filter(Boolean)
  const total = raw?.data?.data?.found ?? pick(raw, ['total', 'totalResults', 'total_results', 'totalCount', 'total_count', 'total_results_count'])
  return {
    keyword,
    page: Number(page) || 1,
    total: toNumber(total) ?? items.length,
    items
  }
}

function normalizeSkuGroups(raw) {
  const groups = pick(raw, ['props', 'propGroups', 'prop_groups', 'skuProps', 'sku_props', 'attributes'])
  if (!Array.isArray(groups)) return []
  return groups
    .map((group) => {
      const name = pick(group, ['name', 'propName', 'prop_name', 'title'])
      const values = pick(group, ['values', 'value', 'options']) || []
      if (!Array.isArray(values)) return null
      return {
        name: name || '',
        values: values
          .map((v) => ({
            name: pick(v, ['name', 'value', 'valueName', 'value_name']) || String(v),
            image: pick(v, ['image', 'imgUrl', 'img_url', 'pic']) || ''
          }))
          .filter((v) => v.name)
      }
    })
    .filter((g) => g && g.values && g.values.length)
}

function normalizeSkus(raw) {
  const list = pick(raw, ['skus', 'sku_list', 'skuList', 'variants'])
  if (!Array.isArray(list)) return []
  return list.map((sku) => ({
    skuId: String(pick(sku, ['skuId', 'sku_id', 'id']) || ''),
    specs: pick(sku, ['specs', 'properties', 'propsName', 'props_name']) || pick(sku, ['name', 'skuName', 'sku_name']) || '',
    price: toNumber(pick(sku, ['price', 'promotion_price', 'promotionPrice'])),
    image: pick(sku, ['image', 'imgUrl', 'img_url', 'pic']) || '',
    stock: toNumber(pick(sku, ['stock', 'quantity', 'amountOnSale', 'amount_on_sale'])) ?? 99999
  }))
}

function normalizePriceTiers(raw) {
  const quantityPrices = raw.shopAddition?.quantityPrices
  if (Array.isArray(quantityPrices) && quantityPrices.length) {
    return quantityPrices
      .map((tier) => ({
        minQty: parseMoqFromTier(pick(tier, ['quantity'])) || 1,
        price: toNumber(pick(tier, ['value', 'price']))
      }))
      .filter((t) => t.price !== null)
      .sort((a, b) => a.minQty - b.minQty)
  }
  const tiers = pick(raw, ['priceRange', 'price_range', 'priceTiers', 'price_tiers', 'wholesale', 'wholesalePrices'])
  if (!Array.isArray(tiers)) return []
  return tiers
    .map((tier) => ({
      minQty: toNumber(pick(tier, ['minQuantity', 'min_quantity', 'startQuantity', 'start_quantity', 'begin_num', 'beginNum'])) || 1,
      price: toNumber(pick(tier, ['price', 'unitPrice', 'unit_price']))
    }))
    .filter((t) => t.price !== null)
    .sort((a, b) => a.minQty - b.minQty)
}

// The "1688 open platform" style shape a real RapidAPI "Detail Product
// 1688" response is in - confirmed via the RapidAPI console: { success,
// data: { offerModel: { offerId, subject, imageList, currentPriceDisplay,
// saleQuantity, companyName, detailUrl, offerBeginAmount, unit, videoUrl,
// skuProps, skuList, ... }, skuModel: { offerBaseInfo, skuModel:
// { skuInfoMapOriginal }, orderParamModel }, description }, code }.
function parsePriceRangeDisplay(text) {
  if (!text) return { min: null, max: null }
  const parts = String(text).split('-').map((s) => parseFloat(s))
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { min: parts[0], max: parts[1] }
  }
  const single = toNumber(text)
  return { min: single, max: single }
}

function normalizeOfferModelDetail(container) {
  const offer = container.offerModel
  const skuModel = container.skuModel
  const offerId = offer.offerId || skuModel?.offerBaseInfo?.offerId
  const title = stripHtml(offer.subject || skuModel?.offerBaseInfo?.title)
  const images = Array.isArray(offer.imageList) && offer.imageList.length ? offer.imageList : offer.coverUrl ? [offer.coverUrl] : []
  const image = images[0] || ''

  const { min: price, max: priceMax } = parsePriceRangeDisplay(offer.currentPriceDisplay || offer.originPriceDisplay)
  const sales = parseChineseCount(offer.saleQuantity) ?? toNumber(offer.saleQuantity)
  const shopName = offer.companyName || skuModel?.offerBaseInfo?.sellerLoginId || ''
  const link = offer.detailUrl || (offerId ? `https://detail.1688.com/offer/${offerId}.html` : '')
  const moq = toNumber(offer.offerBeginAmount) || 1
  const unit = offer.unit || 'pcs'
  const description = container.description || ''
  const video = offer.videoUrl || ''

  const propGroups = Array.isArray(offer.skuProps)
    ? offer.skuProps
        .map((group) => ({
          name: group.prop || '',
          values: Array.isArray(group.value)
            ? group.value.map((v) => ({ name: v.name || '', image: v.imageUrl || '' })).filter((v) => v.name)
            : []
        }))
        .filter((g) => g.values.length)
    : []

  const imageByName = {}
  for (const group of propGroups) {
    for (const v of group.values) {
      if (v.name && v.image) imageByName[v.name] = v.image
    }
  }

  const skuInfoMap = skuModel?.skuModel?.skuInfoMapOriginal
  let skus = []
  if (skuInfoMap && typeof skuInfoMap === 'object') {
    skus = Object.entries(skuInfoMap).map(([name, info]) => ({
      skuId: String(info.skuId || ''),
      specs: info.specAttrs || name,
      price: toNumber(info.discountPrice ?? info.price),
      image: imageByName[name] || image,
      stock: toNumber(info.canBookCount) ?? 99999
    }))
  } else if (Array.isArray(offer.skuList)) {
    skus = offer.skuList.map((sku) => ({
      skuId: '',
      specs: sku.name || '',
      price: toNumber(sku.discountPrice ?? sku.price),
      image: sku.imageUrl || image,
      stock: toNumber(sku.canBookCount) ?? 99999
    }))
  }

  const skuRangePrices = skuModel?.orderParamModel?.orderParam?.skuParam?.skuRangePrices
  const priceTiers = Array.isArray(skuRangePrices)
    ? [...new Map(
        skuRangePrices.map((t) => [toNumber(t.beginAmount) || 1, toNumber(t.price)]).filter(([, p]) => p !== null)
      ).entries()]
        .map(([minQty, tierPrice]) => ({ minQty, price: tierPrice }))
        .sort((a, b) => a.minQty - b.minQty)
    : []

  return {
    itemId: offerId ? String(offerId) : null,
    title: title || '(anarana tsy fantatra)',
    image,
    price,
    priceMax: priceMax && priceMax !== price ? priceMax : null,
    sales,
    rating: null,
    shopName,
    link,
    moq,
    unit,
    images,
    description,
    video,
    priceTiers,
    propGroups,
    skus
  }
}

export function normalizeDetailResponse(rawEntry) {
  const container = rawEntry?.data && typeof rawEntry.data === 'object' ? rawEntry.data : rawEntry
  if (container?.offerModel && typeof container.offerModel === 'object') {
    return normalizeOfferModelDetail(container)
  }

  // Fallback for an unrecognized/older shape - stay defensive.
  const inner = rawEntry?.data
  const raw = inner && typeof inner === 'object' && (inner.offerId || inner.title) ? inner : rawEntry

  const base = normalizeItem(rawEntry)
  if (!base) return null

  const imagesRaw = pick(raw, ['images', 'imageList', 'image_list', 'gallery', 'pics'])
  let images = Array.isArray(imagesRaw) && imagesRaw.length ? imagesRaw.map((i) => (typeof i === 'string' ? i : pick(i, ['url', 'image', 'imgUrl']))).filter(Boolean) : []
  if (!images.length) {
    const offerPic = pick(raw, ['offerPicUrl', 'pictureUrl'])
    if (offerPic) images = String(offerPic).split(',').map((s) => s.trim()).filter(Boolean)
  }
  if (!images.length && base.image) images = [base.image]

  const description = pick(raw, ['description', 'desc', 'detailHtml', 'detail_html', 'content'])
  const video = pick(raw, ['video', 'videoUrl', 'video_url'])

  return {
    ...base,
    images,
    description: description || '',
    video: video || '',
    priceTiers: normalizePriceTiers(raw),
    propGroups: normalizeSkuGroups(raw),
    skus: normalizeSkus(raw)
  }
}
