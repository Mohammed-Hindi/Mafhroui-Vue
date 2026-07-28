<template>
  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-label font-semibold', variantClass]">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-pill bg-current" />
    <slot />
  </span>
</template>

<script>
export default {
  name: 'BaseBadge',
  props: {
    variant: {
      type: String,
      default: 'neutral',
      validator: (v) => ['neutral', 'success', 'warning', 'error', 'info', 'primary'].includes(v)
    },
    dot: { type: Boolean, default: false }
  },
  computed: {
    variantClass() {
      return {
        neutral: 'bg-border-soft text-text-600',
        success: 'bg-success-bg text-success',
        warning: 'bg-warning-bg text-warning-text',
        error: 'bg-error-bg text-error',
        info: 'bg-info-bg text-info',
        primary: 'bg-primary-50 text-primary-600'
      }[this.variant]
    }
  }
}
</script>
