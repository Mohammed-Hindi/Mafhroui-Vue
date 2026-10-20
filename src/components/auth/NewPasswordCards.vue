<template>
  <!-- نموذج كلمة مرور جديدة داخل قالب AuthSplit: تلميح الشروط، الحقلان بأيقونات وزر إظهار، مقياس القوة، زر الحفظ.
       تستخدمه صفحتا تغيير كلمة المرور الإجبارية وتعيينها من رابط الدعوة (done = نجاح التعيين) -->
  <AuthSplit :title="title" :subtitle="subtitle" :back="back">
    <div v-if="error" class="au-split-alert" role="alert"><AlertCircle :size="18" /> {{ error }}</div>

    <template v-if="blocked">
      <router-link :to="{ name: 'login' }" class="us-btn us-glow-btn au-split-submit">تسجيل الدخول <LogIn :size="19" class="us-flip" /></router-link>
    </template>

    <template v-else-if="done">
      <div class="au-split-alert is-success" role="status"><CheckCircle2 :size="18" /> تم تحديث كلمة المرور، يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</div>
      <router-link :to="{ name: 'login' }" class="us-btn us-glow-btn au-split-submit">تسجيل الدخول <LogIn :size="19" class="us-flip" /></router-link>
    </template>

    <form v-else novalidate @submit.prevent="submit">
      <p class="au-split-hint"><Info :size="17" /> يجب ألا تقل عن ثمانية أحرف، وأن تحتوي على أرقام ورموز خاصة مثل <bdi dir="ltr">@ % #</bdi></p>

      <label class="au-split-field">
        <span>كلمة المرور الجديدة</span>
        <span :class="['au-split-input', errors.password && 'is-invalid']">
          <Lock :size="18" />
          <input v-model="form.password" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" dir="ltr" @blur="validatePassword">
          <button type="button" class="au-split-eye" :aria-label="show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'" @click="show = !show">
            <EyeOff v-if="show" :size="18" /><Eye v-else :size="18" />
          </button>
        </span>
        <PasswordStrengthMeter :password="form.password" />
        <small v-if="errors.password" class="au-split-error">{{ errors.password }}</small>
      </label>

      <label class="au-split-field">
        <span>تأكيد كلمة المرور</span>
        <span :class="['au-split-input', errors.password_confirmation && 'is-invalid']">
          <ShieldCheck :size="18" />
          <input v-model="form.password_confirmation" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" dir="ltr" @blur="validateConfirmation">
        </span>
        <small v-if="errors.password_confirmation" class="au-split-error">{{ errors.password_confirmation }}</small>
      </label>

      <button type="submit" class="us-btn us-glow-btn au-split-submit" :disabled="loading">
        {{ loading ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور' }} <Check v-if="!loading" :size="19" />
      </button>
    </form>
  </AuthSplit>
</template>

<script>
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Info, Lock, LogIn, ShieldCheck } from 'lucide-vue-next'
import AuthSplit from '@/components/auth/AuthSplit.vue'
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter.vue'
import { required, strongPassword, matches } from '@/utils/validators'

export default {
  name: 'NewPasswordCards',

  components: { AlertCircle, AuthSplit, Check, CheckCircle2, Eye, EyeOff, Info, Lock, LogIn, PasswordStrengthMeter, ShieldCheck },

  props: {
    title: { type: String, default: 'تغيير كلمة المرور' },
    subtitle: { type: String, default: '' },
    /** رابط العودة أسفل الفورم */
    back: { type: Object, default: () => ({ to: { name: 'login' }, label: 'العودة إلى تسجيل الدخول' }) },
    /** نجاح التعيين: يُستبدل الفورم برسالة وزر الدخول */
    done: { type: Boolean, default: false },
    /** رابط غير صالح/مستخدم/منتهٍ: يُخفى الفورم ويُعرض الخطأ مع زر الدخول */
    blocked: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    /** أخطاء حقول الخادم بعد الإرسال */
    serverErrors: { type: Object, default: () => ({}) }
  },

  emits: ['submit'],

  data() {
    return {
      show: false,
      form: { password: '', password_confirmation: '' },
      errors: { password: '', password_confirmation: '' }
    }
  },

  watch: {
    serverErrors(v) {
      this.errors.password = v.password?.[0] || this.errors.password
    }
  },

  methods: {
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

    submit() {
      const ok = [this.validatePassword(), this.validateConfirmation()].every(Boolean)
      if (ok) this.$emit('submit', { ...this.form })
    }
  }
}
</script>
