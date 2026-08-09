<template>
  <div class="flex flex-col items-center justify-center text-center px-6 py-12">
    <span class="grid place-items-center w-16 h-16 rounded-pill bg-primary-50 text-primary-600 mb-4">
      <component :is="icon" :size="28" />
    </span>
    <h3 class="font-cairo font-bold text-h3 text-text-900">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-sm text-body-sm text-text-600">{{ description }}</p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>

<script>
import { Inbox } from 'lucide-vue-next'

export default {
  name: 'EmptyState',
  props: {
    title: { type: String, default: 'لا توجد بيانات بعد' },
    description: { type: String, default: '' },
    icon: { type: [Object, Function], default: () => Inbox }
  }
}
</script>
