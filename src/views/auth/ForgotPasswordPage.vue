<template>
  <div>
    <template v-if="!submitted">
      <h2 class="font-cairo font-extrabold text-[24px] text-text-900 mb-2.5">نسيت كلمة المرور؟</h2>
      <p class="text-[13px] text-text-600 leading-[1.8] mb-8">
        أدخلي بريدك الإلكتروني المسجّل في المنصة، وسنرسل لكِ رابطًا لتعيين كلمة مرور جديدة.
      </p>

      <form novalidate @submit.prevent="handleSubmit">
        <div class="mb-[22px]">
          <AuthTextField
            v-model="form.email"
            type="email"
            label="البريد الإلكتروني"
            placeholder="name@academy.edu.sa"
            autocomplete="username"
            :icon="Mail"
            :error="errors.email"
            @blur="validateEmail"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full h-[50px] rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
        >
          <LoadingSpinner v-if="isLoading" :size="17" inline class="text-white" />
          <template v-else>
            إرسال رابط إعادة تعيين كلمة المرور
            <AppIcon name="chevronStart" :size="16" :stroke-width="2.4" />
          </template>
        </button>
      </form>

      <div class="flex items-center gap-3 my-6">
        <span class="flex-1 h-px bg-border" />
        <span class="text-[11px] text-text-400">أو</span>
        <span class="flex-1 h-px bg-border" />
      </div>

      <router-link
        :to="{ name: 'login' }"
        class="flex items-center justify-center gap-2 h-icon-btn rounded-sm border border-border bg-surface text-[13px] font-bold text-text-700 hover:-translate-y-px hover:border-primary-200 hover:text-primary-700 hover:bg-primary-50 transition-all duration-fast"
      >
        <AppIcon name="chevronEnd" :size="16" />
        العودة إلى تسجيل الدخول
      </router-link>

      <p class="mt-7 text-center text-[12.5px] text-text-400">لأعضاء لجنة الإشراف والمشرفين الأكاديميين والطلاب</p>
    </template>

    <div v-else class="text-center">
      <span class="grid place-items-center w-16 h-16 rounded-pill bg-secondary-50 text-secondary-600 mx-auto mb-5">
        <AppIcon name="check" :size="28" :stroke-width="2.2" />
      </span>
      <h2 class="font-cairo font-extrabold text-[22px] text-text-900 mb-2.5">تحققي من بريدك الإلكتروني</h2>
      <p class="text-[13px] text-text-600 leading-[1.8] mb-1">أرسلنا رابط إعادة تعيين كلمة المرور إلى:</p>
      <p class="font-cairo font-bold text-[14px] text-primary-700 mb-6">{{ form.email }}</p>
      <p class="text-[12px] text-text-400 leading-[1.8] mb-7">
        لم تصلك الرسالة؟ تحققي من مجلد الرسائل غير المرغوب فيها، أو اطلبي إرسال الرابط مجددًا.
      </p>

      <router-link
        :to="{ name: 'reset-password', query: { token: 'demo' } }"
        class="w-full h-[50px] rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast flex items-center justify-center gap-2.5 mb-3"
      >
        فتح رابط إعادة تعيين كلمة المرور
        <AppIcon name="chevronStart" :size="16" :stroke-width="2.4" />
      </router-link>

      <button
        type="button"
        :disabled="isLoading"
        class="w-full h-icon-btn rounded-sm border border-border bg-surface text-[13px] font-bold text-text-700 hover:-translate-y-px hover:border-primary-200 hover:text-primary-700 hover:bg-primary-50 transition-all duration-fast disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 mb-6"
        @click="handleSubmit"
      >
        <LoadingSpinner v-if="isLoading" :size="15" inline />
        <template v-else>إعادة إرسال الرابط</template>
      </button>

      <router-link
        :to="{ name: 'login' }"
        class="text-[12.5px] font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-fast"
      >
        العودة إلى تسجيل الدخول
      </router-link>
    </div>
  </div>
</template>

<script>
import { Mail } from 'lucide-vue-next'
import { required, email as emailRule } from '@/utils/validators'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'ForgotPasswordPage',

  components: { AuthTextField, LoadingSpinner, AppIcon },

  data() {
    return {
      Mail,
      form: { email: '' },
      errors: { email: '' },
      isLoading: false,
      submitted: false
    }
  },

  methods: {
    validateEmail() {
      this.errors.email = required(this.form.email, 'البريد الإلكتروني') || emailRule(this.form.email)
      return !this.errors.email
    },

    // فجوة باك إند: لا يوجد endpoint لإرسال رابط استعادة عبر البريد — محاكاة الإرسال ثم توجيه المستخدم لصفحة تعيين كلمة المرور
    handleSubmit() {
      if (!this.validateEmail()) return

      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
        this.submitted = true
      }, 900)
    }
  }
}
</script>
