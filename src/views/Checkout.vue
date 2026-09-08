<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ref as dbRef, push, set } from 'firebase/database'
import { db } from '../firebase'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { formatYuan, formatMga } from '../utils/currency'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const PAYMENT_METHODS = [
  { id: 'airtel', label: 'Airtel Money', number: '033 82 382 86', color: 'bg-red-500' },
  { id: 'orange', label: 'Orange Money', number: '037 46 030 59', color: 'bg-orange-500' },
  { id: 'mvola', label: 'Mvola', number: '038 60 108 89', color: 'bg-amber-500' }
]

const method = ref('airtel')
const senderPhone = ref('')
const reference = ref('')
const address = ref('')
const submitting = ref(false)
const error = ref('')

const selectedMethod = computed(() => PAYMENT_METHODS.find((m) => m.id === method.value))
const estimatedMga = computed(() => Math.round(cartStore.totalYuan * 650))

async function submit() {
  error.value = ''
  if (!cartStore.lines.length) {
    error.value = 'Votre panier est vide'
    return
  }
  if (!reference.value.trim() || !senderPhone.value.trim()) {
    error.value = 'Renseignez la référence et le numéro d\'envoi'
    return
  }
  submitting.value = true
  try {
    const orderRef = push(dbRef(db, 'orders'))
    const orderId = orderRef.key
    const order = {
      id: orderId,
      userId: authStore.user.uid,
      userEmail: authStore.user.email,
      userName: authStore.user.displayName || '',
      items: cartStore.lines,
      totalYuan: cartStore.totalYuan,
      estimatedMga: estimatedMga.value,
      paymentMethod: method.value,
      paymentPhoneTo: selectedMethod.value.number,
      paymentReference: reference.value.trim(),
      senderPhone: senderPhone.value.trim(),
      deliveryAddress: address.value.trim(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await set(orderRef, order)
    await set(dbRef(db, `userOrders/${authStore.user.uid}/${orderId}`), true)
    await cartStore.clear()
    router.replace({ name: 'order-detail', params: { orderId } })
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-3 py-4 pb-28 space-y-3">
    <h1 class="text-lg font-bold text-gray-800 px-1">Paiement</h1>

    <div class="card p-4">
      <p class="text-sm font-semibold text-gray-700 mb-2">Résumé de la commande</p>
      <div v-for="line in cartStore.lines" :key="line.itemId + line.skuId" class="flex justify-between text-sm py-1">
        <span class="text-gray-600 truncate pr-2">{{ line.title }} × {{ line.quantity }}</span>
        <span class="text-gray-800 shrink-0">{{ formatYuan(line.price * line.quantity) }}</span>
      </div>
      <div class="border-t border-gray-100 mt-2 pt-2 flex justify-between font-bold">
        <span>Total</span>
        <div class="text-right">
          <p class="text-brand">{{ formatYuan(cartStore.totalYuan) }}</p>
          <p class="text-xs text-gray-400 font-normal">{{ formatMga(cartStore.totalYuan) }}</p>
        </div>
      </div>
      <p class="text-[11px] text-gray-400 mt-1">* Estimation uniquement — les frais de livraison et de service seront confirmés par l'admin après la commande.</p>
    </div>

    <div class="card p-4">
      <p class="text-sm font-semibold text-gray-700 mb-3">Choisissez le mode de paiement</p>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="m in PAYMENT_METHODS"
          :key="m.id"
          @click="method = m.id"
          class="rounded-lg border p-2.5 text-center"
          :class="method === m.id ? 'border-brand bg-brand/5' : 'border-gray-200'"
        >
          <div class="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold" :class="m.color">
            {{ m.label[0] }}
          </div>
          <p class="text-xs font-medium text-gray-700">{{ m.label }}</p>
        </button>
      </div>

      <div class="mt-3 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-400">Envoyez le paiement à ce numéro {{ selectedMethod.label }}</p>
          <p class="text-lg font-bold text-gray-800 tracking-wide">{{ selectedMethod.number }}</p>
        </div>
      </div>

      <div class="mt-3 space-y-2">
        <input v-model="senderPhone" type="tel" placeholder="Le numéro depuis lequel vous avez envoyé l'argent" class="input-field" />
        <input v-model="reference" type="text" placeholder="Référence du paiement" class="input-field" />
        <textarea v-model="address" rows="2" placeholder="Adresse de livraison (si nécessaire)" class="input-field resize-none" />
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-500 px-1">{{ error }}</p>

    <div class="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 max-w-2xl mx-auto">
      <button class="btn-brand w-full !py-3" :disabled="submitting" @click="submit">
        {{ submitting ? 'Envoi en cours...' : `Confirmer la commande — ${formatYuan(cartStore.totalYuan)}` }}
      </button>
    </div>
  </div>
</template>
