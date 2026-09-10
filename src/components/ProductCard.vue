<script setup>
import { computed } from 'vue'
import { CNY_TO_USD } from '../utils/currency'
import { proxyImage } from '../utils/image'

const props = defineProps({
  product: { type: Object, required: true }
})

const fallbackImg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23eee"/%3E%3C/svg%3E'

// CJ quotes USD on the card ("$9.62"); product.price is stored in CNY
// (see api/_lib/normalize.js), so it's converted back for display here
// instead of showing the CNY figure this card never shows in the reference.
const priceUsd = computed(() => (props.product.price === null ? '0.00' : (props.product.price * CNY_TO_USD).toFixed(2)))
</script>

<template>
  <router-link :to="{ name: 'product', params: { itemId: product.itemId } }" class="fulfill-product-item">
    <p v-if="product.hasVideo" class="fulfill-product-item-vedio">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
    </p>
    <img
      class="fulfill-product-item-img"
      loading="lazy"
      :src="proxyImage(product.image) || fallbackImg"
      :alt="product.title"
      @error="$event.target.src = fallbackImg"
    />
    <p class="fulfill-product-item-title">{{ product.title }}</p>
    <div class="product-tag fulfill-product-tag"></div>
    <div class="fulfill-product-item-info">
      <div class="fulfill-product-item-info-price-wrap">
        <p class="fulfill-product-item-info-price active"><span class="price-min">$</span>{{ priceUsd }}</p>
      </div>
      <p class="fulfill-product-item-info-listedNum">{{ product.sales || 0 }} lists</p>
    </div>
  </router-link>
</template>

<style scoped>
/* Ported 1:1 from CJ Dropshipping's own fulfill-product-item markup/CSS
   (rem values converted to px at the 37.5px/rem ratio their app builds
   at - the video badge's own left/top offsets center exactly inside the
   170x170 image at that ratio, which is what confirmed the base). */
.fulfill-product-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #eee;
  padding: 0 0 8px;
  position: relative;
  overflow: hidden;
}
.fulfill-product-item-vedio {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  position: absolute;
  top: 64px;
  left: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fulfill-product-item-img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
.fulfill-product-item-title {
  font-weight: 400;
  font-size: 12px;
  color: #333;
  line-height: 17px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 8px 6px 4px;
}
.product-tag {
  margin-top: 3px;
  padding: 0 6px;
  font-size: 0;
}
.fulfill-product-tag {
  margin-top: 0;
  height: 16px;
}
.fulfill-product-item-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 6px;
}
.fulfill-product-item-info-price-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.fulfill-product-item-info-price {
  font-weight: 500;
  font-size: 14px;
  color: #f70;
  line-height: 20px;
  text-align: left;
}
.price-min {
  padding-right: 2px;
  font-weight: 500;
  font-size: 10px;
  line-height: 14px;
  text-align: left;
  text-decoration: none;
}
.fulfill-product-item-info-listedNum {
  font-weight: 400;
  font-size: 12px;
  color: #999;
  line-height: 20px;
  text-align: left;
}
</style>
