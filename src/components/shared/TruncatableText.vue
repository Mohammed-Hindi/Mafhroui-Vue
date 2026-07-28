<template>
  <span class="inline-flex items-baseline gap-1">
    <span>{{ isExpanded ? text : truncated }}</span>
    <button
      v-if="isTruncatable"
      type="button"
      class="text-caption text-primary-600 hover:text-primary-700 font-medium shrink-0"
      @click="isExpanded = !isExpanded"
    >
      {{ isExpanded ? 'أقل' : 'المزيد' }}
    </button>
  </span>
</template>

<script>
import { truncate } from '@/utils/formatters'

export default {
  name: 'TruncatableText',
  props: {
    text: { type: String, default: '' },
    length: { type: Number, default: 80 }
  },
  data() {
    return { isExpanded: false }
  },
  computed: {
    truncated() {
      return truncate(this.text, this.length)
    },
    isTruncatable() {
      return (this.text || '').length > this.length
    }
  }
}
</script>
