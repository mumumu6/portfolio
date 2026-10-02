<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js'
import { applyTheme } from '@/lib/theme'
import '@/styles/components/theme-toggle.css'

const dark = ref(true)
const label = computed(() =>
  dark.value ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える',
)
const sync = () => {
  dark.value = document.documentElement.dataset.theme !== 'light'
}

const toggle = () => {
  const root = document.documentElement
  if (root.hasAttribute('data-theme-transitioning')) return
  const theme = dark.value ? 'light' : 'dark'
  const apply = () => {
    dark.value = theme === 'dark'
    applyTheme(theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ストレージが利用できない環境では保存を省略する。 */
    }
  }
  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !document.startViewTransition
  ) {
    apply()
    return
  }
  root.setAttribute('data-theme-transitioning', '')
  const transition = document.startViewTransition(apply)
  const finish = () => root.removeAttribute('data-theme-transitioning')
  void transition.ready.catch(() => {})
  void transition.finished.then(finish, finish)
}

useEventListener(
  () => (typeof document === 'undefined' ? undefined : document),
  'astro:after-swap',
  sync,
)
onMounted(sync)
</script>

<template>
  <button
    class="icon-button theme-toggle"
    type="button"
    data-theme-toggle
    :aria-label="label"
    :aria-pressed="dark"
    @click="toggle"
  >
    <span class="theme-icon" aria-hidden="true">
      <svg class="theme-icon__sun" viewBox="0 0 24 24">
        <path :d="mdiWeatherSunny" />
      </svg>
      <svg class="theme-icon__moon" viewBox="0 0 24 24">
        <path :d="mdiWeatherNight" />
      </svg>
    </span>
  </button>
</template>
