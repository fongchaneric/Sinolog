<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Banner from '../components/Banner.vue'
import QuickLinks from '../components/QuickLinks.vue'
import ProductCard from '../components/ProductCard.vue'
import { getTrendingProducts } from '../utils/api'
import { getRecentSearches, addRecentSearch } from '../utils/recentSearches'

const router = useRouter()
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const products = ref([])
const noMore = ref(false)
const sentinel = ref(null)
let observer = null
let keywordCursor = 0

// Quick-search shortcuts shown as chips - each tap does a single normal
// search, so this list can be broader than the server's trending set.
const trendingKeywords = ['手机壳', '钥匙扣', '数据线', '内存卡', '蓝牙耳机', '充电宝']

// Leans the trending grid toward the buyer's own last few searches once
// they have any, cycling through them one at a time per batch; falls back
// to the server's own random default keyword when there's no history yet.
function nextKeyword() {
  const recent = getRecentSearches()
  if (!recent.length) return undefined
  const kw = recent[keywordCursor % recent.length]
  keywordCursor++
  return kw
}

async function loadBatch(isInitial) {
  if (isInitial) {
    loading.value = true
    error.value = ''
  } else {
    if (loading.value || loadingMore.value || noMore.value) return
    loadingMore.value = true
  }
  try {
    const data = await getTrendingProducts(nextKeyword())
    if (!data.items.length) {
      noMore.value = true
    } else {
      products.value = isInitial ? data.items : [...products.value, ...data.items]
    }
  } catch (e) {
    if (isInitial) error.value = e.message
    // A failed "load more" attempt just stays quiet - the grid already has content.
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function goSearch(keyword) {
  addRecentSearch(keyword)
  router.push({ name: 'search', query: { q: keyword } })
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
    <Banner />
    <QuickLinks />

    <div class="bg-orange-50 mx-2 mt-2 rounded-lg px-3 py-2.5 flex items-center justify-between text-xs text-brand-dark">
      <span class="flex items-center gap-1.5 font-medium">🛡️ Sinolog Guarantee — thousands of companies, worldwide</span>
      <span>›</span>
    </div>

    <div class="flex gap-2 px-2 pt-3 overflow-x-auto no-scrollbar">
      <button
        v-for="k in trendingKeywords"
        :key="k"
        @click="goSearch(k)"
        class="shrink-0 text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600"
      >
        {{ k }}
      </button>
    </div>

    <section class="px-2 pt-3 pb-6">
      <h2 class="text-base font-bold text-gray-800 mb-2 px-1">Trending now</h2>

      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <div v-for="i in 8" :key="i" class="card aspect-[3/4] animate-pulse bg-gray-100" />
      </div>

      <div v-else-if="error" class="text-center text-sm text-gray-500 py-10">
        <p>{{ error }}</p>
        <p class="text-xs mt-1 text-gray-400">Check that CJ_API_KEY, CJ_API_EMAIL and CJ_API_BASE_URL are configured on Vercel.</p>
      </div>

      <div v-else-if="!products.length" class="text-center text-sm text-gray-400 py-10">
        <p>No products found right now.</p>
        <p class="text-xs mt-1">Try another keyword above, or try again in a moment.</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <ProductCard v-for="p in products" :key="p.itemId" :product="p" />
      </div>

      <div ref="sentinel" class="h-1" />
      <div v-if="loadingMore" class="flex flex-col items-center py-6 gap-2 text-gray-400 text-sm">
        <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </section>
  </div>
</template>
