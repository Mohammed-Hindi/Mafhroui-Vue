<template>
  <section class="py-14 sm:py-20 text-center">
    <div class="max-w-content mx-auto px-6">
      <div
        class="reveal px-6 py-14 rounded-[28px] bg-gradient-to-bl from-primary-50 to-accent-50 border border-primary-100"
      >
        <h2 class="font-cairo font-extrabold text-[24px] sm:text-[26px] text-text-900 mb-3">
          جاهز لانطلاق رحلة تخرجك؟
        </h2>
        <p class="text-[13.5px] text-text-600 mb-7">
          انضم الآن إلى {{ APP_NAME }} وابدأ إدارة مشروع تخرجك باحترافية
        </p>

        <div class="flex flex-wrap gap-3.5 justify-center">
          <router-link
            :to="{ name: 'login' }"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14.5px] shadow-[0_12px_26px_-10px_rgba(37,99,235,.55)] hover:-translate-y-0.5 transition-transform duration-fast"
          >
            تسجيل الدخول
          </router-link>

          <a
            :href="`mailto:${EMAIL}`"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-surface border border-border text-text-900 font-cairo font-bold text-[14.5px] hover:-translate-y-0.5 hover:border-primary-200 hover:text-primary-700 transition-all duration-fast"
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