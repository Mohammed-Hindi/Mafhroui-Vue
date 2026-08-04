<template>
  <div class="flex flex-col items-center text-center py-10 px-4">
    <span class="grid place-items-center w-16 h-16 rounded-pill bg-success-bg text-success mb-4">
      <CheckCircle2 :size="30" />
    </span>
    <h4 class="text-h4 font-bold text-text-900 mb-1.5">{{ title }}</h4>
    <p class="text-body-sm text-text-600 max-w-xs">{{ description }}</p>

    <div v-if="items.length" class="mt-5 flex flex-col gap-2 w-full max-w-xs">
      <button
        v-for="item in items" :key="item.label"
        type="button"
        class="flex items-center gap-3 bg-bg border border-border rounded-md px-4 py-3 hover:border-primary-200 hover:bg-primary-50 transition-colors duration-fast text-start"
        @click="item.onClick"
      >
        <span class="grid place-items-center w-9 h-9 rounded-md bg-primary-50 text-primary-600 shrink-0">
          <component :is="item.icon" :size="16" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-caption font-bold text-text-900">{{ item.label }}</span>
          <span class="block text-label text-text-400 truncate">{{ item.fileName }}</span>
        </span>
        <ExternalLink :size="13" class="text-text-400 shrink-0" />
      </button>
    </div>
  </div>
</template>

<script>
import { CheckCircle2, ExternalLink } from 'lucide-vue-next'

export default {
  name: 'SubmittedState',

  components: { CheckCircle2, ExternalLink },

  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    items: { type: Array, default: () => [] }
  }
}
</script>
