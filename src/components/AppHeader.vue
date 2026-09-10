<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { addRecentSearch } from '../utils/recentSearches'

const router = useRouter()
const route = useRoute()
const keyword = ref(route.query.q || '')
const fileInput = ref(null)
const toast = ref('')

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  addRecentSearch(q)
  router.push({ name: 'search', query: { q } })
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
</script>

<template>
  <header class="sticky top-0 z-30 bg-white">
    <div class="max-w-7xl mx-auto flex items-center px-2 py-2">
      <router-link to="/" class="shrink-0 flex items-center pl-1">
        <span class="text-gray-800 font-bold text-lg tracking-tight">Sinolog</span>
      </router-link>

      <!-- header-center / search-box / search-icon / btn-search / camera-icon:
           class names and layout ported from CJ Dropshipping's own header
           (no separate round search-submit button there either). The
           search-icon and camera-icon glyphs are CJ private CDN raster
           images in the reference, so the closest real icons from CJ's own
           inline sprite (iconsousuo / iconxiangjimianxing) stand in for them. -->
      <form @submit.prevent="submitSearch" class="header-center display-flex align-items-center flex-1">
        <div class="search-box relative">
          <span class="search-icon"><svg viewBox="0 0 1024 1024"><use xlink:href="#iconsousuo" /></svg></span>
          <input
            v-model="keyword"
            type="search"
            placeholder="Find the product you're looking for"
            class="btn-search"
          />
        </div>
        <button type="button" @click="openImagePicker" class="camera-icon" aria-label="Search by photo">
          <svg viewBox="0 0 1024 1024"><use xlink:href="#iconxiangjimianxing" /></svg>
        </button>
        <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImagePicked" />
      </form>
    </div>

    <div v-if="toast" class="fixed top-16 inset-x-0 flex justify-center z-50">
      <div class="bg-black/80 text-white text-sm px-4 py-2 rounded-full">{{ toast }}</div>
    </div>
  </header>
</template>

<style scoped>
/* Ported 1:1 from the reference file's .header-center/.search-box/
   .search-icon/.btn-search/.camera-icon rules (rem -> px at 37.5px/rem,
   the same ratio confirmed against the product-card video badge). */
.display-flex {
  display: flex;
}
.align-items-center {
  align-items: center;
}
.header-center {
  margin: 0 12px;
  position: relative;
}
.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  height: 32px;
  padding: 0 0 0 30px;
  border-radius: 150px;
  background: #f6f6f6;
  margin: 0 6px 0 4px;
}
.search-icon {
  position: absolute;
  left: 6px;
  top: 50%;
  width: 20px;
  height: 20px;
  transform: translateY(-50%);
  color: #999;
}
.search-icon svg,
.camera-icon svg {
  width: 100%;
  height: 100%;
}
.btn-search {
  flex: 1;
  min-width: 0;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  color: #666;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
}
.btn-search::placeholder {
  color: #999;
}
.camera-icon {
  width: 20px;
  height: 20px;
  color: #666;
  flex-shrink: 0;
}
</style>
