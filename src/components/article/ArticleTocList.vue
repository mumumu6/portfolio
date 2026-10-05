<script setup lang="ts">
type Heading = { depth: number; slug: string; text: string }
defineProps<{ headings: Heading[]; currentHeading: string | null }>()
const emit = defineEmits<{ select: [] }>()

const select = (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return
  emit('select')
}
</script>

<template>
  <ol v-memo="[headings, currentHeading]">
    <li
      v-for="heading in headings"
      :key="heading.slug"
      :class="`article-toc--depth-${heading.depth}`"
    >
      <a
        :href="`#${encodeURIComponent(heading.slug)}`"
        data-toc-link
        :class="{ active: currentHeading === heading.slug }"
        :aria-current="currentHeading === heading.slug ? 'location' : undefined"
        @click="select"
      >
        {{ heading.text }}
      </a>
    </li>
  </ol>
</template>
