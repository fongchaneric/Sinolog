<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

// icon values map to <symbol id="iconXxx"> in CjIconSprite.vue - same
// icons CJ's own app uses, referenced via <use> instead of drawing new SVGs.
const tabs = [
  { name: 'home', label: 'Home', icon: 'home', to: { name: 'home' } },
  { name: 'orders', label: 'Message', icon: 'Message', to: { name: 'orders' } },
  { name: 'cart', label: 'Cart', icon: 'cart', to: { name: 'cart' } },
  { name: 'account', label: 'Me', icon: 'Account', to: { name: 'account' } }
]

const active = computed(() => route.name)
const cartCount = computed(() => (authStore.isLoggedIn ? cartStore.count : 0))
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 tv:hidden">
    <div class="max-w-7xl mx-auto grid grid-cols-4">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="flex flex-col items-center justify-center py-2 gap-0.5 relative"
        :class="active === tab.name ? 'text-brand' : 'text-gray-500'"
      >
        <span class="relative">
          <svg class="w-6 h-6" viewBox="0 0 1024 1024"><use :xlink:href="`#icon${tab.icon}`" /></svg>
          <span
            v-if="tab.icon === 'cart' && cartCount > 0"
            class="absolute -top-1.5 -right-2.5 bg-brand text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
          >{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span class="text-[11px]">{{ tab.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
