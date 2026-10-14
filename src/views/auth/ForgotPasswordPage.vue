<template>
  <!-- استرجاع كلمة المرور بنمط البوابة (200407، 200430): بطاقة النموذج بوسم سماوي بالزاوية + بطاقة "عزيزي المستخدم" -->
  <div class="au-narrow">
    <div v-if="error" class="palert is-error au-alert"><AlertCircle :size="20" class="shrink-0" /> {{ error }}</div>
    <div v-if="submitted" class="palert is-success au-alert"><CheckCircle2 :size="20" class="shrink-0" /> أرسلنا رابط تعيين كلمة مرور جديدة إلى {{ form.email }}. تحقق من بريدك (ومن الرسائل غير المرغوب فيها).</div>

    <div class="au-grid au-center">
      <section class="au-card">
        <router-link :to="{ name: 'login' }" class="au-corner">تسجيل الدخول</router-link>
        <h2 class="portal-title au-head">استرجاع كلمة المرور</h2>

        <form class="au-rows au-fp" novalidate @submit.prevent="handleSubmit">
          <div class="portal-form-row">
            <label for="fp-email">البريد الإلكتروني</label>
            <div>
              <input
                id="fp-email" v-model.trim="form.email" type="email" autocomplete="username" placeholder="البريد الإلكتروني"
                :class="['portal-input', fieldError && 'is-invalid']" @blur="validateEmail"
              >
              <p v-if="fieldError" class="portal-field-error">{{ fieldError }}</p>
            </div>
          </div>

          <div class="au-actions">
            <button type="submit" class="pbtn is-cyan" :disabled="isLoading">
              {{ isLoading ? 'جارٍ الإرسال…' : submitted ? 'إعادة إرسال الرابط' : 'استرجاع كلمة المرور' }}
            </button>
          </div>
        </form>
      </section>

      <section class="au-card">
        <h2 class="portal-title au-head">عزيزي المستخدم</h2>
        <ul class="portal-bullets">
          <li>يمكنك استرداد كلمة المرور الخاصة بك من خلال هذه الصفحة.</li>
          <li>سيصلك رابط تعيين كلمة مرور جديدة على بريدك المسجّل.</li>
          <li>أنت الوحيد المسؤول عن سرية كلمة المرور الخاصة بك.</li>
          <li>ننصحك بتغيير كلمة المرور من فترة لأخرى.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'pinia'
import { AlertCircle, CheckCircle2 } from 'lucide-vue-next'
import { required, email as emailRule } from '@/utils/validators'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ForgotPasswordPage',

  components: { AlertCircle, CheckCircle2 },

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
