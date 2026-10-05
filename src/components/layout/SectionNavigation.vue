<script setup lang="ts">
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useEventListener, useRafFn, useWindowScroll } from '@vueuse/core'
import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from 'astro:transitions/client'
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
let activePreparation: AbortSignal | undefined
const isActive = (href: string) => matchesNavigationPath(pathname.value, href)

const measure = () => {
  if (!nav.value) return
  const profile = document.querySelector('.profile-header')
  stickyStart = profile
    ? profile.getBoundingClientRect().bottom + window.scrollY
    : 0
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

const { resume: scheduleMeasure } = useRafFn(measure, {
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
watch(
  () => props.pathname,
  (nextPathname) => {
    pathname.value = nextPathname
  },
)
watch(pathname, () => {
  void nextTick().then(measure)
})

useEventListener('resize', scheduleMeasure)
const documentTarget = () =>
  typeof document === 'undefined' ? undefined : document
useEventListener(documentTarget, 'astro:before-preparation', (event) => {
  const { signal } = event as TransitionBeforePreparationEvent
  activePreparation = signal
  loading.value = true
  signal.addEventListener(
    'abort',
    () => {
      if (activePreparation !== signal) return
      activePreparation = undefined
      loading.value = false
    },
    { once: true },
  )
})
useEventListener(documentTarget, 'astro:before-swap', (event) => {
  const transition = event as TransitionBeforeSwapEvent
  hidden.value = false
  pathname.value = transition.to.pathname
})
useEventListener(documentTarget, 'astro:after-swap', () => {
  activePreparation = undefined
  loading.value = false
  lastY = window.scrollY
  void nextTick().then(measure)
})

onMounted(() => {
  pathname.value = window.location.pathname
  lastY = window.scrollY
  measure()
  void document.fonts.ready.then(() => {
    if (nav.value) scheduleMeasure()
  })
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
      :class="['section-nav__link', { active: isActive(item.href) }]"
      :aria-current="isActive(item.href) ? 'page' : undefined"
      data-nav-link
      data-astro-prefetch
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
