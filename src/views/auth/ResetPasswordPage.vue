<template>
  <!-- يصل برابط الدعوة لمرة واحدة ومرتبط بالبريد: GET /invite/{token} للتحقق ثم POST /invite/{token}/accept -->
  <NewPasswordCards
    title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحسابك في المنصة"
    :done="submitted" :blocked="blocked" :loading="isLoading || checking"
    :error="pageError || authError || ''" :server-errors="serverErrors" @submit="handleSubmit"
  />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import NewPasswordCards from '@/components/auth/NewPasswordCards.vue'

const INVITE_ERRORS = {
  used: 'تم استخدام رابط الدعوة هذا مسبقًا لتعيين كلمة المرور. سجّل/سجّلي الدخول مباشرة بالبريد الإلكتروني وكلمة المرور.',
  expired: 'انتهت صلاحية رابط الدعوة. اطلب/اطلبي رابط دعوة جديد من المشرف.',
  restricted: 'تم إيقاف هذا الحساب، يرجى التواصل مع العمادة.',
  invalid: 'رابط الدعوة غير صالح.'
}

export default {
  name: 'ResetPasswordPage',

  components: { NewPasswordCards },

  data() {
    return { submitted: false, blocked: false, checking: true, pageError: '', serverErrors: {} }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error', isLoading: 'isLoading' }),

    token() {
      return String(this.$route.query.token || '')
    },

    email() {
      return String(this.$route.query.email || '')
    }
  },

  async mounted() {
    // فحص حالة الرابط قبل عرض الفورم — يمنع ظهور الفورم لرابط مستخدم/منتهٍ (حتى في التصفح الخفي)
    if (!this.token) {
      this.blocked = true
      this.pageError = INVITE_ERRORS.invalid
      this.checking = false
      return
    }

    try {
      const status = await this.checkInvite(this.token)
      if (status !== 'valid') {
        this.blocked = true
        this.pageError = INVITE_ERRORS[status] || INVITE_ERRORS.invalid
      }
    } catch {
      this.blocked = true
      this.pageError = INVITE_ERRORS.invalid
    } finally {
      this.checking = false
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['checkInvite', 'acceptInvite']),

    async handleSubmit(form) {
      try {
        await this.acceptInvite(this.token, { ...form, email: this.email })
        this.submitted = true
      } catch (err) {
        this.serverErrors = err.normalized?.errors || {}
      }
    }
  }
}
</script>
