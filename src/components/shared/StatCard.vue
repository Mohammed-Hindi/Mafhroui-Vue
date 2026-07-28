<template>
  <div class="bg-surface rounded-lg border border-border shadow-card p-4 sm:p-6 transition-shadow duration-base hover:shadow-card-hover">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-label font-semibold text-text-400">{{ label }}</p>
        <p class="mt-2 font-cairo font-extrabold text-display text-text-900 leading-none">
          <SkeletonLoader v-if="loading" :rows="1" height="32px" />
          <template v-else>{{ formatNumber(value) }}</template>
        </p>
        <p v-if="hint" class="mt-2 text-caption text-text-600">{{ hint }}</p>
      </div>

      <span :class="['grid place-items-center w-12 h-12 rounded-md shrink-0', toneClass]">
        <component :is="icon" :size="22" />
      </span>
    </div>
  </div>
</template>

<script>
import { formatNumber } from '@/utils/formatters'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

export default {
  name: 'StatCard',
  components: { SkeletonLoader },
  props: {
    label: { type: String, required: true },
    value: { type: [Number, String], default: 0 },
    hint: { type: String, default: '' },
    icon: { type: [Object, Function], default: null },
    tone: { type: String, default: 'primary' },
    loading: { type: Boolean, default: false }
  },
  computed: {
    toneClass() {
      return {
        primary: 'bg-primary-50 text-primary-600',
        success: 'bg-success-bg text-success',
        warning: 'bg-warning-bg text-warning-text',
        error: 'bg-error-bg text-error',
        accent: 'bg-accent-50 text-accent-600'
      }[this.tone]
    }
  },
  methods: { formatNumber }
}
</script>
