<template>
  <!-- تغيير كلمة المرور (كل اللوحات) بالهوية الجديدة: بطاقة النموذج برأس متدرّج وحقول بأيقونات وزر إظهار ومقياس القوة،
       وبطاقة "نصائح الأمان" بخطوات مرقّمة -->
  <div class="cp-grid">
    <section class="cp-card">
      <header class="cp-head">
        <span class="cp-head-ic"><KeyRound :size="22" /></span>
        <div>
          <h2>تغيير كلمة المرور</h2>
          <p>اختر كلمة مرور قوية لحماية حسابك في المنصة</p>
        </div>
      </header>

      <form class="cp-form" novalidate @submit.prevent="handleSubmit">
        <p class="cp-hint"><Info :size="17" /> يجب ألا تقل عن ثمانية أحرف، وأن تحتوي على أرقام ورموز خاصة مثل <bdi dir="ltr">@ % #</bdi></p>

        <label class="cp-field">
          <span>كلمة المرور الجديدة</span>
          <span :class="['cp-input', errors.password && 'is-invalid']">
            <Lock :size="18" />
            <input v-model="form.password" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" dir="ltr" @blur="validatePassword">
            <button type="button" :aria-label="show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'" @click="show = !show"><EyeOff v-if="show" :size="18" /><Eye v-else :size="18" /></button>
          </span>
          <PasswordStrengthMeter :password="form.password" />
          <small v-if="errors.password" class="cp-error">{{ errors.password }}</small>
        </label>

        <label class="cp-field">
          <span>تأكيد كلمة المرور</span>
          <span :class="['cp-input', errors.password_confirmation && 'is-invalid']">
            <ShieldCheck :size="18" />
            <input v-model="form.password_confirmation" :type="show ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" dir="ltr" @blur="validateConfirmation">
          </span>
          <small v-if="errors.password_confirmation" class="cp-error">{{ errors.password_confirmation }}</small>
        </label>

        <div class="cp-actions">
          <button type="submit" class="pbtn is-green cp-submit" :disabled="isLoading"><Check :size="18" /> {{ isLoading ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور' }}</button>
        </div>
      </form>
    </section>

    <aside class="cp-card cp-tips">
      <h3><ShieldCheck :size="18" /> نصائح الأمان</h3>
      <ol>
        <li><b>استخدم كلمة مرور قوية</b><span>ثمانية أحرف على الأقل، بحروف وأرقام ورموز خاصة.</span></li>
        <li><b>حافظ على سريتها</b><span>لا تشاركها مع أي شخص، ولن يطلبها منك فريق المنصة أبدًا.</span></li>
        <li><b>لا تكررها في مواقع أخرى</b><span>اجعل كلمة مرور المنصة مختلفة عن بريدك وحساباتك الأخرى.</span></li>
        <li><b>غيّرها من فترة لأخرى</b><span>ننصح بتغييرها كل فصل دراسي، أو فورًا إن شككت في تسرّبها.</span></li>
      </ol>
    </aside>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Check, Eye, EyeOff, Info, KeyRound, Lock, ShieldCheck } from 'lucide-vue-next'
import PasswordStrengthMeter from '@/components/shared/PasswordStrengthMeter.vue'
import { useAuthStore } from '@/stores/auth.store'
import { required, matches, strongPassword } from '@/utils/validators'

const emptyForm = () => ({ password: '', password_confirmation: '' })

/**
 * تغيير كلمة مرور السوبر أدمن — POST /me/change-password (نفس endpoint صفحة تغيير كلمة المرور الإجبارية).
 * لا يوجد حقل "كلمة المرور القديمة" لأن الـ API لا يتحقق منها؛ إضافته بدون تحقق ستكون مضللة.
 */
export default {
  name: 'SuperAdminChangePasswordPage',

  components: { Check, Eye, EyeOff, Info, KeyRound, Lock, PasswordStrengthMeter, ShieldCheck },

  data() {
    return {
      show: false,
      form: emptyForm(),
      errors: { password: '', password_confirmation: '' }
    }
  },

  computed: {
    ...mapState(useAuthStore, ['isLoading'])
  },

  methods: {
    ...mapActions(useAuthStore, ['changePassword']),

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

    async handleSubmit() {
      const ok = [this.validatePassword(), this.validateConfirmation()].every(Boolean)
      if (!ok) return

      try {
        await this.changePassword({ ...this.form })
        this.form = emptyForm()
        this.$toast?.success('تم تغيير كلمة المرور بنجاح')
      } catch (err) {
        this.errors.password = err.normalized?.errors?.password?.[0] || ''
        this.$toast?.error(err.normalized?.message || 'تعذّر تغيير كلمة المرور')
      }
    }
  }
}
</script>
