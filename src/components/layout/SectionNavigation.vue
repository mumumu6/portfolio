<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useEventListener, useRafFn, useWindowScroll } from '@vueuse/core'
import type { TransitionBeforeSwapEvent } from 'astro:transitions/client'
import { navigationItems, matchesNavigationPath } from '@/lib/navigation'
import '@/styles/components/site-header-nav.css'

const props = defineProps<{ pathname: string }>()
const nav = ref<HTMLElement>()
const pathname = ref(props.pathname)
const hidden = ref(false)
const loading = ref(false)
const indicatorStyle = shallowRef<{ width: string; transform: string }>()
const { y } = useWindowScroll()
let stickyStart = 0
let lastY = 0
let pendingViewportTop: number | null = null
let previousScrollBehavior: string | null = null
const isActive = (href: string) => matchesNavigationPath(pathname.value, href)

const getStickyStart = () => {
  const profile = document.querySelector('.profile-header')
  return profile ? profile.getBoundingClientRect().bottom + window.scrollY : 0
}
const measure = () => {
  if (!nav.value) return
  stickyStart = getStickyStart()
  const link = nav.value.querySelector<HTMLElement>('a.active')
  const label = link?.querySelector<HTMLElement>('span')
  if (!link || !label) {
    indicatorStyle.value = undefined
    return
  }
  const available = Math.max(36, link.offsetWidth - 16)
  const width = Math.min(available, Math.max(36, label.offsetWidth))
  indicatorStyle.value = {
    width: `${width}px`,
    transform: `translate3d(${link.offsetLeft + (link.offsetWidth - width) / 2}px, 0, 0)`,
  }
}
// 連続するイベントを1フレームにまとめ、破棄時の予約解除は VueUse に任せる。
const { resume: scheduleLayout } = useRafFn(measure, {
  immediate: false,
  once: true,
})
watch(y, (scrollY) => {
  const delta = scrollY - lastY
  if (scrollY <= 4 || scrollY < stickyStart) {
    hidden.value = false
    lastY = scrollY
  } else if (Math.abs(delta) >= 8) {
    hidden.value = delta > 0
    lastY = scrollY
  }
})
const beforePreparation = () => {
  loading.value = true
}
const beforeSwap = (transition: TransitionBeforeSwapEvent) => {
  const traversal = transition.navigationType === 'traverse'
  pendingViewportTop =
    !traversal && transition.newDocument.querySelector('.profile-header')
      ? Math.max(0, nav.value?.getBoundingClientRect().top ?? 0)
      : null
  hidden.value = false
  if (traversal && previousScrollBehavior === null) {
    previousScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
  }
  if (traversal)
    transition.newDocument.documentElement.style.scrollBehavior = 'auto'
  pathname.value = transition.to.pathname
}
const afterSwap = () => {
  loading.value = false
  // Astro が遷移後のスナップショットを取得する前に、スクロール位置を復元する。
  if (pendingViewportTop !== null) {
    stickyStart = getStickyStart()
    lastY = Math.max(0, stickyStart - pendingViewportTop)
    window.scrollTo({ top: lastY, behavior: 'instant' })
    pendingViewportTop = null
  }
  if (previousScrollBehavior !== null) {
    document.documentElement.style.scrollBehavior = previousScrollBehavior
    previousScrollBehavior = null
  }
  lastY = window.scrollY
  void nextTick().then(measure)
}
const documentTarget = () =>
  typeof document === 'undefined' ? undefined : document
useEventListener('resize', scheduleLayout)
useEventListener(documentTarget, 'astro:before-preparation', beforePreparation)
useEventListener(documentTarget, 'astro:before-swap', beforeSwap)
useEventListener(documentTarget, 'astro:after-swap', afterSwap)

onMounted(() => {
  lastY = window.scrollY
  measure()
  void document.fonts.ready.then(() => {
    if (nav.value) scheduleLayout()
  })
})
onUnmounted(() => {
  if (previousScrollBehavior !== null)
    document.documentElement.style.scrollBehavior = previousScrollBehavior
})
</script>

<template>
  <nav
    ref="nav"
    class="section-nav"
    :class="{ 'section-nav--hidden': hidden }"
    data-nav-container
    aria-label="メインナビゲーション"
    :aria-busy="loading ? 'true' : undefined"
  >
    <a
      v-for="item in navigationItems"
      :key="item.href"
      :href="item.href"
      :class="{ active: isActive(item.href) }"
      :aria-current="isActive(item.href) ? 'page' : undefined"
      data-nav-link
      ><span>{{ item.label }}</span></a
    >
    <span
      class="section-nav__indicator"
      data-nav-indicator
      :data-nav-ready="indicatorStyle ? 'true' : undefined"
      :hidden="!indicatorStyle"
      aria-hidden="true"
      :style="indicatorStyle"
    />
  </nav>
</template>
