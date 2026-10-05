<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import {
  useEventListener,
  useResizeObserver,
  useWindowScroll,
  useWindowSize,
} from '@vueuse/core'
import Disclosure from '@/components/common/Disclosure.vue'
import ArticleTocList from './ArticleTocList.vue'

type Heading = { depth: number; slug: string; text: string }
const props = defineProps<{ articleId: string; headings: Heading[] }>()
const article = shallowRef<HTMLElement | null>(null)
const tocOpen = ref(false)
const { y, measure: measureScroll } = useWindowScroll()
const { width, height } = useWindowSize({ includeScrollbar: true })
const start = ref(0)
const end = ref(1)
const headingPositions = shallowRef<{ id: string; top: number }[]>([])

const measure = () => {
  if (!article.value?.isConnected) return
  measureScroll()
  const scrollY = window.scrollY
  start.value = article.value.getBoundingClientRect().top + scrollY
  end.value = Math.max(
    start.value + article.value.offsetHeight - height.value,
    start.value + 1,
  )
  headingPositions.value = Array.from(
    article.value.querySelectorAll<HTMLElement>(
      '.article-prose h2, .article-prose h3',
    ),
    (heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top + scrollY,
    }),
  )
}

useResizeObserver(article, measure)
watch([width, height], measure, { flush: 'post' })
useEventListener('pageshow', measure)
useEventListener(() => article.value?.ownerDocument, 'astro:page-load', measure)
useEventListener(
  () => article.value?.ownerDocument.fonts,
  'loadingdone',
  measure,
)
onMounted(() => {
  article.value = document.getElementById(props.articleId)
  measure()
  void document.fonts.ready.then(measure)
})

const progress = computed(() => {
  if (!article.value || y.value <= start.value) return 0
  const distance = end.value - start.value
  return distance <= 1 || y.value >= end.value - 1
    ? 100
    : Math.max(0, Math.min(100, ((y.value - start.value) / distance) * 100))
})
const percent = computed(() => Math.floor(progress.value))
const currentHeading = computed(
  () =>
    headingPositions.value.findLast(({ top }) => top <= y.value + 150)?.id ??
    null,
)
</script>

<template>
  <div data-article-controls>
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
      <span class="reading-progress__label" data-reading-progress-label>
        {{ percent }}%
      </span>
    </div>
    <Disclosure
      v-if="headings.length > 2"
      v-model:open="tocOpen"
      class="article-toc-mobile"
      content-class="article-toc-mobile__content"
    >
      <template #summary>
        <span>目次</span><small>{{ headings.length }}項目</small>
      </template>
      <nav aria-label="目次">
        <ArticleTocList
          :headings="headings"
          :current-heading="currentHeading"
          @select="tocOpen = false"
        />
      </nav>
    </Disclosure>
    <div class="article-layout">
      <nav v-if="headings.length > 2" class="article-toc" aria-label="目次">
        <div class="article-toc__head">
          <strong>目次</strong>
          <span data-reading-progress-label>{{ percent }}%</span>
        </div>
        <ArticleTocList
          :headings="headings"
          :current-heading="currentHeading"
        />
      </nav>
      <div class="article-prose"><slot /></div>
    </div>
  </div>
</template>
