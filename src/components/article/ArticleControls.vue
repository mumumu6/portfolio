<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useElementBounding,
  useWindowScroll,
  useWindowSize,
} from '@vueuse/core'
import Disclosure from '@/components/common/Disclosure.vue'
import ArticleTocList from './ArticleTocList.vue'

type Heading = { depth: number; slug: string; text: string }
defineProps<{ headings: Heading[] }>()
const article = ref<HTMLElement>()
const { y } = useWindowScroll()
const { width: windowWidth, height: windowHeight } = useWindowSize({
  includeScrollbar: true,
})
const { top, height } = useElementBounding(article, { windowScroll: false })
const start = ref(0)
const headingPositions = ref<{ id: string; top: number }[]>([])

const progress = computed(() => {
  if (!article.value) return 0
  const distance = Math.max(height.value - windowHeight.value, 1)
  const traveled = y.value - start.value
  return traveled >= distance - 1
    ? 100
    : Math.max(0, Math.min(100, (traveled / distance) * 100))
})
const percent = computed(() => Math.floor(progress.value))
const currentHeading = computed(
  () =>
    headingPositions.value.findLast(({ top }) => top <= y.value + 150)?.id ??
    null,
)
const measureHeadings = () => {
  if (!article.value) return
  const scrollY = window.scrollY
  start.value = article.value.getBoundingClientRect().top + scrollY
  headingPositions.value = [
    ...article.value.querySelectorAll<HTMLElement>(
      '.article-prose h2, .article-prose h3',
    ),
  ].map((heading) => ({
    id: heading.id,
    top: heading.getBoundingClientRect().top + scrollY,
  }))
}
watch([top, height, windowWidth, windowHeight], measureHeadings, {
  flush: 'post',
})
onMounted(() => {
  measureHeadings()
  void document.fonts.ready.then(measureHeadings)
})
const closeToc = (event: MouseEvent) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  ;(event.currentTarget as HTMLElement)
    .closest('details')
    ?.removeAttribute('open')
}
</script>

<template>
  <article ref="article" class="article-page">
    <div class="reading-progress" data-reading-progress aria-hidden="true">
      <svg class="reading-progress__ring" viewBox="0 0 48 48">
        <circle class="reading-progress__track" cx="24" cy="24" r="21.5" />
        <circle
          class="reading-progress__value"
          cx="24"
          cy="24"
          r="21.5"
          pathLength="100"
          data-reading-progress-ring
          :style="{
            strokeDasharray: progress === 100 ? 'none' : '100',
            strokeDashoffset: 100 - progress,
          }"
        />
      </svg>
      <span data-reading-progress-label>{{ percent }}%</span>
    </div>
    <slot name="header" />
    <Disclosure
      v-if="headings.length > 2"
      v-memo="[headings]"
      class="article-toc-mobile"
      content-class="article-toc-mobile__content"
    >
      <template #summary
        ><span>目次</span><small>{{ headings.length }}項目</small></template
      >
      <nav aria-label="目次">
        <ArticleTocList :headings="headings" @select="closeToc" />
      </nav>
    </Disclosure>
    <div class="article-layout">
      <nav v-if="headings.length > 2" class="article-toc" aria-label="目次">
        <div class="article-toc__head">
          <strong>目次</strong
          ><span data-reading-progress-label>{{ percent }}%</span>
        </div>
        <ArticleTocList
          :headings="headings"
          :current-heading="currentHeading"
        />
      </nav>
      <div class="article-prose"><slot /></div>
    </div>
  </article>
</template>
