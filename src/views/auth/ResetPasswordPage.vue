<template>
  <div>
    <template v-if="!submitted">
      <h2 class="font-cairo font-extrabold text-[24px] text-text-900 mb-8">تعيين كلمة مرور جديدة</h2>

      <form novalidate @submit.prevent="handleSubmit">
        <div class="mb-[10px]">
          <AuthPasswordField
            v-model="form.password"
            label="كلمة المرور الجديدة"
            autocomplete="new-password"
            :error="errors.password"
            @blur="validatePassword"
          />
          <PasswordStrengthMeter :password="form.password" />
        </div>

        <div class="mb-[18px] mt-[18px]">
          <AuthPasswordField
            v-model="form.password_confirmation"
            label="تأكيد كلمة المرور"
            autocomplete="new-password"
            :error="errors.password_confirmation"
            @blur="validateConfirmation"
          />
        </div>

        <p v-if="authError" class="mb-4 flex items-center gap-2 text-[12.5px] font-semibold text-error">
          <AppIcon name="alertCircle" :size="15" />
          {{ authError }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full h-[50px] rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
        >
          <LoadingSpinner v-if="isLoading" :size="17" inline class="text-white" />
          <template v-else>
            حفظ كلمة المرور الجديدة
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
        :to="{ name: 'landing' }"
        class="flex items-center justify-center gap-2 h-icon-btn rounded-sm border border-border bg-surface text-[13px] font-bold text-text-700 hover:-translate-y-px hover:border-primary-200 hover:text-primary-700 hover:bg-primary-50 transition-all duration-fast"
      >
        <AppIcon name="home" :size="16" />
        العودة إلى الصفحة الرئيسية
      </router-link>

      <p class="mt-7 text-center text-[12.5px] text-text-400">لأعضاء لجنة الإشراف والمشرفين الأكاديميين والطلاب</p>
    </template>

    <!-- نجاح التحديث -->
    <div v-else class="text-center">
      <span class="grid place-items-center w-16 h-16 rounded-pill bg-secondary-50 text-secondary-600 mx-auto mb-5">
        <AppIcon name="check" :size="28" :stroke-width="2.6" />
      </span>
      <h2 class="font-cairo font-extrabold text-[20px] text-text-900 mb-2.5">تم تحديث كلمة المرور</h2>
      <p class="text-[13px] text-text-600 leading-[1.8] mb-7">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>

      <router-link
        :to="{ name: 'login' }"
        class="inline-flex items-center justify-center gap-2.5 h-[50px] w-full px-6 rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast"
      >
        تسجيل الدخول
        <AppIcon name="chevronStart" :size="16" :stroke-width="2.4" />
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { required, strongPassword, matches } from '@/utils/validators'
import AuthPasswordField from '@/components/auth/AuthPasswordField.vue'
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'ResetPasswordPage',

  components: { AuthPasswordField, PasswordStrengthMeter, LoadingSpinner, AppIcon },

  data() {
    return {
      form: {
        password: '',
        password_confirmation: ''
      },
      errors: {
        password: '',
        password_confirmation: ''
      },
      submitted: false
    }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error', isLoading: 'isLoading' }),

    /** يصل برابط الدعوة لمرة واحدة (invite token) */
    resetToken() {
      return String(this.$route.query.token || '')
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['acceptInvite']),

    validatePassword() {
      this.errors.password = required(this.form.password, 'كلمة المرور') || strongPassword(this.form.password)
      return !this.errors.password
    },

    validateConfirmation() {
      this.errors.password_confirmation =
        required(this.form.password_confirmation, 'تأكيد كلمة المرور') ||
        matches(this.form.password_confirmation, this.form.password, 'كلمتا المرور غير متطابقتين')
      return !this.errors.password_confirmation
    },

    validate() {
      const passwordOk = this.validatePassword()
      const confirmationOk = this.validateConfirmation()
      return passwordOk && confirmationOk
    },

    // POST /invite/{token}/accept | body: { password, password_confirmation }
    async handleSubmit() {
      if (!this.validate()) return

      try {
        await this.acceptInvite(this.resetToken, { ...this.form })
        this.submitted = true
      } catch (err) {
        const fieldErrors = err.normalized?.errors || {}
        this.errors.password = fieldErrors.password?.[0] || this.errors.password
      }
    }
  }
}
</script>
