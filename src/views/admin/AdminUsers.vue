<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../../firebase'

const users = ref([])
let usersRefHandle = null

onMounted(() => {
  usersRefHandle = dbRef(db, 'users')
  onValue(usersRefHandle, (snap) => {
    users.value = snap.exists() ? Object.values(snap.val()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : []
  })
})
onUnmounted(() => {
  if (usersRefHandle) off(usersRefHandle)
})
</script>

<template>
  <div class="p-4 lg:p-6 max-w-4xl">
    <h1 class="text-xl font-bold text-gray-800 mb-4">Mpividy ({{ users.length }})</h1>

    <div class="card divide-y divide-gray-50">
      <div v-if="!users.length" class="p-8 text-center text-gray-400 text-sm">Mbola tsy misy mpividy nisoratra anarana</div>
      <div v-for="u in users" :key="u.uid" class="flex items-center gap-3 px-4 py-3">
        <div class="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
          {{ (u.name || u.email || '?')[0].toUpperCase() }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 truncate">{{ u.name || '(tsy nomena anarana)' }}</p>
          <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
        </div>
        <p class="text-xs text-gray-400 shrink-0">{{ u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '' }}</p>
      </div>
    </div>
  </div>
</template>
