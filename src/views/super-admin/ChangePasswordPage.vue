<template>
  <!-- نفس تخطيط صفحة "تغيير كلمة المرور" في بوابة الكلية (Screenshot 201137):
       بطاقة النموذج يمينًا (تسمية بعمود + حقل) وبطاقة "عزيزي المستخدم" بالتعليمات يسارًا -->
  <div class="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr] gap-6 items-start">
    <section class="bg-surface rounded-lg border border-border shadow-card p-6 sm:p-8">
      <div class="flex flex-wrap items-baseline gap-3 mb-6">
        <h2 class="portal-title">سجل بياناتك</h2>
        <span class="text-caption font-semibold text-text-600">تغيير كلمة المرور</span>
      </div>

      <div class="portal-alert portal-alert-info mb-6">
        <AlertCircle :size="20" class="shrink-0" />
        يجب أن تحتوي كلمة المرور على حروف خاصة ( @ , % , # ) وأرقام
      </div>

      <form class="flex flex-col gap-5" novalidate @submit.prevent="handleSubmit">
        <div class="portal-form-row">
          <label for="new-password">كلمة المرور الجديدة</label>
          <div>
            <input
              id="new-password" v-model="form.password" type="password" autocomplete="new-password"
              placeholder="كلمة المرور الجديدة"
              :class="['portal-input', errors.password && 'is-invalid']"
              @blur="validatePassword"
            >
            <PasswordStrengthMeter :password="form.password" />
            <p v-if="errors.password" class="portal-field-error">{{ errors.password }}</p>
          </div>
        </div>

        <div class="portal-form-row">
          <label for="confirm-password">تأكيد كلمة المرور</label>
          <div>
            <input
              id="confirm-password" v-model="form.password_confirmation" type="password" autocomplete="new-password"
              placeholder="تأكيد كلمة المرور"
              :class="['portal-input', errors.password_confirmation && 'is-invalid']"
              @blur="validateConfirmation"
            >
            <p v-if="errors.password_confirmation" class="portal-field-error">{{ errors.password_confirmation }}</p>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <BaseButton type="submit" variant="secondary" size="lg" :loading="isLoading">تغيير كلمة المرور</BaseButton>
        </div>
      </form>
    </section>

    <section class="bg-surface rounded-lg border border-border shadow-card p-6 sm:p-8">
      <h2 class="portal-title mb-4">عزيزي المستخدم</h2>
      <ul class="portal-bullets">
        <li>يمكنك تغيير كلمة المرور الخاصة بك من خلال هذه الصفحة</li>
        <li>أنت الوحيد المسؤول عن سرية كلمة المرور الخاصة بك</li>
        <li>ننصحك بتغيير كلمة المرور من فترة لأخرى</li>
        <li>يجب ألا تقل كلمة المرور الجديدة عن ثمانية أحرف</li>
      </ul>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { AlertCircle } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
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

  components: { AlertCircle, BaseButton, PasswordStrengthMeter },

  data() {
    return {
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
