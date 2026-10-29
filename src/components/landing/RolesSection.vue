<template>
  <!-- ميزات المنصة بنمط "ما يميز الكلية!" (195926): خلفية التدرج، أيقونات خطية بيضاء، عناوين بيضاء.
       الحركة (GSAP): العنوان كلمة كلمة، البطاقات تصعد بوضوح تدريجي، الأيقونات تُرسم، ثم البنود تتوالى -->
  <section ref="root" class="us-section us-feature-band">
    <div class="us-wrap">
      <h2 class="us-title">ما يميز منصة مسار!</h2>
      <div class="us-features">
        <article v-for="role in roles" :key="role.title" class="us-feature">
          <component :is="role.icon" :size="68" :stroke-width="1.2" />
          <h3>{{ role.title }}</h3>
          <ul>
            <li v-for="f in role.features" :key="f">{{ f }}</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { GraduationCap, ShieldCheck, UserCheck } from 'lucide-vue-next'
import { gsap, iconParts, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
useScrollMotion(root, (el) => {
  const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 70%' } })
  titleIn(tl, el.querySelector('.us-title'))
    .from(el.querySelectorAll('.us-feature'), { y: 50, autoAlpha: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out', stagger: 0.15 }, '-=0.6')
    .from(iconParts(el), { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.04 }, '<0.1')
    .from(el.querySelectorAll('.us-feature li'), { x: 24, autoAlpha: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, '<0.4')
})

/* محتوى تعريفي ثابت — ليس بيانات أعمال */
const roles = [
  {
    title: 'لجنة الإشراف',
    icon: ShieldCheck,
    features: ['إدارة الفصول والمجموعات والمشرفين', 'جدولة مواعيد المناقشات ونشرها', 'اعتماد التقارير النهائية وأرشفة المشاريع', 'تمييز وترتيب المشاريع المتميّزة']
  },
  {
    title: 'المشرف',
    icon: UserCheck,
    features: ['متابعة مجموعاته ومهامها وتقدّمها', 'مراجعة المقترحات والتقارير النهائية', 'الاجتماعات والتكليفات والإعلانات', 'تقييم الطلاب بنماذج الكلية']
  },
  {
    title: 'الطالب',
    icon: GraduationCap,
    features: ['تقديم المقترح والتقرير النهائي', 'لوحة مهام الفريق والملاحظات', 'الاجتماعات والإعلانات والملفات', 'مساعد آلي للإجابة عن الاستفسارات']
  }
]
</script>
