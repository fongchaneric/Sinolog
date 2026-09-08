<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { searchProducts } from '../utils/api'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const items = ref([])
const total = ref(0)

async function load() {
  const keyword = (route.query.q || '').toString()
  if (!keyword) {
    items.value = []
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await searchProducts(keyword)
    items.value = data.items
    total.value = data.total
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => route.query.q, load)
onMounted(load)
</script>

<template>
  <div class="max-w-7xl mx-auto px-2 py-3">
    <p class="text-sm text-gray-500 mb-2">
      Résultats pour "<span class="font-semibold text-gray-700">{{ route.query.q }}</span>"
      <span v-if="total">— {{ total }} produits</span>
    </p>

    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
      <div v-for="i in 10" :key="i" class="card aspect-[3/4] animate-pulse bg-gray-100" />
    </div>

    <div v-else-if="error" class="text-center text-sm text-gray-500 py-16">
      <p>{{ error }}</p>
      <button class="btn-brand mt-4" @click="load">Réessayer</button>
    </div>

    <div v-else-if="!items.length" class="text-center text-sm text-gray-400 py-16">
      Aucun produit trouvé. Essayez un autre mot-clé.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
      <ProductCard v-for="p in items" :key="p.itemId" :product="p" />
    </div>
  </div>
</template>
