<template>
  <div>
    <h2 class="font-cairo font-extrabold text-[24px] text-text-900 mb-8">تسجيل الدخول</h2>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="mb-[18px]">
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

      <div class="mb-[18px]">
        <AuthPasswordField
          v-model="form.password"
          label="كلمة المرور"
          autocomplete="current-password"
          :error="errors.password"
          @blur="validatePassword"
        />
      </div>

      <div class="flex items-center justify-between mb-[26px]">
        <BaseCheckbox v-model="form.remember" label="تذكرني" />
        <router-link
          :to="{ name: 'forgot-password' }"
          class="text-[12.5px] font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-fast"
        >
          نسيت كلمة المرور؟
        </router-link>
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
          تسجيل الدخول
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
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Mail } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { required, email as emailRule } from '@/utils/validators'
import AuthTextField from '@/components/auth/AuthTextField.vue'
import AuthPasswordField from '@/components/auth/AuthPasswordField.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'LoginPage',

  components: { AuthTextField, AuthPasswordField, BaseCheckbox, LoadingSpinner, AppIcon },

  data() {
    return {
      Mail,
      form: {
        email: '',
        password: '',
        remember: false
      },
      errors: {
        email: '',
        password: ''
      }
    }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error', isLoading: 'isLoading', homeRoute: 'homeRoute' })
  },

  methods: {
    ...mapActions(useAuthStore, ['login']),

    validateEmail() {
      this.errors.email = required(this.form.email, 'البريد الإلكتروني') || emailRule(this.form.email)
      return !this.errors.email
    },

    validatePassword() {
      this.errors.password = required(this.form.password, 'كلمة المرور')
      return !this.errors.password
    },

    validate() {
      const emailOk = this.validateEmail()
      const passwordOk = this.validatePassword()
      return emailOk && passwordOk
    },

    // POST /login | body: { email, password } — remember محلي فقط (الباك إند لا يفرّق بينهما)
    async handleSubmit() {
      if (!this.validate()) return

      try {
        const { user } = await this.login({ ...this.form })
        console.log('DEBUG must_change_password:', user?.must_change_password, user)

        if (user?.must_change_password) {
          this.$router.replace({ name: 'change-password' })
          return
        }

        const redirect = this.$route.query.redirect
        this.$router.replace(typeof redirect === 'string' ? redirect : this.homeRoute)
      } catch (err) {
        const fieldErrors = err.normalized?.errors || {}
        this.errors.email = fieldErrors.email?.[0] || this.errors.email
        this.errors.password = fieldErrors.password?.[0] || this.errors.password
      }
    }
  }
}
</script>
