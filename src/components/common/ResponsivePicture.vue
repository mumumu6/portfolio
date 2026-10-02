<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMounted } from '@vueuse/core'
import '@/styles/components/responsive-image.css'

const props = defineProps<{
  src: string
  avifSrcset: string
  webpSrcset: string
  alt: string
  width: number
  height: number
  sizes: string
  loading: 'lazy' | 'eager'
  fetchPriority: 'high' | 'low' | 'auto'
  className?: string | undefined
  progressive: boolean
}>()
const image = ref<HTMLImageElement>()
const state = ref(props.progressive ? 'loading' : 'loaded')
const hydrated = useMounted()
const loading = ref(props.loading)
let decoding = false

const loaded = async () => {
  if (!image.value || decoding || state.value !== 'loading') return
  decoding = true
  try {
    await image.value.decode()
  } catch {
    /* 表示できる画像でも decode() が失敗する場合がある。 */
  } finally {
    decoding = false
  }
  if (!image.value) return
  state.value = image.value?.naturalWidth ? 'loaded' : 'error'
}
const failed = () => {
  if (!image.value) return
  state.value = 'error'
}
onMounted(() => {
  if (!props.progressive) return
  // 画面付近の島だけが起動するため、ページ内の全画像を測定する必要はない。
  if (image.value) {
    const rect = image.value.getBoundingClientRect()
    if (
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.top + window.scrollY <= window.innerHeight
    )
      loading.value = 'eager'
    else if (rect.height > 0 && rect.top + window.scrollY > window.innerHeight)
      loading.value = 'lazy'
  }
  if (image.value?.complete) void loaded()
})
</script>

<template>
  <picture
    :class="className"
    data-progressive-image
    :data-image-state="state"
    :data-image-in-view="hydrated && progressive ? 'true' : undefined"
  >
    <source type="image/avif" :srcset="avifSrcset" :sizes="sizes" />
    <img
      ref="image"
      :src="src"
      :srcset="webpSrcset"
      :alt="alt"
      :width="width"
      :height="height"
      :sizes="sizes"
      :loading="loading"
      decoding="async"
      :fetchpriority="fetchPriority"
      data-progressive-image
      @load="loaded"
      @error="failed"
    />
  </picture>
</template>
