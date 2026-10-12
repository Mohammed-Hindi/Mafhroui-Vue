<template>
  <div>
    <div v-if="submitted" class="palert is-success au-alert">
      <CheckCircle2 :size="20" class="shrink-0" /> تم تحديث كلمة المرور، يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
      <router-link :to="{ name: 'login' }" class="pbtn is-cyan is-sm au-alert-btn">تسجيل الدخول</router-link>
    </div>
    <!-- يصل برابط الدعوة لمرة واحدة: POST /invite/{token}/accept -->
    <NewPasswordCards v-else subtitle="تعيين كلمة مرور جديدة" :loading="isLoading" :error="authError || ''" :server-errors="serverErrors" @submit="handleSubmit" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { CheckCircle2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import NewPasswordCards from '@/components/auth/NewPasswordCards.vue'

export default {
  name: 'ResetPasswordPage',

  components: { CheckCircle2, NewPasswordCards },

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
