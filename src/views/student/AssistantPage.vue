<template>
  <AssistantChat
    title="المساعد الآلي للطالب"
    empty-hint="اسأل عن صياغة وصف المشروع، تجهيز التقرير النهائي، أو مهامك ضمن الفريق."
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
        'كيف أتابع مهامي ضمن لوحة الفريق؟'
      ]
    }
  }
}
</script>
