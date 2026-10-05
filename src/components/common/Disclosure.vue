<script setup lang="ts">
const props = defineProps<{
  contentClass?: string
}>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <UCollapsible
    v-model:open="open"
    :unmount-on-hide="false"
    :ui="{
      content: ['disclosure-content', props.contentClass]
        .filter(Boolean)
        .join(' '),
    }"
    data-disclosure
  >
    <button type="button" class="disclosure-trigger">
      <slot name="summary" />
    </button>
    <template #content>
      <slot />
    </template>
  </UCollapsible>
</template>
