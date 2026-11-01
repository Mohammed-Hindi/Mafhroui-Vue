<template>
  <!-- من نحن بنمط موقع الكلية: شريط عنوان متدرّج، ثم فقرات منظّمة في عمود قراءة مريح —
       تعريف المنصة (الرؤية/الرسالة)، قصة النشأة سردًا، التحديات وحلولها، كيف تساعد كل طرف، ثم الفريق والمشرف.
       الحركة هادئة (fade-up) بلا رسم: العنوان وكل فقرة تظهر بهدوء عند الوصول إليها -->
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
        <div class="us-about">
          <p class="us-lead">
            منصة {{ APP_NAME }} نظام إلكتروني موحّد يدير دورة حياة مشروع التخرج كاملة، بدءًا من توليد الأفكار واختيارها،
            مرورًا بإعداد المقترح واعتماده وتقسيم المهام والتسليمات، وصولًا إلى حجز مواعيد المناقشات وتوثيق أرشيف أكاديمي
            للمشاريع المتميزة. وتربط جميع الأطراف المعنية — العمادة ولجنة الإشراف والمشرفين والطلاب — في بيئة عمل واحدة
            بدل الأساليب الورقية والأدوات المتفرّقة.
          </p>
          <div class="us-about-pair">
            <div class="us-about-block">
              <h3>الرؤية</h3>
              <p>
                الريادة في تحويل إدارة مشاريع التخرج الأكاديمية نحو بيئة رقمية ذكية وشاملة، تعزّز جودة المخرجات التقنية،
                وتلغي العوائق الإدارية والتنظيمية أمام الطلبة والأكاديميين.
              </p>
            </div>
            <div class="us-about-block">
              <h3>الرسالة</h3>
              <p>
                توفير منصة إلكترونية موحّدة وموثوقة تدير كافة مراحل مشروع التخرج بكفاءة عالية، عبر أدوات تفاعلية لإدارة المهام
                والتواصل الفعّال والاعتمادات الرسمية، بما يحفظ حقوق الطلبة وأعمالهم ويسهّل متابعة الإشراف الأكاديمي والتقييم المؤسسي.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="us-section is-gray">
      <div class="us-wrap">
        <h2 class="us-title">قصة {{ APP_NAME }}</h2>
        <div class="us-about">
          <p v-for="(para, i) in storyText" :key="i">{{ para }}</p>
        </div>
      </div>
    </section>

    <section class="us-section">
      <div class="us-wrap">
        <h2 class="us-title">تحدّيات يعالجها {{ APP_NAME }}</h2>
        <div class="us-about">
          <p class="us-lead">
            يواجه طلبة مشاريع التخرج مجموعةً من العقبات المتكرّرة في كل فصل دراسي، صُمّمت المنصة لمعالجة كلٍّ منها بأداة واضحة:
          </p>
          <div v-for="p in problems" :key="p.title" class="us-about-item">
            <h3>{{ p.title }}</h3>
            <p>{{ p.problem }}</p>
            <p class="us-about-sol">
              <CheckCircle2 :size="18" /><span><b>الحل في {{ APP_NAME }}:</b> {{ p.solution }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="us-section us-feature-band">
      <div class="us-wrap">
        <h2 class="us-title">كيف تساعد المنصة كل طرف</h2>
        <div class="us-about-roles">
          <div v-for="r in roles" :key="r.title" class="us-about-role">
            <h3><component :is="r.icon" :size="22" :stroke-width="1.6" /> {{ r.title }}</h3>
            <p>{{ r.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="us-section is-gray">
      <div class="us-wrap">
        <h2 class="us-title">فريق التطوير</h2>
        <div class="us-about">
          <p class="us-lead">
            طُوّرت منصة {{ APP_NAME }} على يد فريق من طلاب دبلوم تصميم وتطوير مواقع الويب في الكلية الجامعية للعلوم التطبيقية،
            جمعهم مشروع التخرّج فحوّلوا فكرته إلى منصّة متكاملة تخدم كل أطراف العملية الأكاديمية.
          </p>
        </div>
        <ul class="us-team">
          <li v-for="n in team" :key="n" class="us-team-member">
            <span class="us-team-av" aria-hidden="true">{{ n.charAt(0) }}</span>
            <strong class="us-team-name">{{ n }}</strong>
          </li>
        </ul>
        <p class="us-team-sup">بإشراف المشرف القدير المميّز <strong>م. محمود ظهير</strong></p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Building2, CheckCircle2, UserCheck, Users, UsersRound } from 'lucide-vue-next'
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
    const items = sec.querySelectorAll('.us-about > p, .us-about-block, .us-about-item, .us-about-role, .us-team-member, .us-team-sup')
    if (items.length) tl.from(items, { y: 22, autoAlpha: 0, duration: 0.55, ease: 'power2.out', stagger: 0.1 }, '-=0.2')
  })
})

const team = ['انس محمد الشنطي', 'محمد زياد الغول', 'محمد رفعت النونو', 'محمد هشام الهندي']

// قصة النشأة سردًا متصلًا بدل خطوات مرقّمة
const storyText = [
  `بدأت ${APP_NAME} فكرةَ مشروع تخرّج لمجموعة من طلاب دبلوم تصميم وتطوير مواقع الويب في الكلية الجامعية للعلوم التطبيقية، انطلاقًا من مشكلات إدارة مشاريع التخرج التي عاشوها بأنفسهم ولمسوا أثرها على زملائهم.`,
  `تطوّرت الفكرة إلى نظام متكامل يغطّي دورة حياة مشروع التخرج كاملة بأربعة أدوار وصلاحيات دقيقة ولوحة تحكّم لكل طرف، تنظّم العمل من توليد الفكرة واعتماد المقترح وإدارة المهام والاجتماعات حتى جدولة المناقشة وأرشفة المشروع.`,
  `واعتُمدت منصة ${APP_NAME} أحد المواقع التابعة للكلية الجامعية للعلوم التطبيقية — عمادة تكنولوجيا المعلومات.`
]

const problems = [
  { title: 'صعوبة اختيار الفكرة', problem: 'يستغرق الطلبة وقتًا طويلًا في بداية الفصل للوصول إلى أفكار ذات قيمة تطبيقية ومجتمعية.', solution: 'مساعد ذكي يقترح أفكارًا حسب التخصص، ويتحقّق من تشابه الفكرة مع المشاريع السابقة قبل التقديم.' },
  { title: 'تشتّت الملفات والتواصل العشوائي', problem: 'الاعتماد على تطبيقات محادثة متفرّقة وتسليمات يدوية يؤدّي إلى فقدان النسخ النهائية وتداخل الإصدارات.', solution: 'رفع الملفات مرتبط بكل مهمة ومرحلة، مع تسجيل آخر نسخة وتاريخها واسم رافعها.' },
  { title: 'تأخّر إجراءات الاعتماد', problem: 'بطء تبادل ملفات المقترحات بين المشرفين ولجنة الإشراف، وضياع التغذية الراجعة، وتأخّر تحديد مواعيد المناقشة.', solution: 'مسار اعتماد إلكتروني للمقترحات بقرار وسبب واضح، وجدولة موحّدة للمناقشات مع إشعارات فورية.' },
  { title: 'صعوبة قياس التقدّم', problem: 'غياب مؤشرات واضحة تمكّن المشرف والعمادة من معرفة نسبة الإنجاز الفعلية لكل فريق.', solution: 'لوحات مهام (Kanban) تحتسب نسبة تقدّم المشروع تلقائيًا وتظهر لجميع الأطراف المعنية.' }
]

// كيف تساعد المنصة كل طرف — فقرة موجزة لكل دور
const roles = [
  { icon: Building2, title: 'العمادة', text: 'مصدر بيانات موحّد وتقارير دقيقة، مع إدارة الفصول والأقسام والمستخدمين، وأرشيف إلكتروني للمشاريع المنجزة.' },
  { icon: UsersRound, title: 'لجنة الإشراف', text: 'مراجعة المقترحات واعتمادها، وجدولة مواعيد المناقشات ونشرها، ومتابعة تقدّم المجموعات وتمييز المشاريع المتميّزة وترتيبها.' },
  { icon: UserCheck, title: 'المشرفون', text: 'متابعة المجموعات ومهامها لحظة بلحظة، وإرسال المهام والإعلانات والملفات، وإدارة الاجتماعات والتقييم واعتماد التقارير.' },
  { icon: Users, title: 'الطلاب', text: 'تقديم المقترح ومتابعة حالته، ولوحة مهام الفريق والتسليمات، والاجتماعات والإعلانات ومعرفة موعد المناقشة.' }
]
</script>
