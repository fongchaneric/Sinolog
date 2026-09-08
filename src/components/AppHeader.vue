<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const keyword = ref(route.query.q || '')

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  router.push({ name: 'search', query: { q } })
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-gradient-to-r from-brand to-brand-dark shadow-md">
    <div class="max-w-7xl mx-auto px-3 py-2.5 flex items-center gap-3">
      <router-link to="/" class="shrink-0 flex items-center gap-1.5">
        <div class="w-8 h-8 rounded-lg bg-white/95 flex items-center justify-center font-black text-brand text-lg">S</div>
        <span class="hidden sm:block text-white font-bold text-lg tracking-tight">Sinolog</span>
      </router-link>

      <form @submit.prevent="submitSearch" class="flex-1 flex items-center bg-white rounded-full overflow-hidden pl-4 pr-1 py-1.5 gap-2">
        <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
        </svg>
        <input
          v-model="keyword"
          type="search"
          placeholder="Recherchez le produit que vous voulez..."
          class="flex-1 min-w-0 text-sm outline-none bg-transparent"
        />
        <button type="submit" class="btn-brand !py-1.5 !px-4 text-sm shrink-0">Rechercher</button>
      </form>
    </div>
  </header>
</template>
