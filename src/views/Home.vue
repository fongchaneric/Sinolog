<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Banner from '../components/Banner.vue'
import QuickLinks from '../components/QuickLinks.vue'
import ProductCard from '../components/ProductCard.vue'
import { getTrendingProducts } from '../utils/api'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const products = ref([])

// Quick-search shortcuts shown as chips - each tap does a single normal
// search, so this list can be broader than the server's trending set.
const trendingKeywords = ['手机壳', '钥匙扣', '数据线', '内存卡', '蓝牙耳机', '充电宝']

async function loadTrending() {
  loading.value = true
  error.value = ''
  try {
    const data = await getTrendingProducts()
    products.value = data.items
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function goSearch(keyword) {
  router.push({ name: 'search', query: { q: keyword } })
}

onMounted(loadTrending)
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
    </section>
  </div>
</template>
