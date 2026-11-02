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
            <ul v-if="m.links && m.links.length" class="us-tm-links">
              <li v-for="l in m.links" :key="l.url">
                <a
                  class="us-tm-link"
                  :href="l.url"
                  :title="l.label"
                  :aria-label="l.label"
                  :target="l.type === 'email' ? undefined : '_blank'"
                  :rel="l.type === 'email' ? undefined : 'noopener'"
                >
                  <svg v-if="l.type === 'github'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" /></svg>
                  <svg v-else-if="l.type === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>
                </a>
              </li>
            </ul>
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

// أدوار الفريق — مع روابط الحسابات (تظهر أيقونات أسفل كل بطاقة)
const members = [
  {
    name: 'انس محمد الشنطي', role: 'Front-End Developer', desc: 'بناء واجهة المنصة وتجربة المستخدم وربطها بواجهات الخادم.',
    links: [{ type: 'mostaql', url: 'https://mostaql.com/u/anas9929', label: 'مستقل — انس الشنطي' }]
  },
  {
    name: 'محمد زياد الغول', role: 'Full-Stack & Back-End Developer', desc: 'تطوير الواجهة الأمامية والخلفية معًا وإدارة قاعدة البيانات ومنطق النظام.',
    links: [
      { type: 'github', url: 'https://github.com/iMumd', label: 'GitHub — محمد الغول' },
      { type: 'email', url: 'mailto:hi@mumd.dev', label: 'البريد الإلكتروني — hi@mumd.dev' }
    ]
  },
  {
    name: 'محمد رفعت سامي النونو', role: 'Web Developer & UI/UX Designer', desc: 'تطوير الويب وتصميم الواجهات وتجربة المستخدم وتدفّق الشاشات.',
    links: [{ type: 'mostaql', url: 'https://mostaql.com/u/M_Refaat_21', label: 'مستقل — محمد النونو' }]
  },
  {
    name: 'محمد هشام الهندي', role: 'Testing & QA', desc: 'اختبار النظام وضمان الجودة ومتابعة الأخطاء قبل الإصدار.',
    links: [{ type: 'github', url: 'https://github.com/Mohammed-Hindi', label: 'GitHub — محمد الهندي' }]
  }
]
</script>
