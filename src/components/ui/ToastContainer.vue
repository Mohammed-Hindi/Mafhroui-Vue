<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-toast flex flex-col gap-2 w-[min(400px,calc(100vw-2rem))]">
    <transition-group
      enter-active-class="transition duration-base ease-standard"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-fast"
      leave-to-class="opacity-0 scale-95"
      move-class="transition duration-base"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['flex items-start gap-3 px-4 py-3 rounded-md border shadow-dropdown bg-surface', styleFor(toast.type)]"
        role="alert"
      >
        <component :is="iconFor(toast.type)" :size="19" class="shrink-0 mt-0.5" />
        <p class="flex-1 text-body-sm text-text-900">{{ toast.message }}</p>
        <button
          type="button"
          class="shrink-0 text-text-400 hover:text-text-900 transition-colors duration-fast"
          aria-label="إغلاق التنبيه"
          @click="dismissToast(toast.id)"
        >
          <X :size="16" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'

export default {
  name: 'ToastContainer',

  components: { X },

  computed: {
    ...mapState(useUiStore, ['toasts'])
  },

  methods: {
    ...mapActions(useUiStore, ['dismissToast']),

    iconFor(type) {
      return { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }[type] || Info
    },

    styleFor(type) {
      return {
        success: 'border-success-border text-success',
        error: 'border-error-border text-error',
        warning: 'border-warning-border text-warning-text',
        info: 'border-primary-100 text-primary-600'
      }[type] || 'border-border text-text-700'
    }
  }
}
</script>
