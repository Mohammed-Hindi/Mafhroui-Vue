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
import { gsap, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

const root = ref(null)
// دخول هادئ رسمي بلا رسم: رأس الصفحة عند الفتح، وكل قسم يظهر بهدوء (fade-up) عند الوصول إليه
useScrollMotion(root, (el) => {
  const q = (s, scope = el) => scope.querySelector(s)

  gsap.timeline({ delay: 0.1 })
    .from(q('.us-pagehead h1'), { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power2.out' })
    .from(q('.us-pagehead p'), { y: 14, autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    .from(q('.us-crumbs'), { autoAlpha: 0, duration: 0.4 }, '-=0.25')

  el.querySelectorAll(':scope > section').forEach((sec) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%' } })
    titleIn(tl, q('.us-title', sec))
    const lead = q('.us-lead', sec)
    if (lead) tl.from(lead, { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, '-=0.25')
    const items = sec.querySelectorAll('.us-card, .us-step, .us-feature, .us-person, .us-supervisor')
    if (items.length) tl.from(items, { y: 24, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1 }, '-=0.2')
  })
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
  { icon: UsersRound, title: 'لجنة الإشراف', items: ['مراجعة المقترحات واعتمادها', 'جدولة مواعيد المناقشات ونشرها', 'متابعة تقدم المجموعات وتمييز المشاريع وترتيبها'] },
  { icon: UserCheck, title: 'المشرفون', items: ['متابعة المجموعات ومهامها لحظة بلحظة', 'إرسال المهام والإعلانات والملفات', 'الاجتماعات والتقييم واعتماد التقارير'] },
  { icon: Users, title: 'الطلاب', items: ['تقديم المقترح ومتابعة حالته', 'لوحة مهام الفريق والتسليمات', 'الاجتماعات والإعلانات وموعد المناقشة'] }
]
</script>
