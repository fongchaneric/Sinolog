<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { useFavoritesStore } from './stores/favorites'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'
import CjIconSprite from './components/CjIconSprite.vue'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      cartStore.watch()
      favoritesStore.watch()
    } else {
      cartStore.stop()
      favoritesStore.stop()
    }
  },
  { immediate: true }
)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
// The product page draws its own overlaid back/cart/share bar (see
// ProductDetail.vue), so the shared header would just duplicate/clash with
// it - login/register are full-screen forms with no header at all. Home
// keeps its own fixed tab-bar footer (see Home.vue) but otherwise uses the
// same shared AppHeader as every other page, so there's one header design
// site-wide instead of two.
const hasOwnHeader = computed(() => ['login', 'register', 'product'].includes(route.name))
const hasOwnFooter = computed(() => ['login', 'register', 'product', 'home'].includes(route.name))
const showHeader = computed(() => !isAdminRoute.value && !hasOwnHeader.value)
const showFooter = computed(() => !isAdminRoute.value && !hasOwnFooter.value)
</script>

<template>
  <div class="min-h-screen bg-surface text-gray-900 font-sans flex flex-col">
    <CjIconSprite />
    <AppHeader v-if="showHeader" />
    <main class="flex-1 w-full" :class="showFooter ? 'pb-16 tv:pb-0' : ''">
      <router-view />
    </main>
    <BottomNav v-if="showFooter" />
  </div>
</template>
