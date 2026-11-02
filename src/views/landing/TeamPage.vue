<template>
  <!-- فريق التطوير بنمط موقع الكلية: شريط عنوان متدرّج، فقرة تعريفية، ثم بطاقات أعضاء حادة مطفية
       (أفاتار بالحرف الأول، الاسم، الدور، وصف موجز، وشارات التقنيات)، وبطاقة المشرف الأكاديمي أسفلها.
       الحركة هادئة (fade-up) بلا رسم: رأس الصفحة عند الفتح، والبطاقات تظهر بهدوء عند الوصول إليها -->
  <div ref="root">
    <header class="us-pagehead">
      <div class="us-wrap">
        <h1>فريق تطوير {{ APP_NAME }}</h1>
        <p>الفريق الذي حوّل فكرة مشروع التخرّج إلى منصّة متكاملة تخدم كل أطراف العملية الأكاديمية.</p>
        <nav class="us-crumbs" aria-label="مسار التنقل">
          <router-link :to="{ name: 'landing' }">الرئيسية</router-link><span>/</span><span>فريق التطوير</span>
        </nav>
      </div>
    </header>

    <section class="us-section">
      <div class="us-wrap">
        <div class="us-about">
          <p class="us-lead">
            طُوّرت منصة {{ APP_NAME }} على يد فريق من طلاب دبلوم تصميم وتطوير مواقع الويب في الكلية الجامعية للعلوم التطبيقية،
            جمعهم مشروع التخرّج فعملوا معًا على تحويل فكرته إلى منصّة رقمية متكاملة تدير دورة حياة مشاريع التخرج كاملة.
          </p>
          <p>
            وزّع أعضاء الفريق أدوارهم بين تصميم الواجهة وتجربة المستخدم وتطوير الواجهة الأمامية والخلفية، ليخرج النظام بتجربة
            واحدة متناسقة تربط العمادة ولجنة الإشراف والمشرفين والطلاب في بيئة عمل موحّدة.
          </p>
        </div>

        <ul class="us-tm-grid">
          <li v-for="m in members" :key="m.name" class="us-tm-card">
            <span class="us-tm-av" aria-hidden="true">{{ m.name.charAt(0) }}</span>
            <strong class="us-tm-name">{{ m.name }}</strong>
            <span class="us-tm-role">{{ m.role }}</span>
            <p class="us-tm-desc">{{ m.desc }}</p>
            <ul class="us-tm-tech">
              <li v-for="t in m.tech" :key="t">{{ t }}</li>
            </ul>
          </li>
        </ul>

        <div class="us-tm-sup-wrap">
          <article class="us-tm-card is-sup">
            <span class="us-tm-badge">المشرف الأكاديمي</span>
            <span class="us-tm-av" aria-hidden="true">{{ supervisor.name.charAt(0) }}</span>
            <strong class="us-tm-name">{{ supervisor.name }}</strong>
            <span class="us-tm-role">{{ supervisor.role }}</span>
            <p class="us-tm-desc">{{ supervisor.desc }}</p>
            <ul class="us-tm-tech">
              <li><GraduationCap :size="14" /> الكلية الجامعية للعلوم التطبيقية</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { GraduationCap } from 'lucide-vue-next'
import { APP_NAME } from '@/utils/constants'
import { ref } from 'vue'
import { gsap, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
// دخول هادئ رسمي بلا رسم: رأس الصفحة عند الفتح، والفقرة والبطاقات تظهر بهدوء (fade-up) عند الوصول إليها
useScrollMotion(root, (el) => {
  const q = (s, scope = el) => scope.querySelector(s)

  gsap.timeline({ delay: 0.1 })
    .from(q('.us-pagehead h1'), { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
    .from(q('.us-pagehead p'), { y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .from(q('.us-crumbs'), { autoAlpha: 0, duration: 0.4 }, '-=0.25')

  el.querySelectorAll(':scope > section').forEach((sec) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%' } })
    titleIn(tl, q('.us-title', sec))
    const items = sec.querySelectorAll('.us-about > p, .us-tm-card')
    if (items.length) tl.from(items, { y: 22, autoAlpha: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, '-=0.2')
  })
})

// أدوار وتقنيات مبدئية — عدّلوها حسب الواقع
const members = [
  { name: 'انس محمد الشنطي', role: 'Frontend Developer', desc: 'بناء واجهة المنصة وتجربة المستخدم وربطها بواجهات الخادم.', tech: ['Vue.js', 'JavaScript', 'CSS'] },
  { name: 'محمد زياد الغول', role: 'Full-Stack Developer', desc: 'تطوير واجهات الخادم وربطها بالواجهة الأمامية وإدارة قاعدة البيانات.', tech: ['Laravel', 'Vue.js', 'MySQL'] },
  { name: 'محمد رفعت النونو', role: 'Backend Developer', desc: 'تصميم منطق النظام وواجهات الـ API والصلاحيات والأمان.', tech: ['Laravel', 'PHP', 'MySQL'] },
  { name: 'محمد هشام الهندي', role: 'UI/UX Designer', desc: 'تصميم الهوية البصرية وتجربة المستخدم وتدفّق الشاشات.', tech: ['Figma', 'UI/UX', 'CSS'] }
]

const supervisor = {
  name: 'م. محمود ظهير',
  role: 'المشرف الأكاديمي',
  desc: 'إشراف أكاديمي على مشروع التخرّج ومتابعة الفريق من الفكرة حتى المناقشة.'
}
</script>
