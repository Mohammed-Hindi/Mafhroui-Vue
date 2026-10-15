<template>
  <!-- تغيير كلمة المرور الإجباري بعد أول دخول — POST /me/change-password ثم المتابعة للوحة -->
  <NewPasswordCards title="تغيير كلمة المرور" subtitle="مطلوب تعيين كلمة مرور جديدة قبل المتابعة إلى المنصة" :back="{ to: { name: 'landing' }, label: 'العودة إلى الصفحة الرئيسية' }" :loading="isLoading" :error="authError || ''" :server-errors="serverErrors" @submit="handleSubmit" />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import NewPasswordCards from '@/components/auth/NewPasswordCards.vue'

export default {
  name: 'ChangePasswordPage',

  components: { NewPasswordCards },

  data() {
    return { serverErrors: {} }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error', isLoading: 'isLoading', homeRoute: 'homeRoute' })
  },

  methods: {
    ...mapActions(useAuthStore, ['changePassword']),

    async handleSubmit(form) {
      try {
        await this.changePassword(form)
        this.$toast?.success('تم تحديث كلمة المرور')
        this.$router.replace(this.homeRoute)
      } catch (err) {
        this.serverErrors = err.normalized?.errors || {}
      }
    }
  }
}
</script>
