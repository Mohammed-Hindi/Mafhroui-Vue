<template>
  <!-- تسجيل الدخول داخل قالب AuthSplit: البريد وكلمة المرور بأيقونات، "نسيت كلمة المرور؟"، زر الدخول المتوهّج -->
  <AuthSplit title="تسجيل الدخول" subtitle="أهلًا بك، أدخل بريدك الإلكتروني وكلمة المرور للمتابعة">
    <div v-if="authError" class="au-split-alert" role="alert"><AlertCircle :size="18" /> {{ authError }}</div>

    <form novalidate @submit.prevent="handleSubmit">
      <label class="au-split-field">
        <span>البريد الإلكتروني</span>
        <span :class="['au-split-input', errors.email && 'is-invalid']">
          <Mail :size="18" />
          <input v-model.trim="form.email" type="email" autocomplete="username" placeholder="name@ucas.edu.ps" dir="ltr" @blur="validateEmail">
        </span>
        <small v-if="errors.email" class="au-split-error">{{ errors.email }}</small>
      </label>

      <label class="au-split-field">
        <span>كلمة المرور</span>
        <span :class="['au-split-input', errors.password && 'is-invalid']">
          <Lock :size="18" />
          <input v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" dir="ltr" @blur="validatePassword">
          <button type="button" class="au-split-eye" :aria-label="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="18" /><Eye v-else :size="18" />
          </button>
        </span>
        <small v-if="errors.password" class="au-split-error">{{ errors.password }}</small>
      </label>

      <div class="au-split-row">
        <router-link :to="{ name: 'forgot-password' }">نسيت كلمة المرور؟</router-link>
      </div>

      <button type="submit" class="us-btn is-solid au-split-submit" :disabled="isLoading">
        {{ isLoading ? 'جارٍ الدخول…' : 'تسجيل الدخول' }} <LogIn v-if="!isLoading" :size="19" class="us-flip" />
      </button>
    </form>
  </AuthSplit>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-vue-next'
import AuthSplit from '@/components/auth/AuthSplit.vue'
import { useAuthStore } from '@/stores/auth.store'
import { required, email as emailRule } from '@/utils/validators'

export default {
  name: 'LoginPage',

  components: { AlertCircle, AuthSplit, Eye, EyeOff, Lock, LogIn, Mail },

  data() {
    return {
      showPassword: false,
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

    // POST /login | body: { email, password }
    async handleSubmit() {
      if (!this.validate()) return

      try {
        const { user } = await this.login({ ...this.form })

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
