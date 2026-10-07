<template>
  <section class="relative overflow-hidden py-14 sm:py-20 bg-gradient-to-br from-ucas-green via-ucas-teal to-ucas-blue">
    <div class="relative max-w-content mx-auto px-6">
      <div class="reveal text-center max-w-[640px] mx-auto mb-11">
        <span class="inline-block px-4 py-1.5 rounded-pill bg-white/15 text-white text-label font-bold mb-3.5">
          ميزات المنصة
        </span>
        <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-white">ما يميّز مسار</h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <article
          v-for="(role, index) in roles"
          :key="role.title"
          class="reveal text-center"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <span class="grid place-items-center w-[58px] h-[58px] rounded-pill bg-white/15 text-white mx-auto mb-[18px]">
            <AppIcon :name="role.icon" :size="24" />
          </span>

          <h3 class="font-cairo font-extrabold text-h3 mb-3.5 text-white">
            {{ role.title }}
          </h3>

          <ul class="flex flex-col gap-2 items-center">
            <li
              v-for="feature in role.features"
              :key="feature"
              class="text-body-sm text-white/85"
            >
              {{ feature }}
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

/* محتوى تسويقي ثابت — ليس بيانات أعمال، لا يُجلب من الـ API */
const roles = [
  {
    title: 'لجنة الإشراف',
    icon: 'shield',
    highlight: false,
    features: [
      'إدارة الفصول والتسجيلات',
      'استيراد/تصدير Excel',
      'أرشيف المشاريع الكامل',
      'إدارة مواعيد المناقشات',
      'الموافقة على المشرف',
      'تحكم كامل بالصلاحيات'
    ]
  },
  {
    title: 'للمشرف',
    icon: 'checkSquare',
    highlight: true,
    features: [
      'متابعة كل فريق تحت إشرافك',
      'الموافقة على المقترحات والتقارير',
      'إنشاء اجتماعات Meet بعد اختيار الطلاب للموعد',
      'لوحة إحصائيات المشاريع'
    ]
  },
  {
    title: 'للطالب',
    icon: 'user',
    highlight: false,
    features: [
      'ملف شخصي وفريق متكامل',
      'تسليم المقترح والتقرير النهائي',
      'لوحة Kanban لرفع المهام',
      'مساعد ذكي للدردشة',
      'طلب موعد الاجتماعات على Meet'
    ]
  }
]
</script>
