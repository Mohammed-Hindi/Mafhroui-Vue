<template>
  <AssistantChat
    title="المساعد الآلي للجنة الإشراف"
    empty-hint="اسأل عن حالة الفرق والمشرفين، صياغة تعميم للطلاب، أو تلخيص نسبة تقدّم المشاريع."
    :suggestions="suggestions"
  />
</template>

<script>
import AssistantChat from '@/components/shared/AssistantChat.vue'

export default {
  name: 'CommitteeAssistantPage',
  components: { AssistantChat },
  data() {
    return {
      suggestions: [
        'لخّص لي نسبة تقدّم المشاريع هذا الفصل',
        'اكتب تعميمًا للطلاب حول موعد تسليم المقترحات',
        'ما الفرق التي تحتاج متابعة عاجلة؟'
      ]
    }
  }
}
</script>
