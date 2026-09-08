// JustOneAPI's exact response shape can vary between endpoints/plans.
// These helpers pick the first matching field name out of a list of
// candidates, so if the live response uses slightly different keys than
// expected you only need to add a candidate here rather than rewrite the UI.

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

export function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null

  const itemId = pick(raw, ['itemId', 'item_id', 'num_iid', 'numIid', 'offerId', 'offer_id', 'id', 'productId'])
  const title = pick(raw, ['title', 'subject', 'item_title', 'itemTitle', 'name', 'productName'])
  const image = pick(raw, ['image', 'imgUrl', 'img_url', 'pic_url', 'picUrl', 'main_image', 'mainImage', 'image_url', 'imageUrl', 'pictureUrl'])
  const rawPrice = pick(raw, ['price', 'promotion_price', 'promotionPrice', 'discount_price', 'discountPrice', 'min_price', 'minPrice'])
  const priceMax = pick(raw, ['max_price', 'maxPrice', 'origin_price', 'originPrice'])
  const sales = pick(raw, ['sales', 'sale_count', 'saleCount', 'sold', 'sold_quantity', 'soldQuantity', 'month_sold', 'monthSold', 'biz30day', 'trade_count', 'tradeCount'])
  const rating = pick(raw, ['rating', 'score', 'seller_rating', 'sellerRating', 'evaluate_rate', 'evaluateRate', 'star'])
  const shopName = pick(raw, ['shop_name', 'shopName', 'seller_nick', 'sellerNick', 'company_name', 'companyName', 'shopTitle', 'shop_title'])
  const link = pick(raw, ['detail_url', 'detailUrl', 'url', 'item_url', 'itemUrl', 'productUrl', 'product_url'])
  const moq = pick(raw, ['moq', 'min_order_quantity', 'minOrderQuantity', 'batch_number', 'batchNumber'])
  const unit = pick(raw, ['unit', 'unitName']) || 'pcs'

  if (!itemId && !title) return null

  return {
    itemId: itemId ? String(itemId) : null,
    title: title || '(anarana tsy fantatra)',
    image: image || '',
    price: toNumber(rawPrice),
    priceMax: toNumber(priceMax),
    sales: toNumber(sales),
    rating: toNumber(rating),
    shopName: shopName || '',
    link: link || (itemId ? `https://detail.1688.com/offer/${itemId}.html` : ''),
    moq: toNumber(moq) || 1,
    unit
  }
}

export function normalizeSearchResponse(raw, keyword, page) {
  const array = findFirstArray(raw) || []
  const items = array.map(normalizeItem).filter(Boolean)
  const total = pick(raw, ['total', 'totalResults', 'total_results', 'totalCount', 'total_count'])
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

export function normalizeDetailResponse(raw) {
  const base = normalizeItem(raw)
  if (!base) return null

  const imagesRaw = pick(raw, ['images', 'imageList', 'image_list', 'gallery', 'pics'])
  const images = Array.isArray(imagesRaw) && imagesRaw.length ? imagesRaw.map((i) => (typeof i === 'string' ? i : pick(i, ['url', 'image', 'imgUrl']))).filter(Boolean) : base.image ? [base.image] : []

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
