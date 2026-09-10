<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { searchProducts } from '../utils/api'
import { getRecentSearches, addRecentSearch } from '../utils/recentSearches'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const items = ref([])
const total = ref(0)
const page = ref(1)
const noMore = ref(false)
const sentinel = ref(null)
let observer = null

const keyword = ref((route.query.q || '').toString())
const inputEl = ref(null)
const fileInput = ref(null)
const toast = ref('')
const recentSearches = ref(getRecentSearches())

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  addRecentSearch(q)
  recentSearches.value = getRecentSearches()
  router.replace({ query: { q } })
}

function clearKeyword() {
  keyword.value = ''
  inputEl.value?.focus()
}

function searchFor(k) {
  keyword.value = k
  submitSearch()
}

function cancelSearch() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'home' })
}

function openImagePicker() {
  fileInput.value?.click()
}

function onImagePicked(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  // No visual product matching is wired up yet - this just confirms the
  // photo was captured instead of silently doing nothing.
  toast.value = 'Photo received - image search coming soon'
  setTimeout(() => (toast.value = ''), 2500)
}

async function load() {
  const q = (route.query.q || '').toString()
  page.value = 1
  noMore.value = false
  if (!q) {
    items.value = []
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await searchProducts(q, 1)
    items.value = data.items
    total.value = data.total
    if (!data.items.length) noMore.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  const q = (route.query.q || '').toString()
  if (!q || loading.value || loadingMore.value || noMore.value) return
  loadingMore.value = true
  try {
    const data = await searchProducts(q, page.value + 1)
    if (!data.items.length) {
      noMore.value = true
    } else {
      page.value += 1
      items.value = [...items.value, ...data.items]
    }
  } catch {
    // A failed "load more" attempt just stays quiet - existing results remain.
  } finally {
    loadingMore.value = false
  }
}

watch(
  () => route.query.q,
  (q) => {
    keyword.value = (q || '').toString()
    load()
  }
)
onMounted(() => {
  load()
  if (!route.query.q) inputEl.value?.focus()
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadMore()
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
  <div class="search-page">
    <!-- searchBar.fullScreenModel/searchHeader/label/inputWrapper/input/
         inputActions/cameraButton/searchCancel: ported from the reference's
         own full-screen search bar, with no logo and no round search-submit
         button (both hidden there too - .fullScreenModel .searchButton is
         display:none in the reference's own CSS). The input reuses the
         same visual style as the shared AppHeader's search pill rather than
         copying the reference's own input CSS 1:1. The camera glyph is CJ's
         real sprite icon (iconxiangjimianxing), not the reference's inline SVG. -->
    <div class="search-header-fixed">
      <div class="search-header-row">
        <div class="searchHeader">
          <div class="label">
            <div class="inputWrapper">
              <input
                ref="inputEl"
                v-model="keyword"
                type="text"
                enterkeyhint="search"
                placeholder="Find the product you're looking for"
                class="input"
                @keyup.enter="submitSearch"
              />
            </div>
            <div class="inputActions">
              <button v-if="keyword" type="button" @click="clearKeyword" class="clearButton" aria-label="Clear">
                <svg viewBox="0 0 1024 1024"><use xlink:href="#iconclose" /></svg>
              </button>
              <button type="button" @click="openImagePicker" class="cameraButton" aria-label="Search by photo">
                <svg viewBox="0 0 1024 1024"><use xlink:href="#iconxiangjimianxing" /></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" class="cancelButton" @click="cancelSearch">Cancel</button>
      </div>
      <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImagePicked" />
    </div>
    <div class="search-spacer"></div>

    <div v-if="!route.query.q" class="recent-panel">
      <p class="recent-title">Recent Searches</p>
      <div v-if="recentSearches.length" class="recent-tags">
        <button v-for="k in recentSearches" :key="k" type="button" class="recent-tag" @click="searchFor(k)">{{ k }}</button>
      </div>
      <p v-else class="text-xs text-gray-400 px-1">Your recent searches will show up here.</p>
    </div>

    <div v-else class="max-w-7xl mx-auto px-2 py-3">
      <p class="text-sm text-gray-500 mb-2">
        Results for "<span class="font-semibold text-gray-700">{{ route.query.q }}</span>"
        <span v-if="total">— {{ total }} products</span>
      </p>

      <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <div v-for="i in 10" :key="i" class="card aspect-[3/4] animate-pulse bg-gray-100" />
      </div>

      <div v-else-if="error" class="text-center text-sm text-gray-500 py-16">
        <p>{{ error }}</p>
        <button class="btn-brand mt-4" @click="load">Try again</button>
      </div>

      <div v-else-if="!items.length" class="text-center text-sm text-gray-400 py-16">
        No products found. Try another keyword.
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 tv:grid-cols-6 gap-2">
        <ProductCard v-for="p in items" :key="p.itemId" :product="p" />
      </div>

      <div ref="sentinel" class="h-1" />
      <div v-if="loadingMore" class="flex flex-col items-center py-3 gap-1.5 text-gray-400 text-sm">
        <div class="w-6 h-6 border-2 border-gray-200 border-t-brand rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>

    <div v-if="toast" class="fixed top-16 inset-x-0 flex justify-center z-50">
      <div class="bg-black/80 text-white text-sm px-4 py-2 rounded-full">{{ toast }}</div>
    </div>
  </div>
</template>

<style scoped>
.search-header-fixed {
  z-index: 999;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.12) 0 1px 0;
}
.search-spacer {
  height: 50px;
}
.search-header-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 50px;
  padding: 6px 12px;
  box-sizing: border-box;
}
.searchHeader {
  background: #f4f4f4;
  border-radius: 999px;
  flex-grow: 1;
  align-items: center;
  gap: 12px;
  height: 34px;
  padding: 0 12px 0 16px;
  display: flex;
  box-sizing: border-box;
}
.label {
  flex-grow: 1;
  align-items: center;
  gap: 2px;
  min-width: 0;
  display: flex;
}
.inputWrapper {
  flex-grow: 1;
  align-items: center;
  min-width: 0;
  height: 22px;
  display: flex;
  position: relative;
}
.input {
  caret-color: #f60;
  color: #222;
  text-overflow: ellipsis;
  background: none;
  border: none;
  outline: none;
  flex-grow: 1;
  width: 100%;
  min-width: 0;
  height: 22px;
  padding: 0;
  font-size: 16px;
  line-height: 16px;
}
.input::placeholder {
  color: #b8b8b8;
}
.inputActions {
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  display: flex;
}
.cameraButton,
.clearButton {
  color: #b8b8b8;
  cursor: pointer;
  background: none;
  border: none;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  flex-shrink: 0;
}
.cameraButton {
  color: #222;
}
.cameraButton svg {
  width: 100%;
  height: 100%;
}
.clearButton svg {
  width: 11px;
  height: 11px;
}
.cancelButton {
  color: #333;
  cursor: pointer;
  width: fit-content;
  font-size: 16px;
  flex-shrink: 0;
  background: none;
  border: none;
}

.recent-panel {
  padding: 16px 16px 4px;
}
.recent-title {
  color: #999;
  font-size: 14px;
  margin: 0 0 12px;
}
.recent-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.recent-tag {
  color: #666;
  background: #f4f4f4;
  border: none;
  border-radius: 3px;
  margin: 0;
  padding: 5px 10px;
  font-size: 13px;
}
</style>
