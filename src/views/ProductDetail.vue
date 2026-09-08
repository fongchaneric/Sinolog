<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import { getProductDetail } from '../utils/api'
import { formatYuan, formatUsd, formatMga } from '../utils/currency'
import { proxyImage } from '../utils/image'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import VariantSheet from '../components/VariantSheet.vue'

const props = defineProps({ itemId: { type: String, required: true } })
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const product = ref(null)
const loading = ref(true)
const error = ref('')
const activeImage = ref(0)
const sheetOpen = ref(false)
const sheetMode = ref('cart')
const toast = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    product.value = await getProductDetail(props.itemId)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function openSheet(mode) {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  sheetMode.value = mode
  sheetOpen.value = true
}

async function onConfirm(payload) {
  if (sheetMode.value === 'cart') {
    await cartStore.addItem(payload, payload.quantity)
    sheetOpen.value = false
    toast.value = 'Voampiditra anaty sobika!'
    setTimeout(() => (toast.value = ''), 2000)
  } else {
    await cartStore.addItem(payload, payload.quantity)
    sheetOpen.value = false
    router.push({ name: 'checkout' })
  }
}

const safeDescription = computed(() => (product.value?.description ? DOMPurify.sanitize(product.value.description) : ''))

const soldLabel = computed(() => {
  const s = product.value?.sales
  if (!s) return null
  if (s >= 10000) return `${(s / 10000).toFixed(1)}w+ vita varotra`
  return `${s}+ vita varotra`
})

onMounted(load)
</script>

<template>
  <div class="max-w-7xl mx-auto pb-24 tv:pb-8">
    <div v-if="loading" class="p-6 text-center text-gray-400">Eo am-panangonana ny antsipiriany...</div>
    <div v-else-if="error" class="p-6 text-center text-gray-500">
      <p>{{ error }}</p>
      <button class="btn-brand mt-4" @click="load">Andramo indray</button>
    </div>

    <div v-else-if="product" class="lg:grid lg:grid-cols-2 lg:gap-6 lg:p-6 tv:grid-cols-2">
      <div>
        <div class="aspect-square bg-gray-100 lg:rounded-xl overflow-hidden">
          <img :src="proxyImage(product.images[activeImage] || product.image)" class="w-full h-full object-cover" />
        </div>
        <div v-if="product.images?.length > 1" class="flex gap-2 p-2 overflow-x-auto no-scrollbar">
          <button
            v-for="(img, i) in product.images"
            :key="i"
            @click="activeImage = i"
            class="w-14 h-14 shrink-0 rounded border overflow-hidden"
            :class="i === activeImage ? 'border-brand' : 'border-gray-200'"
          >
            <img :src="proxyImage(img)" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <div>
        <div class="bg-white lg:rounded-xl p-4">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span class="text-brand font-extrabold text-2xl">{{ formatYuan(product.price) }}</span>
            <span v-if="product.priceMax && product.priceMax !== product.price" class="text-gray-400 text-sm">~{{ formatYuan(product.priceMax) }}</span>
            <span class="text-gray-400 text-sm">{{ formatUsd(product.price) }}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ formatMga(product.price) }} isaky ny {{ product.unit || 'pcs' }} (tombana, ny admin no hanamafy ny vidiny farany)</p>

          <h1 class="text-base font-semibold text-gray-800 mt-3 leading-snug">{{ product.title }}</h1>

          <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span v-if="soldLabel">{{ soldLabel }}</span>
            <span v-if="product.rating" class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-brand fill-brand" viewBox="0 0 20 20"><path d="M10 1l2.6 5.9L19 7.6l-4.5 4.2L15.8 19 10 15.6 4.2 19l1.3-7.2L1 7.6l6.4-.7z"/></svg>
              {{ product.rating }}
            </span>
            <span>MOQ {{ product.moq || 1 }}{{ product.unit || 'pcs' }}</span>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 text-sm">
            <div>
              <p class="text-gray-700 font-medium">🏪 {{ product.shopName || 'Mpivarotra tsy fantatra' }}</p>
              <p class="text-gray-400 text-xs mt-1">📦 Product ID: {{ product.itemId }}</p>
            </div>
            <a v-if="product.link" :href="product.link" target="_blank" rel="noopener" class="text-brand text-xs shrink-0 flex items-center gap-1">
              🔗 Hita ao amin'ny loharano
            </a>
          </div>
        </div>

        <div v-if="product.priceTiers?.length" class="bg-white lg:rounded-xl p-4 mt-2">
          <p class="text-sm font-semibold text-gray-700 mb-2">Vidiny arakaraky ny habetsahana</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div v-for="(tier, i) in product.priceTiers" :key="i" class="border border-gray-200 rounded-lg py-2">
              <p class="font-bold text-brand">{{ formatYuan(tier.price) }}</p>
              <p class="text-gray-400 mt-0.5">≥{{ tier.minQty }}{{ product.unit || 'pcs' }}</p>
            </div>
          </div>
        </div>

        <div v-if="product.description" class="bg-white lg:rounded-xl p-4 mt-2">
          <p class="text-sm font-semibold text-gray-700 mb-2">Mombamomba ny entana</p>
          <div class="text-xs text-gray-500 leading-relaxed prose-sm" v-html="safeDescription" />
        </div>
      </div>
    </div>

    <div v-if="product" class="fixed bottom-16 tv:bottom-4 inset-x-0 z-20 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 max-w-7xl mx-auto lg:rounded-t-xl">
      <button class="btn-outline flex-1 !py-2.5 text-sm" @click="openSheet('cart')">🛒 Ampidiro anaty Sobika</button>
      <button class="btn-brand flex-1 !py-2.5 text-sm" @click="openSheet('buy')">Vidio Izao</button>
    </div>

    <VariantSheet v-if="product" :open="sheetOpen" :product="product" :mode="sheetMode" @close="sheetOpen = false" @confirm="onConfirm" />

    <div v-if="toast" class="fixed top-20 inset-x-0 flex justify-center z-50">
      <div class="bg-black/80 text-white text-sm px-4 py-2 rounded-full">{{ toast }}</div>
    </div>
  </div>
</template>
