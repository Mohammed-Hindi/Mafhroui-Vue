<template>
  <AssistantChat
    title="المساعد الآلي لقائد الفريق"
    empty-hint="اسأل عن صياغة المقترح، تجهيز التقرير النهائي، أو تنظيم مهام الفريق."
    :suggestions="suggestions"
  />
</template>

<script>
import AssistantChat from '@/components/shared/AssistantChat.vue'

export default {
  name: 'StudentAssistantPage',
  components: { AssistantChat },
  data() {
    return {
      suggestions: [
        'ساعدني في صياغة وصف مشروعي',
        'ما الذي يجب أن يتضمنه التقرير النهائي؟',
        'كيف أوزّع المهام على أعضاء الفريق؟'
      ]
    }
  }
}
</script>
