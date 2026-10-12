<template>
  <!-- نموذج كلمة مرور جديدة بنمط بوابة الكلية (201137): "≡ سجل بياناتك" + تنبيه معلومة + صفوف تسمية/حقل + زر أخضر،
       وبطاقة "عزيزي المستخدم" بالتعليمات. تستخدمه صفحتا تغيير كلمة المرور الإجبارية وتعيينها من رابط الدعوة -->
  <div>
    <div v-if="error" class="palert is-error au-alert"><AlertCircle :size="20" class="shrink-0" /> {{ error }}</div>

    <div class="au-grid is-wide">
      <section class="au-card">
        <div class="au-head-row">
          <h2 class="portal-title">سجل بياناتك</h2>
          <span>{{ subtitle }}</span>
        </div>

        <div class="portal-alert portal-alert-info au-info">
          <AlertCircle :size="20" class="shrink-0" />
          يجب أن تحتوي كلمة المرور على حروف خاصة ( @ , % , # ) وأرقام
        </div>

        <form class="au-rows" novalidate @submit.prevent="submit">
          <div class="portal-form-row">
            <label for="np-password">كلمة المرور الجديدة</label>
            <div>
              <input
                id="np-password" v-model="form.password" type="password" autocomplete="new-password" placeholder="كلمة المرور الجديدة"
                :class="['portal-input', errors.password && 'is-invalid']" @blur="validatePassword"
              >
              <PasswordStrengthMeter :password="form.password" />
              <p v-if="errors.password" class="portal-field-error">{{ errors.password }}</p>
            </div>
          </div>

          <div class="portal-form-row">
            <label for="np-confirm">تأكيد كلمة المرور</label>
            <div>
              <input
                id="np-confirm" v-model="form.password_confirmation" type="password" autocomplete="new-password" placeholder="تأكيد كلمة المرور"
                :class="['portal-input', errors.password_confirmation && 'is-invalid']" @blur="validateConfirmation"
              >
              <p v-if="errors.password_confirmation" class="portal-field-error">{{ errors.password_confirmation }}</p>
            </div>
          </div>

          <div class="au-actions">
            <button type="submit" class="pbtn is-green" :disabled="loading">{{ loading ? 'جارٍ الحفظ…' : 'تغيير كلمة المرور' }}</button>
          </div>
        </form>
      </section>

      <section class="au-card">
        <h2 class="portal-title au-head">عزيزي المستخدم</h2>
        <ul class="portal-bullets">
          <li>يمكنك تغيير كلمة المرور الخاصة بك من خلال هذه الصفحة</li>
          <li>أنت الوحيد المسؤول عن سرية كلمة المرور الخاصة بك</li>
          <li>ننصحك بتغيير كلمة المرور من فترة لأخرى</li>
          <li>يجب ألا تقل كلمة المرور الجديدة عن ثمانية أحرف</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import { AlertCircle } from 'lucide-vue-next'
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter.vue'
import { required, strongPassword, matches } from '@/utils/validators'

export default {
  name: 'NewPasswordCards',

  components: { AlertCircle, PasswordStrengthMeter },

  props: {
    subtitle: { type: String, default: 'تغيير كلمة المرور' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    /** أخطاء حقول الخادم بعد الإرسال */
    serverErrors: { type: Object, default: () => ({}) }
  },

  emits: ['submit'],

  data() {
    return {
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
