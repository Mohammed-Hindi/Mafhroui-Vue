<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-base"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-fast"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-modal-overlay bg-text-900/50 backdrop-blur-[2px]" @click="handleOverlayClick" />
    </transition>

    <transition
      enter-active-class="transition duration-base ease-standard"
      enter-from-class="opacity-0 scale-95"
      leave-active-class="transition duration-fast"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-modal flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div
          ref="dialog"
          :class="['pointer-events-auto w-full bg-surface rounded-lg shadow-modal flex flex-col max-h-[calc(100vh-2rem)]', widthClass]"
        >
          <header class="flex items-start justify-between gap-4 px-6 py-4 border-b border-border-soft shrink-0">
            <div>
              <h2 class="font-cairo font-bold text-h3 text-text-900">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-body-sm text-text-600">{{ description }}</p>
            </div>
            <button
              type="button"
              class="grid place-items-center w-9 h-9 rounded-sm text-text-400 hover:bg-border-soft hover:text-text-900 transition-colors duration-fast shrink-0"
              aria-label="إغلاق"
              @click="close"
            >
              <X :size="18" />
            </button>
          </header>

          <div class="px-6 py-5 overflow-y-auto scrollbar-thin flex-1">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-soft shrink-0">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { X } from 'lucide-vue-next'

export default {
  name: 'BaseModal',

  components: { X },

  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v) },
    closeOnOverlay: { type: Boolean, default: true }
  },

  emits: ['update:modelValue', 'close'],

  computed: {
    widthClass() {
      return { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[this.size]
    }
  },

  watch: {
    modelValue(open) {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  },

  mounted() {
    document.addEventListener('keydown', this.handleEscape)
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscape)
    document.body.style.overflow = ''
  },

  methods: {
    close() {
      this.$emit('update:modelValue', false)
      this.$emit('close')
    },
    handleOverlayClick() {
      if (this.closeOnOverlay) this.close()
    },
    handleEscape(event) {
      if (event.key === 'Escape' && this.modelValue) this.close()
    }
  }
}
</script>
