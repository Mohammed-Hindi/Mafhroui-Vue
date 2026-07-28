<template>
  <span class="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-pill bg-primary-50 text-primary-600 text-caption font-medium">
    <slot />
    <button
      v-if="removable"
      type="button"
      class="grid place-items-center w-4 h-4 rounded-pill hover:bg-primary-100 transition-colors duration-fast"
      aria-label="إزالة"
      @click="$emit('remove')"
    >
      <X :size="12" />
    </button>
  </span>
</template>

<script>
import { X } from 'lucide-vue-next'

export default {
  name: 'BaseChip',
  components: { X },
  props: { removable: { type: Boolean, default: false } },
  emits: ['remove']
}
</script>
