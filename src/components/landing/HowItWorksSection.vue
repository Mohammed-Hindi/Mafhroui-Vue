<template>
  <!-- كيف تعمل المنصة بنمط شبكة العمادات (195731): أيقونة خطية ملوّنة لكل خطوة + عنوان كحلي + وصف رمادي -->
  <section id="how" class="us-section scroll-mt-24">
    <div class="us-wrap">
      <h2 class="us-title reveal">كيف تعمل المنصة</h2>
      <ol class="us-steps">
        <li v-for="step in steps" :key="step.title" class="us-step reveal">
          <span class="us-step-ic" :style="{ color: step.color }"><component :is="step.icon" :size="38" :stroke-width="1.4" /></span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import { Archive, CalendarDays, FileText, KeyRound, Users } from 'lucide-vue-next'

// ألوان عمادات الكلية (الدليل 6.2.1) — أيقونات خطية بلا مربعات
const steps = [
  { title: 'الدخول للمنصة', description: 'تُرسل الإدارة بيانات الدخول لكل طالب ومشرف بالبريد والواتساب', icon: KeyRound, color: '#005BAA' },
  { title: 'تكوين المجموعات', description: 'تنسّق لجنة الإشراف المجموعات وتربط كل مجموعة بمشرف', icon: Users, color: '#62BB46' },
  { title: 'تقديم المقترح', description: 'تقدّم المجموعة مقترحها ويعتمده المشرف ولجنة الإشراف', icon: FileText, color: '#0E699C' },
  { title: 'المهام والاجتماعات', description: 'لوحة مهام الفريق والاجتماعات والإعلانات مع المشرف', icon: CalendarDays, color: '#FF9800' },
  { title: 'المناقشة والأرشفة', description: 'جدول المناقشات ثم اعتماد التقرير النهائي وأرشفة المشروع', icon: Archive, color: '#233B77' }
]
</script>
