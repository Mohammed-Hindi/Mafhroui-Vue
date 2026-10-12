<template>
  <!-- تسجيل الدخول بنمط بوابة الكلية (200336): بطاقة الدخول يمينًا وبطاقة "تعليمات هامة" يسارًا -->
  <div>
    <div v-if="authError" class="palert is-error au-alert"><AlertCircle :size="20" class="shrink-0" /> {{ authError }}</div>

    <div class="au-grid">
      <section class="au-card au-login">
        <h1 class="au-login-title">تسجيل الدخول</h1>

        <form novalidate @submit.prevent="handleSubmit">
          <label class="au-field">
            <span>البريد الإلكتروني</span>
            <input
              v-model.trim="form.email" type="email" autocomplete="username" placeholder="name@ucas.edu.ps"
              :class="['portal-input', errors.email && 'is-invalid']" @blur="validateEmail"
            >
            <small v-if="errors.email" class="portal-field-error">{{ errors.email }}</small>
          </label>

          <label class="au-field">
            <span>كلمة المرور</span>
            <input
              v-model="form.password" type="password" autocomplete="current-password" placeholder="••••••••"
              :class="['portal-input', errors.password && 'is-invalid']" @blur="validatePassword"
            >
            <small v-if="errors.password" class="portal-field-error">{{ errors.password }}</small>
          </label>

          <button type="submit" class="pbtn is-sky au-submit" :disabled="isLoading">
            {{ isLoading ? 'جارٍ الدخول…' : 'تسجيل دخول' }}
          </button>
        </form>

        <div class="au-links">
          <router-link :to="{ name: 'forgot-password' }"><KeyRound :size="16" /> فقدت كلمة المرور</router-link>
          <router-link :to="{ name: 'landing' }"><Home :size="16" /> الصفحة الرئيسية</router-link>
        </div>
      </section>

      <section class="au-card">
        <h2 class="au-card-title">تعليمات هامة</h2>
        <ul class="portal-bullets">
          <li>تأكد من إدخال بريدك الإلكتروني المسجّل بشكل صحيح</li>
          <li>تأكد من كلمة المرور وحالة الأحرف</li>
          <li>انتبه لزر الحروف الكبيرة</li>
          <li>المنصة لأعضاء لجنة الإشراف والمشرفين الأكاديميين والطلاب</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { AlertCircle, Home, KeyRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { required, email as emailRule } from '@/utils/validators'

export default {
  name: 'LoginPage',

  components: { AlertCircle, Home, KeyRound },

  data() {
    return {
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
