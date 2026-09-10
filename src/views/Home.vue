<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { getTrendingProducts } from '../utils/api'
import { getRecentSearches } from '../utils/recentSearches'

const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const products = ref([])
const sentinel = ref(null)
let observer = null
let keywordCursor = 0

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
  <div class="max-w-7xl mx-auto">
    <!-- delay-tip-wrap/delay-tip-container: CJ's own scrolling promo-strip
         markup and styling, carrying Sinolog's own message instead of
         their conference ad (the only thing in the reference that isn't
         literally reusable as-is, since it's CJ-brand-specific copy). -->
    <div class="delay-tip-wrap">
      <div class="delay-tip-container">
        <span class="delay-tip-icon">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6v-5a7 7 0 10-14 0v5l-1.6 1.6a1 1 0 00.7 1.7h15.8a1 1 0 00.7-1.7L19 16z" /></svg>
        </span>
        <div class="delay-tip-container-content">
          <p class="delay-tip-container-words">We buy and ship for you from China - pay safely by Mobile Money</p>
          <p class="delay-tip-container-words">We buy and ship for you from China - pay safely by Mobile Money</p>
        </div>
        <div class="delay-forward-icon-mask"></div>
        <span class="delay-forward-icon"><svg viewBox="0 0 1024 1024"><use xlink:href="#iconyoujiantou" /></svg></span>
      </div>
    </div>

    <section class="fulfill-product-wrap">
      <div class="fulfill-product-content">
        <div v-if="loading" class="fulfill-product-list-wrap">
          <div v-for="i in 8" :key="i" class="fulfill-product-item animate-pulse">
            <div class="fulfill-product-item-img bg-gray-100" />
          </div>
        </div>

        <div v-else-if="error" class="text-center text-sm text-gray-500 py-10">
          <p>{{ error }}</p>
          <p class="text-xs mt-1 text-gray-400">Check that CJ_API_KEY, CJ_API_EMAIL and CJ_API_BASE_URL are configured on Vercel.</p>
        </div>

        <div v-else-if="!products.length" class="text-center text-sm text-gray-400 py-10">—</div>

        <div v-else class="fulfill-product-list-wrap">
          <ProductCard v-for="p in products" :key="p.itemId" :product="p" />
        </div>

        <div ref="sentinel" class="h-1" />
        <div v-if="loadingMore" class="flex flex-col items-center py-3 gap-1.5 text-gray-400 text-sm">
          <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Ported 1:1 from the reference file's own promo-strip and product-grid
   wrapper CSS (rem -> px at 37.5px/rem). */
.delay-tip-wrap {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 8px 0;
}
.delay-tip-container {
  width: 100%;
  max-width: 346px;
  position: relative;
  height: 32px;
  background-color: #fb544c;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.delay-tip-icon {
  margin: 0 4px 0 12px;
  display: flex;
  flex-shrink: 0;
}
.delay-tip-container-content {
  white-space: nowrap;
  overflow: hidden;
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  width: 100%;
}
.delay-tip-container-words {
  position: relative;
  display: inline-block;
  animation: cj-marquee 14s linear infinite;
  padding-left: 40px;
}
@keyframes cj-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}
.delay-forward-icon-mask {
  position: absolute;
  right: 17px;
  width: 15px;
  height: 30px;
  background: linear-gradient(to right, rgba(251, 84, 76, 0), rgba(251, 84, 76, 0.9));
}
.delay-forward-icon {
  font-size: 16px;
  color: #fff;
  margin-right: 6px;
  z-index: 1;
  display: flex;
}
.delay-forward-icon svg {
  width: 16px;
  height: 16px;
}

.fulfill-product-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  background-color: #fff;
}
.fulfill-product-content {
  margin: 0 12px;
  width: 100%;
}
.fulfill-product-list-wrap {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0 8px;
}
@media (min-width: 640px) {
  .fulfill-product-list-wrap {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (min-width: 1024px) {
  .fulfill-product-list-wrap {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
