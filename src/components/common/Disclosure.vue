<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'

const props = withDefaults(defineProps<{ contentClass?: string }>(), {
  contentClass: 'reply-thread-shell',
})
const details = ref<HTMLDetailsElement>()
const hydrated = ref(false)
const disclosureId = useId()
// ハイドレーション前に行われた、ブラウザー標準の開閉操作を引き継ぐ。
const initiallyOpen =
  typeof document !== 'undefined' &&
  document.querySelector<HTMLDetailsElement>(
    `details[data-disclosure-id="${disclosureId}"]`,
  )?.open === true
const expanded = ref(initiallyOpen)
const nativeOpen = ref(initiallyOpen)
let animation: Animation | undefined

onMounted(() => {
  expanded.value = nativeOpen.value = Boolean(details.value?.open)
  hydrated.value = true
})
const toggle = (event: MouseEvent) => {
  if (!hydrated.value) return
  event.preventDefault()
  expanded.value = !expanded.value
  if (expanded.value) nativeOpen.value = true
}
const syncNativeToggle = (event: Event) => {
  const open = (event.target as HTMLDetailsElement).open
  if (open !== nativeOpen.value) expanded.value = nativeOpen.value = open
}
const cancelAnimation = () => {
  animation?.cancel()
  animation = undefined
}
const animateHeight = (
  element: Element,
  entering: boolean,
  done: () => void,
) => {
  if (!nativeOpen.value) {
    done()
    return
  }
  const content = element as HTMLElement
  const durationText =
    getComputedStyle(content)
      .getPropertyValue('--disclosure-duration')
      .trim() || '180ms'
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : parseFloat(durationText) * (durationText.endsWith('ms') ? 1 : 1000)
  const from = entering ? 0 : content.getBoundingClientRect().height
  const to = entering ? content.scrollHeight : 0
  cancelAnimation()
  if (!duration) {
    done()
    return
  }
  const current = content.animate(
    [
      { height: `${from}px`, opacity: entering ? 0 : 1 },
      { height: `${to}px`, opacity: entering ? 1 : 0 },
    ],
    { duration, easing: 'ease-out', fill: 'both' },
  )
  animation = current
  void current.finished.then(
    () => {
      if (animation !== current) return
      cancelAnimation()
      done()
    },
    () => {},
  )
}
const finishClosing = () => {
  if (!expanded.value) nativeOpen.value = false
}
onUnmounted(cancelAnimation)
</script>

<template>
  <details
    ref="details"
    :data-disclosure-id="disclosureId"
    :open="nativeOpen"
    :data-closing="!expanded && nativeOpen ? 'true' : undefined"
    @toggle="syncNativeToggle"
  >
    <summary @click="toggle">
      <slot name="summary" />
    </summary>
    <Transition
      :css="false"
      @enter="(element, done) => animateHeight(element, true, done)"
      @leave="(element, done) => animateHeight(element, false, done)"
      @enter-cancelled="cancelAnimation"
      @leave-cancelled="cancelAnimation"
      @after-leave="finishClosing"
    >
      <div
        v-show="!hydrated || expanded"
        :class="props.contentClass"
        data-disclosure-content
      >
        <slot />
      </div>
    </Transition>
  </details>
</template>
