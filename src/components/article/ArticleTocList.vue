<script setup lang="ts">
type Heading = { depth: number; slug: string; text: string }
defineProps<{ headings: Heading[]; currentHeading?: string | null }>()
defineEmits<{ select: [event: MouseEvent] }>()
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
        :class="{ active: currentHeading === heading.slug }"
        :aria-current="currentHeading === heading.slug ? 'location' : undefined"
        @click="$emit('select', $event)"
        >{{ heading.text }}</a
      >
    </li>
  </ol>
</template>
