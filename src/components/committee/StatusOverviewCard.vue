<template>
  <div class="bg-surface rounded-lg border border-border shadow-card p-6">
    <h3 class="text-h3 font-bold text-text-900 mb-5">توزيع حالات المشاريع</h3>

    <div v-for="item in distribution" :key="item.label" class="mb-4 last:mb-0">
      <div class="flex justify-between text-body-sm mb-2">
        <span class="font-bold text-text-900">{{ formatNumber(item.count) }} مشروع</span>
        <span class="text-text-600">{{ item.label }}</span>
      </div>
      <div class="h-[9px] rounded-pill bg-border-soft overflow-hidden">
        <div class="h-full rounded-pill transition-all duration-slow" :style="{ width: item.percent + '%', background: barColor(item.color) }" />
      </div>
    </div>
  </div>
</template>

<script>
import { formatNumber } from '@/utils/formatters'

export default {
  name: 'StatusOverviewCard',
  props: {
    /** [{ label, count, percent, color: 'success'|'primary'|'warning' }] */
    distribution: { type: Array, default: () => [] }
  },
  methods: {
    formatNumber,
    barColor(color) {
      return {
        success: 'linear-gradient(90deg, var(--color-secondary-500), var(--color-secondary-600))',
        primary: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600))',
        warning: 'linear-gradient(90deg, var(--color-warning), #D97706)'
      }[color] || 'var(--color-border-soft)'
    }
  }
}
</script>
