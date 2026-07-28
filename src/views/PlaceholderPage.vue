<template>
  <div class="bg-surface rounded-lg border border-border shadow-card">
    <EmptyState
      title="هذه الصفحة لم تُبنَ بعد"
      description="صِف الصفحة (المحتوى، الحقول، الجداول، التفاعلات) وسيتم بناؤها كاملة مكانها."
      :icon="Hammer"
    />
  </div>
</template>

<script>
import { Hammer } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'

export default {
  name: 'PlaceholderPage',
  components: { EmptyState },
  data() {
    return { Hammer }
  }
}
</script>
