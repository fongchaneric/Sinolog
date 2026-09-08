<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import AppHeader from './components/AppHeader.vue'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

watch(
  () => authStore.user,
  (user) => {
    if (user) cartStore.watch()
    else cartStore.stop()
  },
  { immediate: true }
)

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isAuthRoute = computed(() => ['login', 'register'].includes(route.name))
const showChrome = computed(() => !isAdminRoute.value)
</script>

<template>
  <div class="min-h-screen bg-surface text-gray-900 font-sans flex flex-col">
    <AppHeader v-if="showChrome && !isAuthRoute" />
    <main class="flex-1 w-full" :class="showChrome && !isAuthRoute ? 'pb-16 tv:pb-0' : ''">
      <router-view />
    </main>
    <BottomNav v-if="showChrome && !isAuthRoute" />
  </div>
</template>
