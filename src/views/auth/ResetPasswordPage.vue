<template>
  <!-- يصل برابط الدعوة لمرة واحدة: POST /invite/{token}/accept -->
  <NewPasswordCards
    title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك في المنصة" :done="submitted"
    :loading="isLoading" :error="authError || ''" :server-errors="serverErrors" @submit="handleSubmit"
  />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import NewPasswordCards from '@/components/auth/NewPasswordCards.vue'

export default {
  name: 'ResetPasswordPage',

  components: { NewPasswordCards },

  data() {
    return { submitted: false, serverErrors: {} }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error', isLoading: 'isLoading' })
  },

  methods: {
    ...mapActions(useAuthStore, ['acceptInvite']),

    async handleSubmit(form) {
      try {
        await this.acceptInvite(String(this.$route.query.token || ''), form)
        this.submitted = true
      } catch (err) {
        this.serverErrors = err.normalized?.errors || {}
      }
    }
  }
}
</script>
