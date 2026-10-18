<template>
  <!-- من نحن بنمط موقع الكلية: شريط عنوان متدرّج، تعريف المنصة (الرؤية/الرسالة)، قصة النشأة، المشكلات وحلولها،
       شريط "كيف تساعد المنصة" بالتدرج لكل طرف، ثم فريق التطوير والمشرف. المحتوى من ملف "مسار - مشروع تخرج" 
       الحركة (GSAP): رأس الصفحة يدخل عند الفتح، وكل قسم يتحرك عند الوصول إليه — العناوين كلمة كلمة، البطاقات
       تصعد أو تدخل من الجانبين، الأيقونات تُرسم، خط القصة يمتد مع التمرير، وشريط المشرف ينكشف بمسح ضوئي -->
  <div ref="root">
    <header class="us-pagehead">
      <div class="us-wrap">
        <h1>من نحن</h1>
        <p>منصة {{ APP_NAME }} — {{ APP_DESCRIPTION }} في الكلية الجامعية للعلوم التطبيقية</p>
        <nav class="us-crumbs" aria-label="مسار التنقل">
          <router-link :to="{ name: 'landing' }">الرئيسية</router-link><span>/</span><span>من نحن</span>
        </nav>
      </div>
    </header>

    <section class="us-section">
      <div class="us-wrap">
        <h2 class="us-title">تعريف المنصة</h2>
        <p class="us-lead">
          منصة {{ APP_NAME }} نظام إلكتروني موحّد يدير دورة حياة مشروع التخرج كاملة، بدءًا من توليد الأفكار واختيارها،
          مرورًا بإعداد المقترح واعتماده وتقسيم المهام والتسليمات، وصولًا إلى حجز مواعيد المناقشات وتوثيق أرشيف أكاديمي
          للمشاريع المتميزة. تربط المنصة جميع الأطراف المعنية — العمادة ولجنة الإشراف والمشرفين والطلاب — في بيئة عمل واحدة
          بدل الأساليب الورقية والأدوات المتفرقة.
        </p>
        <div class="us-grid-2">
          <article class="us-card">
            <h3>الرؤية</h3>
            <p class="us-card-text">
              الريادة في تحويل إدارة مشاريع التخرج الأكاديمية نحو بيئة رقمية ذكية وشاملة، تعزز جودة المخرجات التقنية،
              وتلغي العوائق الإدارية والتنظيمية أمام الطلبة والأكاديميين.
            </p>
          </article>
          <article class="us-card">
            <h3>الرسالة</h3>
            <p class="us-card-text">
              توفير منصة إلكترونية موحّدة وموثوقة تدير كافة مراحل مشروع التخرج بكفاءة عالية، عبر أدوات تفاعلية لإدارة المهام
              والتواصل الفعّال والاعتمادات الرسمية، بما يحفظ حقوق وأعمال الطلبة ويسهّل متابعة الإشراف الأكاديمي والتقييم المؤسسي.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="us-section is-gray">
      <div class="us-wrap">
        <h2 class="us-title">قصة {{ APP_NAME }}</h2>
        <div class="us-steps-wrap is-3">
        <span class="us-steps-line" aria-hidden="true" />
        <ol class="us-steps is-3">
          <li v-for="s in story" :key="s.title" class="us-step">
            <span class="us-step-ic" :style="{ color: s.color }"><component :is="s.icon" :size="36" :stroke-width="1.6" /></span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
          </li>
        </ol>
        </div>
      </div>
    </section>

    <section class="us-section">
      <div class="us-wrap">
        <h2 class="us-title">المشكلات التي يعاني منها الطلاب</h2>
        <div class="us-grid-2">
          <article v-for="p in problems" :key="p.title" class="us-card us-problem">
            <h3>{{ p.title }}</h3>
            <p class="us-card-text">{{ p.problem }}</p>
            <p class="us-solution"><CheckCircle2 :size="20" /><span><b>الحل في {{ APP_NAME }}:</b> {{ p.solution }}</span></p>
          </article>
        </div>
      </div>
    </section>

    <section class="us-section us-feature-band">
      <div class="us-wrap">
        <h2 class="us-title">كيف تساعد المنصة</h2>
        <div class="us-features is-4">
          <div v-for="r in roles" :key="r.title" class="us-feature">
            <component :is="r.icon" :size="56" :stroke-width="1.4" />
            <h3>{{ r.title }}</h3>
            <ul><li v-for="t in r.items" :key="t">{{ t }}</li></ul>
          </div>
        </div>
      </div>
    </section>

    <section class="us-section is-gray">
      <div class="us-wrap">
        <h2 class="us-title">فريق التطوير</h2>
        <div class="us-devteam">
          <div v-for="n in team" :key="n" class="us-person">
            <span class="us-person-av">{{ n.charAt(0) }}</span>
            <strong>{{ n }}</strong>
            <small>طالب — تصميم وتطوير مواقع الويب</small>
          </div>
        </div>
        <div class="us-supervisor">
          <GraduationCap :size="40" :stroke-width="1.5" />
          <div>
            <small>تحت إشراف المشرف القدير المميز</small>
            <strong>م. محمود ظهير</strong>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Award, BadgeCheck, Building2, CheckCircle2, GraduationCap, Rocket, UserCheck, Users, UsersRound } from 'lucide-vue-next'
import { APP_NAME, APP_DESCRIPTION } from '@/utils/constants'
import { ref } from 'vue'
import { gsap, iconParts, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
useScrollMotion(root, (el) => {
  const q = (s, scope = el) => scope.querySelector(s)
  const qa = (s, scope = el) => scope.querySelectorAll(s)
  const onEnter = (trigger, start = 'top 72%') => gsap.timeline({ scrollTrigger: { trigger, start } })
  const [intro, story, problems, band, team] = qa(':scope > section')

  // رأس الصفحة عند الفتح
  gsap.timeline({ delay: 0.1 })
    .from(q('.us-pagehead h1'), { y: 30, autoAlpha: 0, duration: 0.8, ease: 'power3.out' })
    .from(q('.us-pagehead p'), { y: 16, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, '-=0.45')
    .from(q('.us-crumbs'), { y: 12, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')

  // تعريف المنصة: الفقرة تتضح، ثم الرؤية والرسالة من الجانبين
  titleIn(onEnter(intro), q('.us-title', intro))
    .from(q('.us-lead', intro), { y: 24, autoAlpha: 0, filter: 'blur(6px)', duration: 0.9, ease: 'power3.out' }, '-=0.5')
    .from(qa('.us-card', intro), { x: (i) => (i ? -70 : 70), autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, '-=0.5')

  // قصة مسار: خط يمتد مع التمرير، الخطوات تتوالى وأيقوناتها تُرسم
  titleIn(onEnter(story), q('.us-title', story))
  gsap.fromTo(q('.us-steps-line', story), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: q('.us-steps', story), start: 'top 78%', end: 'bottom 60%', scrub: 0.6 } })
  const steps = onEnter(q('.us-steps', story), 'top 80%')
  qa('.us-step', story).forEach((s, i) => {
    steps.from(s, { y: 36, autoAlpha: 0, duration: 0.7, ease: 'power3.out' }, i * 0.2)
      .from(iconParts(s), { drawSVG: 0, duration: 1, ease: 'power2.inOut' }, i * 0.2 + 0.15)
  })

  // المشكلات: كل بطاقة تنكشف من الأعلى، ثم صندوق الحل يمتد من اليمين
  titleIn(onEnter(problems), q('.us-title', problems))
  qa('.us-problem', problems).forEach((card, i) => {
    onEnter(card, 'top 85%')
      .from(card, { y: 40, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power3.out', delay: (i % 2) * 0.12 })
      .from(q('.us-solution', card), { clipPath: 'inset(0 0 0 100%)', duration: 0.8, ease: 'power2.inOut' }, '-=0.3')
      .from(iconParts(q('.us-solution', card)), { drawSVG: 0, duration: 0.6 }, '-=0.3')
  })

  // كيف تساعد المنصة: البطاقات تتضح وأيقوناتها تُرسم ثم البنود
  titleIn(onEnter(band), q('.us-title', band))
    .from(qa('.us-feature', band), { y: 46, autoAlpha: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power3.out', stagger: 0.12 }, '-=0.6')
    .from(iconParts(band), { drawSVG: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.03 }, '<0.1')
    .from(qa('.us-feature li', band), { x: 24, autoAlpha: 0, duration: 0.45, stagger: 0.04 }, '<0.4')

  // فريق التطوير: البطاقات تصعد، الحرف الأول يظهر داخل دائرته، ثم شريط المشرف ينكشف بمسح ولمعة
  titleIn(onEnter(team), q('.us-title', team))
    .from(qa('.us-person', team), { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12 }, '-=0.5')
    .from(qa('.us-person-av', team), { autoAlpha: 0, scale: 0.6, duration: 0.6, ease: 'power2.out', stagger: 0.12 }, '<0.2')
  onEnter(q('.us-supervisor', team), 'top 88%')
    .from(q('.us-supervisor', team), { clipPath: 'inset(0 0 0 100%)', duration: 1, ease: 'power3.inOut' })
    .from(qa('.us-supervisor small, .us-supervisor strong', team), { y: 14, autoAlpha: 0, duration: 0.5, stagger: 0.12 }, '-=0.3')
    .from(iconParts(q('.us-supervisor', team)), { drawSVG: 0, duration: 0.8 }, '<')
})

const team = ['انس محمد الشنطي', 'محمد زياد الغول', 'محمد رفعت النونو', 'محمد هشام الهندي']

const story = [
  { icon: Rocket, color: '#62BB46', title: 'فكرة مشروع تخرج', text: `بدأت ${APP_NAME} مشروعَ تخرج لطلاب دبلوم تصميم وتطوير مواقع الويب، لحل مشكلات إدارة مشاريع التخرج التي عاشوها بأنفسهم.` },
  { icon: Award, color: '#0E699C', title: 'نظام متكامل', text: 'تحوّل المشروع إلى نظام يغطي دورة حياة مشروع التخرج كاملة بأربعة أدوار وصلاحيات دقيقة ولوحات تحكم لكل طرف.' },
  { icon: BadgeCheck, color: '#005BAA', title: 'اعتماد رسمي', text: `اعتُمدت منصة ${APP_NAME} أحد المواقع التابعة للكلية الجامعية للعلوم التطبيقية — عمادة تكنولوجيا المعلومات.` }
]

const problems = [
  { title: 'صعوبة اختيار الفكرة', problem: 'يستغرق الطلبة وقتًا طويلًا في بداية الفصل للوصول إلى أفكار ذات قيمة تطبيقية ومجتمعية.', solution: 'مساعد ذكي يقترح أفكارًا حسب التخصص، ويتحقق من تشابه الفكرة مع المشاريع السابقة قبل التقديم.' },
  { title: 'تشتت الملفات والتواصل العشوائي', problem: 'الاعتماد على تطبيقات محادثة متفرقة وتسليمات يدوية يؤدي إلى فقدان النسخ النهائية وتداخل الإصدارات.', solution: 'رفع الملفات مرتبط بكل مهمة ومرحلة، مع تسجيل آخر نسخة وتاريخها واسم رافعها.' },
  { title: 'تأخر إجراءات الاعتماد', problem: 'بطء تبادل ملفات المقترحات بين المشرفين ولجنة الإشراف وضياع التغذية الراجعة وتأخر تحديد مواعيد المناقشة.', solution: 'مسار اعتماد إلكتروني للمقترحات بقرار وسبب واضح، وجدولة موحّدة للمناقشات مع إشعارات فورية.' },
  { title: 'صعوبة قياس التقدم', problem: 'غياب مؤشرات واضحة تمكّن المشرف والعمادة من معرفة نسبة الإنجاز الفعلية لكل فريق.', solution: 'لوحات مهام (Kanban) تحتسب نسبة تقدم المشروع تلقائيًا وتظهر لجميع الأطراف المعنية.' }
]

const roles = [
  { icon: Building2, title: 'العمادة', items: ['مصدر بيانات موحّد وتقارير دقيقة', 'إدارة الفصول والأقسام والمستخدمين', 'أرشيف إلكتروني للمشاريع المنجزة'] },
  { icon: UsersRound, title: 'لجنة الإشراف', items: ['مراجعة المقترحات واعتمادها', 'جدولة مواعيد المناقشات ونشرها', 'متابعة تقدم المجموعات وتمييز أفضل المشاريع'] },
  { icon: UserCheck, title: 'المشرفون', items: ['متابعة المجموعات ومهامها لحظة بلحظة', 'إرسال المهام والإعلانات والملفات', 'الاجتماعات والتقييم واعتماد التقارير'] },
  { icon: Users, title: 'الطلاب', items: ['تقديم المقترح ومتابعة حالته', 'لوحة مهام الفريق والتسليمات', 'الاجتماعات والإعلانات وموعد المناقشة'] }
]
</script>
