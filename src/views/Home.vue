<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getTrendingProducts } from '../utils/api'
import { getRecentSearches } from '../utils/recentSearches'
import { proxyImage } from '../utils/image'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const products = ref([])
const sentinel = ref(null)
let observer = null
let keywordCursor = 0

const loginTo = computed(() => (authStore.isLoggedIn ? { name: 'account' } : { name: 'login' }))

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

function goToSearch() {
  router.push({ name: 'search' })
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
    <!-- search-outerWrapper/search-wrapper/search-input/search-text/login-btn:
         ported from the reference capture's own header (a tap-to-search bar,
         not an inline input, plus its login button) - vw values converted to
         px at a 375px mobile design width, the whole page then capped to
         480px and centered for wider screens. The search glyph is CJ's real
         iconsousuo sprite icon (see CjIconSprite.vue), not the reference's
         own raster CDN image. -->
    <div class="search-outerWrapper">
      <div class="search-wrapper">
        <div class="search-input" @click="goToSearch">
          <span class="search-img"><svg viewBox="0 0 1024 1024"><use xlink:href="#iconsousuo" /></svg></span>
          <span class="search-text">Find the product you're looking for</span>
        </div>
        <router-link :to="loginTo" class="login-btn">Login</router-link>
      </div>
    </div>

    <div class="product-list">
      <div class="product-left">
        <a v-for="p in leftColumn" :key="p.itemId" href="#" class="goods-container" @click.prevent="router.push({ name: 'product', params: { itemId: p.itemId } })">
          <div class="tuipin-main-img-box">
            <img class="tuipin-main-img" loading="lazy" :src="proxyImage(p.image) || fallbackImg" :alt="p.title" @error="$event.target.src = fallbackImg" />
            <div class="tuipin-offerImage-mask"></div>
          </div>
          <div class="goods-content">
            <span class="goods-title">{{ p.title }}</span>
            <div class="priceArea">
              <span class="current-tag">¥</span>
              <span class="current-money">{{ p.price === null ? '0.00' : p.price.toFixed(2) }}</span>
              <span v-if="p.sales" class="sold-out">{{ p.sales }} sold</span>
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
              <span class="current-tag">¥</span>
              <span class="current-money">{{ p.price === null ? '0.00' : p.price.toFixed(2) }}</span>
              <span v-if="p.sales" class="sold-out">{{ p.sales }} sold</span>
            </div>
          </div>
        </a>
      </div>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div v-for="i in 6" :key="i" class="skeleton-card animate-pulse" />
    </div>

    <div v-else-if="error" class="text-center text-sm text-gray-500 py-10 px-4">
      <p>{{ error }}</p>
      <p class="text-xs mt-1 text-gray-400">Check that CJ_API_KEY, CJ_API_EMAIL and CJ_API_BASE_URL are configured on Vercel.</p>
    </div>

    <div v-else-if="!products.length" class="text-center text-sm text-gray-400 py-10">—</div>

    <div ref="sentinel" class="h-1" />
    <div v-if="loadingMore" class="flex flex-col items-center py-3 text-gray-400">
      <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
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
/* Ported 1:1 from the reference capture's own CSS (vw values converted to
   px at a 375px mobile design width - the file's own component stylesheet,
   not its generic box-reset block, wins wherever the two conflicted, e.g.
   footerBar's !important height/position). The whole page is capped at a
   480px centered column so it doesn't stretch edge-to-edge on wide screens. */
.home-page {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f2f2f2;
  padding-bottom: 95px;
}

.search-outerWrapper {
  width: 100%;
  padding: 9px 0;
  background-color: #fff;
}
.search-wrapper {
  display: flex;
  width: 95.2%;
  margin: 0 auto;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 35px;
}
.search-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  border: 1.5px solid #ff6200;
  width: 294px;
  flex: 1;
  border-radius: 6px;
  margin: 0 9px 0 0;
  background-color: #fff;
  padding: 0 8px;
  cursor: pointer;
}
.search-img {
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  color: #999;
  flex-shrink: 0;
}
.search-img svg {
  width: 100%;
  height: 100%;
}
.search-text {
  flex: 1;
  min-width: 0;
  height: 35px;
  line-height: 35px;
  padding-left: 6px;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.login-btn {
  width: 54px;
  height: 35px;
  flex-shrink: 0;
  border-radius: 6px;
  background-color: #ff7044;
  font-size: 15px;
  line-height: 35px;
  color: #fff;
  text-align: center;
}

.product-list {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 9px 9px 0;
}
.product-left,
.product-right {
  display: flex;
  flex-direction: column;
  width: 46.4%;
}
.goods-container {
  display: flex;
  flex-direction: column;
  background: #fff;
  margin-bottom: 9px;
  border-radius: 6px;
  overflow: hidden;
}
.tuipin-main-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
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
  padding: 9px;
  position: relative;
}
.goods-title {
  display: block;
  font-size: 14px;
  white-space: nowrap;
  line-height: 16px;
  color: #222;
  text-overflow: ellipsis;
  overflow: hidden;
}
.priceArea {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  margin-top: 10px;
}
.current-tag {
  font-size: 12px;
  line-height: 14px;
  font-weight: 500;
  color: rgb(255, 41, 0);
}
.current-money {
  font-size: 16px;
  font-weight: 500;
  color: rgb(255, 41, 0);
  height: 16px;
  line-height: 16px;
}
.sold-out {
  font-size: 12px;
  color: rgb(136, 136, 136);
  margin-left: 6px;
}

.skeleton-list {
  display: flex;
  gap: 9px;
  padding: 0 9px;
}
.skeleton-card {
  flex: 1;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  background: #e5e5e5;
}

.footerBar {
  height: 83px !important;
  position: fixed !important;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
  background-color: #fff;
  z-index: 30;
}
.footerBarCon {
  width: 100%;
  height: 100%;
  padding: 0 41px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
}
.tab-item {
  height: 38px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-top: 7px;
  color: #222;
}
.tab-img {
  width: 20px;
  height: 20px;
  color: #999;
}
.tab-text {
  font-size: 11px !important;
  margin-top: 7.5px;
  line-height: 11px;
  color: #222;
}
.active-image {
  width: 37px;
  height: 37px;
  color: #ff6a00;
}
</style>
