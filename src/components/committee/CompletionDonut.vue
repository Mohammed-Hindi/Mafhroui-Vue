<template>
  <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col items-center">
    <h3 class="text-h3 font-bold text-text-900 mb-5">متوسط نسبة الإنجاز</h3>

    <div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" style="transform: rotate(-90deg)">
        <circle :cx="size / 2" :cy="size / 2" :r="radius" fill="none" stroke="var(--color-border-soft)" :stroke-width="strokeWidth" />
        <circle
          :cx="size / 2" :cy="size / 2" :r="radius" fill="none"
          stroke="var(--color-primary-600)" :stroke-width="strokeWidth"
          :stroke-dasharray="circumference" :stroke-dashoffset="offset"
          stroke-linecap="round" class="transition-all duration-slow"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="font-cairo font-black text-h1 text-text-900">{{ percent }}%</span>
        <span class="text-label text-text-600">متوسط الإنجاز</span>
      </div>
    </div>

    <div v-if="showLegend" class="flex gap-6 mt-4">
      <span class="flex items-center gap-2 text-caption text-text-600">
        <span class="w-2 h-2 rounded-pill" style="background: var(--color-primary-600)" /> منجز
      </span>
      <span class="flex items-center gap-2 text-caption text-text-600">
        <span class="w-2 h-2 rounded-pill bg-border-soft border border-border" /> متبقي
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompletionDonut',
  props: {
    percent: { type: Number, default: 0 },
    size: { type: Number, default: 150 },
    strokeWidth: { type: Number, default: 16 },
    showLegend: { type: Boolean, default: true }
  },
  computed: {
    radius() {
      return this.size / 2 - this.strokeWidth / 2 - 4
    },
    circumference() {
      return 2 * Math.PI * this.radius
    },
    offset() {
      return this.circumference * (1 - Math.min(100, Math.max(0, this.percent)) / 100)
    }
  }
}
</script>
