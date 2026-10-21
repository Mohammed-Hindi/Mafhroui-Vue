<template>
  <!-- المساعد الآلي للمشرف: نفس تصميم المساعد تبع السوبر أدمن (بطاقة بوابة تملأ الشاشة + شريط أسئلة) -->
  <div class="dash hd-page ac-page">
    <AssistantChat
      title="مساعدك الذكي لمتابعة مشاريع فرقك"
      empty-hint="اسأل عن حالة فرقك، صياغة ملاحظات على مقترح، أو التحضير لاجتماع مناقشة."
      :suggestions="suggestions"
    />
  </div>
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
