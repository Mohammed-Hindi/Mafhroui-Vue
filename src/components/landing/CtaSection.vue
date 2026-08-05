<template>
  <section class="relative overflow-hidden py-14 sm:py-20 text-center">
    <span aria-hidden="true" data-parallax="0.08" class="animate-blob pointer-events-none absolute rounded-pill w-[300px] h-[300px] bg-primary-500/[0.05] -top-16 -start-24" style="animation-delay:2s" />
    <span aria-hidden="true" data-parallax="-0.1" class="animate-blob pointer-events-none absolute rounded-pill w-[240px] h-[240px] bg-accent-500/[0.05] bottom-0 -end-20" style="animation-delay:4s" />
    <div class="relative max-w-content mx-auto px-6">
      <div
        class="reveal relative overflow-hidden px-6 py-14 rounded-[28px] bg-gradient-to-bl from-primary-50 to-accent-50 border border-primary-100"
      >
        <h2 class="font-cairo font-extrabold text-[24px] sm:text-[26px] text-text-900 mb-3">
          جاهز لانطلاق رحلة تخرجك؟
        </h2>
        <p class="text-[13.5px] text-text-600 mb-7">
          انضم الآن إلى {{ APP_NAME }} وابدأ إدارة مشروع تخرجك باحترافية
        </p>

        <div class="flex flex-wrap gap-3.5 justify-center">
          <router-link
            v-magnetic
            :to="{ name: 'login' }"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14.5px] shadow-[0_12px_26px_-10px_rgba(37,99,235,.55)] transition-shadow duration-fast"
          >
            تسجيل الدخول
          </router-link>

          <a
            v-magnetic
            :href="`mailto:${EMAIL}`"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-surface border border-border text-text-900 font-cairo font-bold text-[14.5px] hover:border-primary-200 hover:text-primary-700 transition-colors duration-fast"
          >
            <AppIcon name="mail" :size="16" />
            تواصل معنا
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'
import { CONTACT, APP_NAME } from '@/utils/constants'

// استخدام القيمة المباشرة مع fallback أمان
const EMAIL = CONTACT?.EMAIL || 'academy@ucas.edu.ps'
</script>