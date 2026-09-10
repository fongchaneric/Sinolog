<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTrendingProducts } from '../utils/api'
import { getRecentSearches } from '../utils/recentSearches'
import { proxyImage } from '../utils/image'
import { CNY_TO_USD } from '../utils/currency'

const router = useRouter()

const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const products = ref([])
const sentinel = ref(null)
let observer = null
let keywordCursor = 0

// Two independently-stacked columns (not a CSS grid) - the same manual
// waterfall split the reference page itself uses, so card heights don't
// need to line up across columns.
const leftColumn = computed(() => products.value.filter((_, i) => i % 2 === 0))
const rightColumn = computed(() => products.value.filter((_, i) => i % 2 === 1))

const fallbackImg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23eee"/%3E%3C/svg%3E'

// Leans the trending grid toward the buyer's own last few searches once
// they have any, but not exclusively - every third batch falls back to
// the server's own generic default keyword so the grid isn't 100% just
// their history.
function nextKeyword() {
  const recent = getRecentSearches()
  if (!recent.length) return undefined
  keywordCursor++
  if (keywordCursor % 3 === 0) return undefined
  return recent[keywordCursor % recent.length]
}

async function loadBatch(isInitial) {
  if (isInitial) {
    loading.value = true
    error.value = ''
  } else {
    if (loading.value || loadingMore.value) return
    loadingMore.value = true
  }
  try {
    const data = await getTrendingProducts({ keyword: nextKeyword() })
    products.value = isInitial ? data.items : [...products.value, ...data.items]
  } catch (e) {
    if (isInitial) error.value = e.message
    // A failed "load more" attempt just stays quiet - the grid already has content,
    // and the next scroll trigger will simply try again.
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// product.price is stored in CNY (see api/_lib/normalize.js); converted
// back to the USD the card actually displays a "$" prefix for.
function priceUsd(p) {
  return p.price === null ? '0.00' : (p.price * CNY_TO_USD).toFixed(2)
}

onMounted(() => {
  loadBatch(true)
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadBatch(false)
    },
    { rootMargin: '400px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="home-page">
    <!-- Home no longer draws its own header - it uses the shared
         AppHeader.vue (App.vue), which already matches the site's real
         header reference, so there's exactly one header design site-wide. -->
    <!-- Skeleton is the same product-list/goods-container structure and
         sizing as the real grid below (not a generic placeholder row), so
         the layout never jumps from a small loading shape to bigger real
         cards once data arrives. -->
    <div v-if="loading" class="product-list">
      <div class="product-left">
        <div v-for="i in 3" :key="i" class="goods-container skeleton-goods">
          <div class="tuipin-main-img-box animate-pulse"></div>
          <div class="goods-content">
            <div class="skeleton-line skeleton-line-title animate-pulse"></div>
            <div class="skeleton-line skeleton-line-price animate-pulse"></div>
          </div>
        </div>
      </div>
      <div class="product-right">
        <div v-for="i in 3" :key="i" class="goods-container skeleton-goods">
          <div class="tuipin-main-img-box animate-pulse"></div>
          <div class="goods-content">
            <div class="skeleton-line skeleton-line-title animate-pulse"></div>
            <div class="skeleton-line skeleton-line-price animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="text-center text-sm text-gray-500 py-10 px-4">
      <p>{{ error }}</p>
      <p class="text-xs mt-1 text-gray-400">Check that CJ_API_KEY, CJ_API_EMAIL and CJ_API_BASE_URL are configured on Vercel.</p>
    </div>

    <div v-else-if="!products.length" class="text-center text-sm text-gray-400 py-10">—</div>

    <div v-else class="product-list">
      <div class="product-left">
        <a v-for="p in leftColumn" :key="p.itemId" href="#" class="goods-container" @click.prevent="router.push({ name: 'product', params: { itemId: p.itemId } })">
          <div class="tuipin-main-img-box">
            <img class="tuipin-main-img" loading="lazy" :src="proxyImage(p.image) || fallbackImg" :alt="p.title" @error="$event.target.src = fallbackImg" />
            <div class="tuipin-offerImage-mask"></div>
          </div>
          <div class="goods-content">
            <span class="goods-title">{{ p.title }}</span>
            <div class="priceArea">
              <span class="current-tag">$</span>
              <span class="current-money">{{ priceUsd(p) }}</span>
              <span v-if="p.sales" class="sold-out">{{ p.sales }} Lists</span>
            </div>
          </div>
        </a>
      </div>
      <div class="product-right">
        <a v-for="p in rightColumn" :key="p.itemId" href="#" class="goods-container" @click.prevent="router.push({ name: 'product', params: { itemId: p.itemId } })">
          <div class="tuipin-main-img-box">
            <img class="tuipin-main-img" loading="lazy" :src="proxyImage(p.image) || fallbackImg" :alt="p.title" @error="$event.target.src = fallbackImg" />
            <div class="tuipin-offerImage-mask"></div>
          </div>
          <div class="goods-content">
            <span class="goods-title">{{ p.title }}</span>
            <div class="priceArea">
              <span class="current-tag">$</span>
              <span class="current-money">{{ priceUsd(p) }}</span>
              <span v-if="p.sales" class="sold-out">{{ p.sales }} Lists</span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div ref="sentinel" class="h-1" />
    <!-- Full card-shaped placeholders (not just a small spinner) so a fast
         fling never outruns the fetch into visibly blank background - the
         next batch's shape is already there, just empty, while it loads. -->
    <div v-if="loadingMore" class="product-list">
      <div class="product-left">
        <div v-for="i in 2" :key="i" class="goods-container skeleton-goods">
          <div class="tuipin-main-img-box animate-pulse"></div>
          <div class="goods-content">
            <div class="skeleton-line skeleton-line-title animate-pulse"></div>
            <div class="skeleton-line skeleton-line-price animate-pulse"></div>
          </div>
        </div>
      </div>
      <div class="product-right">
        <div v-for="i in 2" :key="i" class="goods-container skeleton-goods">
          <div class="tuipin-main-img-box animate-pulse"></div>
          <div class="goods-content">
            <div class="skeleton-line skeleton-line-title animate-pulse"></div>
            <div class="skeleton-line skeleton-line-price animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- footerBar/footerBarCon/tab-item/tab-img/tab-text/active-image:
         ported from the reference's own fixed tab bar, using CJ's real
         sprite icons (iconhome/iconMessage/iconcart/iconAccount) instead
         of its raster CDN images. -->
    <div class="footerBar">
      <div class="footerBarCon">
        <router-link :to="{ name: 'home' }" class="tab-item">
          <svg class="active-image" viewBox="0 0 1024 1024"><use xlink:href="#iconhome" /></svg>
          <span class="tab-text">Home</span>
        </router-link>
        <router-link :to="{ name: 'orders' }" class="tab-item">
          <svg class="tab-img" viewBox="0 0 1024 1024"><use xlink:href="#iconMessage" /></svg>
          <span class="tab-text">Message</span>
        </router-link>
        <router-link :to="{ name: 'cart' }" class="tab-item">
          <svg class="tab-img" viewBox="0 0 1024 1024"><use xlink:href="#iconcart" /></svg>
          <span class="tab-text">Cart</span>
        </router-link>
        <router-link :to="{ name: 'account' }" class="tab-item">
          <svg class="tab-img" viewBox="0 0 1024 1024"><use xlink:href="#iconAccount" /></svg>
          <span class="tab-text">Me</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ported 1:1 from the reference capture's own CSS, in its own vw units
   (unconverted) rather than an approximated px scale - vw is already
   viewport-relative, so copying the values as-is is the only way to get
   truly identical proportions on a real device instead of an
   approximation that drifts from the reference on anything other than
   one assumed screen width. The file's own component stylesheet, not
   its generic box-reset block, wins wherever the two conflicted, e.g.
   footerBar's !important height/position. */
.home-page {
  width: 100vw;
  min-height: 100vh;
  background-color: #f2f2f2;
  padding-bottom: 17vw;
  overflow-x: hidden;
}

.product-list {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100vw;
  padding: 2.4vw 2.4vw 0;
  box-sizing: border-box;
}
.product-left,
.product-right {
  display: flex;
  flex-direction: column;
  width: 46.4vw;
}
.goods-container {
  display: flex;
  flex-direction: column;
  width: 46.4vw;
  background: #fff;
  margin-bottom: 2.4vw;
  border-radius: 1.6vw;
  overflow: hidden;
  box-sizing: border-box;
}
.tuipin-main-img-box {
  position: relative;
  width: 46.4vw;
  height: 46.4vw;
  background-color: #eee;
}
.tuipin-main-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.tuipin-offerImage-mask {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.08);
}
.goods-content {
  padding: 2.4vw;
  position: relative;
  width: 46.4vw;
  box-sizing: border-box;
}
.goods-title {
  display: block;
  font-size: 3.7333vw;
  white-space: nowrap;
  line-height: 4.2667vw;
  color: #222;
  width: 41.6vw;
  text-overflow: ellipsis;
  overflow: hidden;
}
.priceArea {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  width: 41.6vw;
  height: 4.2667vw;
  margin-top: 2.6667vw;
}
.current-tag {
  font-size: 3.2vw;
  line-height: 3.7333vw;
  font-weight: 500;
  color: rgb(255, 41, 0);
}
.current-money {
  font-size: 4.2667vw;
  font-weight: 500;
  color: rgb(255, 41, 0);
  height: 4.2667vw;
  line-height: 4.2667vw;
}
.sold-out {
  font-size: 3.2vw;
  color: rgb(136, 136, 136);
  margin-left: 1.6vw;
}

.skeleton-goods {
  pointer-events: none;
}
.skeleton-goods .tuipin-main-img-box {
  background-color: #e5e5e5;
}
.skeleton-line {
  border-radius: 1vw;
  background-color: #e5e5e5;
}
.skeleton-line-title {
  width: 80%;
  height: 3.7333vw;
}
.skeleton-line-price {
  width: 40%;
  height: 4.2667vw;
  margin-top: 2.6667vw;
}

.footerBar {
  height: 15vw !important;
  position: fixed !important;
  left: 0;
  bottom: 0;
  width: 100vw;
  overflow: hidden;
  background-color: #fff;
  z-index: 30;
}
.footerBarCon {
  width: 100vw;
  height: 100%;
  padding: 0 11.06667vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
}
.tab-item {
  height: 10.13333vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 1.86667vw;
  color: #222;
}
.tab-img {
  width: 6.4vw;
  height: 6.4vw;
  color: #999;
}
.tab-text {
  font-size: 2.93333vw !important;
  margin-top: 2vw;
  line-height: 2.93333vw;
  color: #222;
}
.active-image {
  width: 11.2vw;
  height: 11.2vw;
  color: #ff6a00;
}
</style>
