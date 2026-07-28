<template>
  <div class="flex flex-col items-center justify-center text-center px-6 py-12">
    <span class="grid place-items-center w-16 h-16 rounded-pill bg-error-bg text-error mb-4">
      <AlertTriangle :size="28" />
    </span>
    <h3 class="font-cairo font-bold text-h3 text-text-900">{{ title }}</h3>
    <p class="mt-2 max-w-sm text-body-sm text-text-600">{{ message }}</p>
    <BaseButton variant="outline" class="mt-6" @click="$emit('retry')">إعادة المحاولة</BaseButton>
  </div>
</template>

<script>
import { AlertTriangle } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'

export default {
  name: 'ErrorState',
  components: { AlertTriangle, BaseButton },
  props: {
    title: { type: String, default: 'تعذّر تحميل البيانات' },
    message: { type: String, default: 'حدث خطأ أثناء الاتصال بالخادم' }
  },
  emits: ['retry']
}
</script>
