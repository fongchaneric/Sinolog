<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const fileInput = ref(null)
const toast = ref('')

// Tapping the search bar goes to the dedicated full-screen search page
// (SearchResults.vue) instead of opening the keyboard right here - matches
// how the reference site's own compact header behaves (typing happens on
// its own search screen, not inline in the header).
function goToSearch() {
  router.push({ name: 'search' })
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
      <router-link to="/" class="header-logo"><span class="header-logo-sino">Sino</span><span class="header-logo-log">log</span></router-link>
      <div class="headerSearch">
        <div class="searchWrapper">
          <div class="searchHeader withSearchButton" @click="goToSearch">
            <div class="label">
              <div class="inputWrapper">
                <span class="input" :class="{ 'input-placeholder': !route.query.q }">{{ route.query.q || "Find the product you're looking for" }}</span>
              </div>
              <div class="inputActions">
                <button type="button" @click.stop="openImagePicker" class="cameraButton" aria-label="Search by photo">
                  <svg viewBox="0 0 1024 1024"><use xlink:href="#iconxiangjimianxing" /></svg>
                </button>
              </div>
            </div>
            <button type="button" class="searchButton" aria-label="Search" @click.stop="goToSearch">
              <svg viewBox="0 0 1024 1024" class="searchButtonIcon"><use xlink:href="#iconsousuo" /></svg>
            </button>
          </div>
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
  flex-shrink: 0;
  width: 12px;
}
.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 100%;
  margin: 0 8px 0 12px;
  flex-shrink: 0;
  font-family: 'Poppins', -apple-system, sans-serif;
  font-weight: 800;
  font-size: 19px;
  letter-spacing: -0.03em;
  white-space: nowrap;
}
.header-logo-sino {
  color: #1a1a1a;
}
.header-logo-log {
  color: #ff6a00;
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
  cursor: pointer;
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
  color: #222;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  flex-grow: 1;
  width: 100%;
  min-width: 0;
  height: 22px;
  padding: 0;
  font-size: 16px;
  line-height: 16px;
}
.input-placeholder {
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
