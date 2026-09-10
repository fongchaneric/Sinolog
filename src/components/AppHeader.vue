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
  <!-- header-container/header-container-left/header-container-right/
       header-logo/searchHeader/withSearchButton/label/inputWrapper/input/
       inputActions/cameraButton/searchButton/searchButtonIcon: ported 1:1
       from the reference capture's own header, fixed position + the
       height:50px spacer sibling it uses to keep content from sliding
       underneath. header-logo swaps the reference's own background-image
       logo for the Sinolog wordmark; the search and camera glyphs are CJ's
       real sprite icons (iconsousuo/iconxiangjimianxing, see
       CjIconSprite.vue), not the reference's own inline SVGs; and
       searchButton keeps the app's own brand color instead of the
       reference's black background. -->
  <div class="header-container header-fixed">
    <div class="header-container-left">
      <router-link to="/" class="header-logo">Sinolog</router-link>
      <div class="headerSearch">
        <div class="searchWrapper">
          <form @submit.prevent="submitSearch" class="searchHeader withSearchButton">
            <label class="label">
              <div class="inputWrapper">
                <input v-model="keyword" type="text" enterkeyhint="search" placeholder="Find the product you're looking for" class="input" />
              </div>
              <div class="inputActions">
                <button type="button" @click="openImagePicker" class="cameraButton" aria-label="Search by photo">
                  <svg viewBox="0 0 1024 1024"><use xlink:href="#iconxiangjimianxing" /></svg>
                </button>
              </div>
            </label>
            <button type="submit" class="searchButton" aria-label="Search">
              <svg viewBox="0 0 1024 1024" class="searchButtonIcon"><use xlink:href="#iconsousuo" /></svg>
            </button>
          </form>
        </div>
        <input ref="fileInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onImagePicked" />
      </div>
    </div>
    <div class="header-container-right"></div>
  </div>
  <div class="header-spacer"></div>

  <div v-if="toast" class="fixed top-16 inset-x-0 flex justify-center z-50">
    <div class="bg-black/80 text-white text-sm px-4 py-2 rounded-full">{{ toast }}</div>
  </div>
</template>

<style scoped>
/* Ported 1:1 from the reference capture's own px-based CSS. */
.header-fixed {
  z-index: 999;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
.header-spacer {
  height: 50px;
}
.header-container {
  background-color: #fff;
  box-shadow: rgba(0, 0, 0, 0.12) 0 1px 0;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 50px;
  display: flex;
}
.header-container-left {
  flex: 1;
  align-items: center;
  height: 100%;
  display: flex;
  min-width: 0;
}
.header-container-right {
  align-items: center;
  height: 100%;
  display: flex;
}
.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 125px;
  height: 100%;
  margin: 0 13.5px;
  flex-shrink: 0;
  color: #222;
  font-weight: 800;
  font-size: 19px;
  letter-spacing: -0.02em;
}
.headerSearch {
  flex: 1;
  min-width: 0;
}
.searchWrapper {
  width: 100%;
}
.searchHeader {
  background: #f4f4f4;
  border-radius: 999px;
  flex-grow: 1;
  width: 100%;
  align-items: center;
  gap: 12px;
  height: 34px;
  margin: 0 4px 0 0;
  padding: 0 4px 0 16px;
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
.cameraButton {
  color: #222;
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
.cameraButton svg {
  width: 100%;
  height: 100%;
}
.searchButton {
  cursor: pointer;
  border: none;
  border-radius: 999px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 26px;
  padding: 0 12px;
  display: flex;
  background: #ff6a00;
  color: #fff;
}
.searchButtonIcon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}
</style>
