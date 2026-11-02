<template>
  <!-- فريق التطوير بنمط موقع الكلية: شريط عنوان متدرّج، فقرة تعريفية، ثم بطاقات أعضاء حادة مطفية
       (أفاتار صامت بلا ملامح، الاسم، الدور، وصف موجز)، ثم سطر المشرف الأكاديمي نصّيًا.
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
            وزّع أعضاء الفريق أدوارهم بين تصميم الواجهة وتجربة المستخدم وتطوير الواجهة الأمامية والخلفية والاختبار،
            ليخرج النظام بتجربة واحدة متناسقة تربط العمادة ولجنة الإشراف والمشرفين والطلاب في بيئة عمل موحّدة.
          </p>
        </div>

        <ul class="us-tm-grid">
          <li v-for="m in members" :key="m.name" class="us-tm-card">
            <span class="us-tm-av" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 20.2c0-4.1 3.7-6.7 8-6.7s8 2.6 8 6.7v.3H4z" /></svg>
            </span>
            <strong class="us-tm-name">{{ m.name }}</strong>
            <span class="us-tm-role">{{ m.role }}</span>
            <p class="us-tm-desc">{{ m.desc }}</p>
          </li>
        </ul>

        <p class="us-tm-sup">بإشراف المشرف القدير المميّز <strong>م. محمود ظهير</strong></p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { APP_NAME } from '@/utils/constants'
import { ref } from 'vue'
import { gsap, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
// دخول هادئ رسمي بلا رسم: رأس الصفحة عند الفتح، والفقرة والبطاقات وسطر المشرف تظهر بهدوء (fade-up)
useScrollMotion(root, (el) => {
  const q = (s, scope = el) => scope.querySelector(s)

  gsap.timeline({ delay: 0.1 })
    .from(q('.us-pagehead h1'), { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
    .from(q('.us-pagehead p'), { y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .from(q('.us-crumbs'), { autoAlpha: 0, duration: 0.4 }, '-=0.25')

  el.querySelectorAll(':scope > section').forEach((sec) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%' } })
    titleIn(tl, q('.us-title', sec))
    const items = sec.querySelectorAll('.us-about > p, .us-tm-card, .us-tm-sup')
    if (items.length) tl.from(items, { y: 22, autoAlpha: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, '-=0.2')
  })
})

// أدوار الفريق
const members = [
  { name: 'انس محمد الشنطي', role: 'Front-End Developer', desc: 'بناء واجهة المنصة وتجربة المستخدم وربطها بواجهات الخادم.' },
  { name: 'محمد زياد الغول', role: 'Full-Stack & Back-End Developer', desc: 'تطوير الواجهة الأمامية والخلفية معًا وإدارة قاعدة البيانات ومنطق النظام.' },
  { name: 'محمد رفعت سامي النونو', role: 'Web Developer & UI/UX Designer', desc: 'تطوير الويب وتصميم الواجهات وتجربة المستخدم وتدفّق الشاشات.' },
  { name: 'محمد هشام الهندي', role: 'Testing & QA', desc: 'اختبار النظام وضمان الجودة ومتابعة الأخطاء قبل الإصدار.' }
]
</script>
