<template>
  <div class="flex flex-col items-center text-center py-10 px-4">
    <span class="grid place-items-center w-16 h-16 rounded-pill mb-4" :class="rejected ? 'bg-error-bg text-error' : 'bg-success-bg text-success'">
      <XCircle v-if="rejected" :size="30" />
      <CheckCircle2 v-else :size="30" />
    </span>
    <h4 class="text-h4 font-bold text-text-900 mb-1.5">{{ title }}</h4>
    <p class="text-body-sm text-text-600 max-w-xs">{{ description }}</p>

    <div v-if="rejected && rejectReason" class="mt-4 flex items-start gap-2 px-4 py-3 bg-error-bg border border-error-border/50 rounded-md text-start w-full max-w-xs">
      <XCircle :size="14" class="text-error shrink-0 mt-0.5" />
      <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب الرفض: </span>{{ rejectReason }}</p>
    </div>

    <div v-if="items.length" class="mt-5 flex flex-col gap-2 w-full max-w-xs">
      <button
        v-for="item in items" :key="item.label"
        type="button"
        class="flex items-center gap-3 bg-bg border border-border rounded-md px-4 py-3 hover:border-primary-200 hover:bg-primary-50 transition-colors duration-fast text-start"
        @click="handleClick(item)"
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
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-vue-next'

export default {
  name: 'SubmittedState',

  components: { CheckCircle2, XCircle, ExternalLink },

  props: {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    items: { type: Array, default: () => [] },
    rejected: { type: Boolean, default: false },
    rejectReason: { type: String, default: '' }
  },

  methods: {
    async handleClick(item) {
      try {
        await item.onClick()
      } catch {
        // الرسالة انعرضت أصلاً كـ toast من مصدر الطلب — هون بس منمنع unhandled rejection
      }
    }
  }
}
</script>
