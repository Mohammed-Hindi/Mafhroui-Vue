<template>
  <section class="py-14 sm:py-20 bg-surface border-y border-border-soft">
    <div class="max-w-content mx-auto px-6">
      <div class="reveal text-center max-w-[640px] mx-auto mb-11">
        <span class="inline-block px-4 py-1.5 rounded-pill bg-primary-50 text-primary-700 text-label font-bold mb-3.5">
          ميزات المنصة
        </span>
        <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900">حلول متكاملة لكل الأدوار</h2>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="(role, index) in roles"
          :key="role.title"
          :class="[
            'reveal rounded-lg border p-7 shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-base',
            role.highlight
              ? 'bg-gradient-to-b from-primary-600 to-primary-700 border-transparent text-white'
              : 'bg-surface border-border'
          ]"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <span
            :class="[
              'grid place-items-center w-[46px] h-[46px] rounded-md mb-[18px]',
              role.highlight ? 'bg-white/15 text-white' : 'bg-primary-50 text-primary-600'
            ]"
          >
            <AppIcon :name="role.icon" :size="22" />
          </span>

          <h3 :class="['font-cairo font-extrabold text-h3 mb-3.5', role.highlight ? 'text-white' : 'text-text-900']">
            {{ role.title }}
          </h3>

          <ul class="flex flex-col gap-[11px]">
            <li
              v-for="feature in role.features"
              :key="feature"
              :class="['flex items-center gap-2.5 text-body-sm', role.highlight ? 'text-white/90' : 'text-text-600']"
            >
              <AppIcon
                name="check"
                :size="14"
                :stroke-width="2.6"
                :class="['shrink-0', role.highlight ? 'text-white' : 'text-secondary-600']"
              />
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
