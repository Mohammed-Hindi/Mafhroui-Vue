<template>
  <AssistantChat
    title="المساعد الآلي للمشرف"
    empty-hint="اسأل عن حالة فرقك، صياغة ملاحظات على مقترح، أو التحضير لاجتماع مناقشة."
    :suggestions="suggestions"
  />
</template>

<script>
import AssistantChat from '@/components/shared/AssistantChat.vue'

export default {
  name: 'SupervisorAssistantPage',
  components: { AssistantChat },
  data() {
    return {
      suggestions: [
        'لخّص لي حالة تقدّم الفرق المُشرَف عليها',
        'اكتب ملاحظات على مقترح ضعيف التوثيق',
        'حضّر لي أسئلة لمناقشة مشروع'
      ]
    }
  }
}
</script>
