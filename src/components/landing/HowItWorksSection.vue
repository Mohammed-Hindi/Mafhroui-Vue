<template>
  <!-- كيف تعمل المنصة بنمط شبكة العمادات (195731): أيقونة خطية ملوّنة لكل خطوة + عنوان كحلي + وصف رمادي.
       الحركة (GSAP): خط تدرّج يربط الخطوات ويمتد مع التمرير، وكل خطوة تظهر وترسم أيقونتها عند وصول الخط إليها -->
  <section id="how" ref="root" class="us-section scroll-mt-24">
    <div class="us-wrap">
      <h2 class="us-title">كيف تعمل المنصة</h2>
      <div class="us-steps-wrap">
      <span class="us-steps-line" aria-hidden="true" />
      <ol class="us-steps">
        <li v-for="step in steps" :key="step.title" class="us-step">
          <span class="us-step-ic" :style="{ color: step.color }"><component :is="step.icon" :size="38" :stroke-width="1.4" /></span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Archive, CalendarDays, FileText, KeyRound, Users } from 'lucide-vue-next'
import { gsap, iconParts, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
useScrollMotion(root, (el) => {
  titleIn(gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 72%' } }), el.querySelector('.us-title'))
  // الخط يمتد من الخطوة الأولى (يمينًا) مع التمرير
  gsap.fromTo(el.querySelector('.us-steps-line'), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: el.querySelector('.us-steps'), start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } })
  // الخطوات تتوالى من الأولى، وكل أيقونة تُرسم بعد ظهور خطوتها
  const tl = gsap.timeline({ scrollTrigger: { trigger: el.querySelector('.us-steps'), start: 'top 78%' } })
  el.querySelectorAll('.us-step').forEach((step, i) => {
    tl.from(step, { y: 36, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, i * 0.16)
      .from(iconParts(step), { drawSVG: 0, duration: 1, ease: 'power2.inOut' }, i * 0.16 + 0.15)
  })
})

// ألوان عمادات الكلية (الدليل 6.2.1) — أيقونات خطية بلا مربعات
const steps = [
  { title: 'الدخول للمنصة', description: 'تُرسل الإدارة بيانات الدخول لكل طالب ومشرف بالبريد والواتساب', icon: KeyRound, color: '#005BAA' },
  { title: 'تكوين المجموعات', description: 'تنسّق لجنة الإشراف المجموعات وتربط كل مجموعة بمشرف', icon: Users, color: '#62BB46' },
  { title: 'تقديم المقترح', description: 'تقدّم المجموعة مقترحها ويعتمده المشرف ولجنة الإشراف', icon: FileText, color: '#0E699C' },
  { title: 'المهام والاجتماعات', description: 'لوحة مهام الفريق والاجتماعات والإعلانات مع المشرف', icon: CalendarDays, color: '#FF9800' },
  { title: 'المناقشة والأرشفة', description: 'جدول المناقشات ثم اعتماد التقرير النهائي وأرشفة المشروع', icon: Archive, color: '#233B77' }
]
</script>
