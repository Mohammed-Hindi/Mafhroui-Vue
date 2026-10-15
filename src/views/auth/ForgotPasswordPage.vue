<template>
  <!-- استرجاع كلمة المرور داخل قالب AuthSplit: حقل البريد، زر إرسال الرابط، ثم العودة لتسجيل الدخول -->
  <AuthSplit title="استرجاع كلمة المرور" subtitle="أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابط تعيين كلمة مرور جديدة" :back="{ to: { name: 'login' }, label: 'العودة إلى تسجيل الدخول' }">
    <div v-if="error" class="au-split-alert" role="alert"><AlertCircle :size="18" /> {{ error }}</div>
    <div v-if="submitted" class="au-split-alert is-success" role="status"><CheckCircle2 :size="18" /> أرسلنا رابط تعيين كلمة مرور جديدة إلى {{ form.email }}. تحقق من بريدك (ومن الرسائل غير المرغوب فيها).</div>

    <form novalidate @submit.prevent="handleSubmit">
      <label class="au-split-field">
        <span>البريد الإلكتروني</span>
        <span :class="['au-split-input', fieldError && 'is-invalid']">
          <Mail :size="18" />
          <input v-model.trim="form.email" type="email" autocomplete="username" placeholder="name@ucas.edu.ps" dir="ltr" @blur="validateEmail">
        </span>
        <small v-if="fieldError" class="au-split-error">{{ fieldError }}</small>
      </label>

      <button type="submit" class="us-btn us-glow-btn au-split-submit" :disabled="isLoading">
        {{ isLoading ? 'جارٍ الإرسال…' : submitted ? 'إعادة إرسال الرابط' : 'إرسال رابط الاسترجاع' }} <Send v-if="!isLoading" :size="18" class="us-flip" />
      </button>
    </form>
  </AuthSplit>
</template>

<script>
import { mapActions } from 'pinia'
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-vue-next'
import AuthSplit from '@/components/auth/AuthSplit.vue'
import { required, email as emailRule } from '@/utils/validators'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ForgotPasswordPage',

  components: { AlertCircle, AuthSplit, CheckCircle2, Mail, Send },

  data() {
    return {
      form: { email: '' },
      fieldError: '',
      error: '',
      isLoading: false,
      submitted: false
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['forgotPassword']),

    validateEmail() {
      this.fieldError = required(this.form.email, 'البريد الإلكتروني') || emailRule(this.form.email)
      return !this.fieldError
    },

    async handleSubmit() {
      if (!this.validateEmail()) return

      this.isLoading = true
      this.error = ''
      try {
        await this.forgotPassword(this.form.email)
        this.submitted = true
      } catch (err) {
        this.submitted = false
        this.error = err.normalized?.message || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقًا.'
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
