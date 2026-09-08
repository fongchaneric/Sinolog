<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const cartStore = useCartStore()
const authStore = useAuthStore()

const tabs = [
  { name: 'home', label: 'Fandraisana', icon: 'home', to: { name: 'home' } },
  { name: 'orders', label: 'Commande', icon: 'orders', to: { name: 'orders' } },
  { name: 'cart', label: 'Sobika', icon: 'cart', to: { name: 'cart' } },
  { name: 'account', label: 'Ahy', icon: 'user', to: { name: 'account' } }
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
          <svg v-if="tab.icon === 'home'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
          </svg>
          <svg v-else-if="tab.icon === 'orders'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
          </svg>
          <svg v-else-if="tab.icon === 'cart'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
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
