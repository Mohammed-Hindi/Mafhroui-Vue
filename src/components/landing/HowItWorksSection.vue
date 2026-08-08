<template>
  <section class="relative overflow-hidden py-14 sm:py-20">
    <span aria-hidden="true" data-parallax="-0.08" class="animate-blob pointer-events-none absolute rounded-pill w-[240px] h-[240px] bg-secondary-500/[0.06] top-1/3 -end-20" style="animation-delay:1.5s" />
    <div class="relative max-w-content mx-auto px-6">
      <div class="reveal text-center max-w-[640px] mx-auto mb-11">
        <span class="inline-block px-4 py-1.5 rounded-pill bg-primary-50 text-primary-700 text-label font-bold mb-3.5">
          كيف يعمل النظام
        </span>
        <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900">خطوات بسيطة، نتائج احترافية</h2>
      </div>

      <ol class="flex flex-col gap-3.5 max-w-[640px] mx-auto">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="reveal flex items-center gap-[18px] px-[22px] py-[18px] rounded-md bg-surface border border-border shadow-card hover:translate-x-1 hover:shadow-card-hover transition-all duration-base"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <span class="grid place-items-center w-[26px] h-[26px] rounded-pill bg-primary-50 text-primary-600 font-cairo font-extrabold text-caption shrink-0">
            {{ index + 1 }}
          </span>

          <div class="flex-1 min-w-0">
            <h3 class="font-cairo font-extrabold text-h4 text-text-900 mb-0.5">{{ step.title }}</h3>
            <p class="text-caption text-text-600">{{ step.description }}</p>
          </div>

          <span class="grid place-items-center w-10 h-10 rounded-md bg-gradient-to-bl from-primary-600 to-accent-500 text-white shrink-0">
            <AppIcon :name="step.icon" :size="18" :stroke-width="2.2" />
          </span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'

const steps = [
  {
    title: 'التسجيل والدخول',
    description: 'الأدمن ينشئ الحسابات ويرسل بيانات الدخول بالبريد والواتساب',
    icon: 'zap'
  },
  {
    title: 'تعيين الفرق والمشرفين',
    description: 'لجنة الإشراف تنسّق الفرق وتربط كل فريق بمشرف',
    icon: 'rows'
  },
  {
    title: 'تسليم المقترح',
    description: 'قائد الفريق يرسل المقترح باعتماد المشرف واللجنة',
    icon: 'book'
  },
  {
    title: 'متابعة المهام والاجتماعات',
    description: 'لوح Kanban واجتماعات Meet مع تذكيرات آلية',
    icon: 'calendar'
  },
  {
    title: 'المناقشة والأرشفة',
    description: 'حجز موعد المناقشة وأرشفة المشروع بعد اعتماده',
    icon: 'shieldSlim'
  }
]
</script>
