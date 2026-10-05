<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps<{
  image: {
    src: string
    avifSrcset: string
    webpSrcset: string
    alt: string
    width: number
    height: number
    sizes: string
    loading: 'lazy' | 'eager'
    fetchPriority: 'high' | 'low' | 'auto'
  }
}>()

const wrapper = ref<HTMLElement | null>(null)
const imageElement = ref<HTMLImageElement | null>(null)
const state = ref<'loading' | 'loaded' | 'error'>('loading')
const inView = ref(false)
let mounted = false
let settlement = 0

const { pause, resume } = useIntersectionObserver(
  wrapper,
  (entries) => {
    if (
      state.value !== 'loading' ||
      !entries.some((entry) => entry.isIntersecting)
    )
      return
    inView.value = true
    pause()
  },
  { rootMargin: '160px 0px' },
)

const settle = async () => {
  const image = imageElement.value
  if (!mounted || !image) return
  const currentSettlement = ++settlement
  try {
    await image.decode()
  } catch {
    // decode() が失敗しても naturalWidth で表示可否を判定する。
  }
  if (
    !mounted ||
    currentSettlement !== settlement ||
    image !== imageElement.value
  )
    return
  state.value = image.naturalWidth ? 'loaded' : 'error'
  pause()
}

const fail = () => {
  ++settlement
  state.value = 'error'
  pause()
}

onMounted(() => {
  mounted = true
  // SSR 中や hydration 前に読み込まれた画像も同じ経路で処理する。
  if (imageElement.value?.complete) void settle()
})

watch(
  () => [props.image.src, props.image.avifSrcset, props.image.webpSrcset],
  () => {
    ++settlement
    state.value = 'loading'
    inView.value = false
    resume()
    if (imageElement.value?.complete) void settle()
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  mounted = false
  ++settlement
  pause()
})
</script>

<template>
  <div
    ref="wrapper"
    class="optimized-image"
    :data-image-state="state"
    :data-image-in-view="inView ? 'true' : undefined"
  >
    <picture data-progressive-image>
      <source
        type="image/avif"
        :srcset="image.avifSrcset"
        :sizes="image.sizes"
      />
      <img
        ref="imageElement"
        :src="image.src"
        :srcset="image.webpSrcset || undefined"
        :alt="image.alt"
        :width="image.width"
        :height="image.height"
        :sizes="image.sizes"
        :loading="image.loading"
        :fetchpriority="image.fetchPriority"
        decoding="async"
        data-progressive-image
        @load="settle"
        @error="fail"
      />
    </picture>
    <USkeleton class="responsive-image__skeleton" aria-hidden="true" />
  </div>
</template>
