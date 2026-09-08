<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Tsy mitovy ny mot de passe roa'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Tokony ho 6 tarehimarika farafahakeliny ny mot de passe'
    return
  }
  loading.value = true
  try {
    await authStore.register({ name: name.value.trim(), email: email.value.trim(), password: password.value })
    if (authStore.isAdmin) {
      router.replace({ name: 'admin-dashboard' })
    } else {
      router.replace({ name: 'home' })
    }
  } catch (e) {
    const code = e.code || ''
    if (code.includes('email-already-in-use')) error.value = 'Efa misy kaonty mampiasa io email io'
    else if (code.includes('invalid-email')) error.value = 'Diso ny endriky ny email'
    else error.value = e.message || 'Nisy olana'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-light/20 to-white px-4 py-10">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-2xl">S</div>
        <h1 class="text-xl font-bold text-gray-800 mt-3">Hisoratra anarana</h1>
      </div>

      <form @submit.prevent="submit" class="space-y-3">
        <input v-model="name" type="text" required placeholder="Nom" class="input-field" />
        <input v-model="email" type="email" required placeholder="Email" class="input-field" />
        <input v-model="password" type="password" required placeholder="Mot de passe" class="input-field" />
        <input v-model="confirm" type="password" required placeholder="Confirmation mot de passe" class="input-field" />
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
        <button type="submit" class="btn-brand w-full !py-3" :disabled="loading">{{ loading ? '...' : 'Hisoratra anarana' }}</button>
      </form>

      <p class="text-center text-sm text-gray-500 mt-6">
        Efa manana kaonty? <router-link to="/login" class="text-brand font-semibold">Hiditra</router-link>
      </p>
    </div>
  </div>
</template>
