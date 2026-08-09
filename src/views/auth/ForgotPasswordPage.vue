<template>
  <div class="text-center">
    <span class="grid place-items-center w-16 h-16 rounded-pill bg-primary-50 text-primary-600 mx-auto mb-5">
      <AppIcon name="shield" :size="28" :stroke-width="2.2" />
    </span>

    <h2 class="font-cairo font-extrabold text-[22px] text-text-900 mb-2.5">نسيت كلمة المرور؟</h2>
    <p class="text-[13px] text-text-600 leading-[1.8] mb-7">
      لا تتوفر استعادة ذاتية لكلمة المرور بهذه المنصة حاليًا — كلمات المرور تُدار حصرًا
      عبر رابط دعوة لمرة واحدة ترسله لجنة الإشراف. تواصلي مع لجنة الإشراف لإرسال رابط دعوة جديد.
    </p>

    <a
      :href="`mailto:${contactEmail}?subject=${encodeURIComponent('طلب رابط دعوة جديد')}`"
      class="flex items-center justify-center gap-2.5 h-[50px] w-full px-6 rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast mb-4"
    >
      <AppIcon name="mail" :size="16" />
      مراسلة لجنة الإشراف
    </a>

    <router-link
      :to="{ name: 'login' }"
      class="inline-flex items-center gap-2 text-[12.5px] font-bold text-text-600 hover:text-primary-700 transition-colors duration-fast"
    >
      <AppIcon name="chevronEnd" :size="15" :stroke-width="2.4" />
      العودة إلى تسجيل الدخول
    </router-link>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import { CONTACT } from '@/utils/constants'

export default {
  name: 'ForgotPasswordPage',

  components: { AppIcon },

  data() {
    return { contactEmail: CONTACT.EMAIL }
  }
}
</script>
