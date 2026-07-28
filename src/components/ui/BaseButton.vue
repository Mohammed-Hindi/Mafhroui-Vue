<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :to="to || undefined"
    :href="href || undefined"
    :disabled="isDisabled"
    :class="classes"
    @click="handleClick"
  >
    <LoadingSpinner v-if="loading" :size="16" class="shrink-0" inline />
    <component :is="icon" v-else-if="icon" :size="iconSize" class="shrink-0" />
    <span v-if="$slots.default" :class="{ 'sr-only': iconOnly }"><slot /></span>
  </component>
</template>

<script>
import LoadingSpinner from './LoadingSpinner.vue'

export default {
  name: 'BaseButton',

  components: { LoadingSpinner },

  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: (v) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'soft'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v)
    },
    type: { type: String, default: 'button' },
    to: { type: [String, Object], default: null },
    href: { type: String, default: null },
    icon: { type: [Object, Function], default: null },
    iconOnly: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },

  emits: ['click'],

  computed: {
    tag() {
      if (this.to) return 'router-link'
      if (this.href) return 'a'
      return 'button'
    },

    isDisabled() {
      return this.disabled || this.loading
    },

    iconSize() {
      return { sm: 15, md: 17, lg: 19 }[this.size]
    },

    classes() {
      const base =
        'inline-flex items-center justify-center gap-2 rounded-sm font-cairo font-semibold transition-all duration-fast select-none disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none'

      const sizes = {
        sm: this.iconOnly ? 'w-9 h-9 text-caption' : 'h-9 px-3 text-caption',
        md: this.iconOnly ? 'w-icon-btn h-icon-btn text-body-sm' : 'h-icon-btn px-4 text-body-sm',
        lg: this.iconOnly ? 'w-12 h-12 text-h4' : 'h-12 px-6 text-h4'
      }

      const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-card',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-card',
        outline: 'bg-surface text-text-700 border border-border hover:border-primary-100 hover:text-primary-600 hover:bg-primary-50',
        ghost: 'bg-transparent text-text-600 hover:bg-border-soft hover:text-text-900',
        danger: 'bg-error text-white hover:brightness-95 shadow-card',
        soft: 'bg-primary-50 text-primary-600 hover:bg-primary-100'
      }

      return [base, sizes[this.size], variants[this.variant], this.block && 'w-full']
    }
  },

  methods: {
    handleClick(event) {
      if (this.isDisabled) {
        event.preventDefault()
        return
      }
      this.$emit('click', event)
    }
  }
}
</script>
