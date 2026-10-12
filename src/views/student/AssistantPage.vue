<template>
  <div class="dash hd-page">
    <header class="dash-head"><h2 class="dash-title">المساعد الآلي</h2></header>
    <AssistantChat
      title="المساعد الآلي للطالب"
      empty-hint="اسأل عن صياغة وصف المشروع، تجهيز التقرير النهائي، أو مهامك ضمن الفريق."
      :suggestions="suggestions"
    />
  </div>
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
