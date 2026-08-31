<template>
  <div class="text-center">
    <template v-if="!failed">
      <LoadingSpinner :size="30" class="mx-auto mb-5 text-primary-600" />
      <h2 class="font-cairo font-extrabold text-[18px] text-text-900 mb-2">جارٍ تسجيل الدخول...</h2>
      <p class="text-[13px] text-text-600">لحظات ويتم تحويلك تلقائيًا</p>
    </template>

    <template v-else>
      <span class="grid place-items-center w-16 h-16 rounded-pill bg-error-bg text-error mx-auto mb-5">
        <AppIcon name="alertCircle" :size="28" :stroke-width="2.6" />
      </span>
      <h2 class="font-cairo font-extrabold text-[20px] text-text-900 mb-2.5">تعذّر تسجيل الدخول</h2>
      <p class="text-[13px] text-text-600 leading-[1.8] mb-7">{{ authError || 'رابط الدخول غير صالح أو منتهي الصلاحية.' }}</p>

      <router-link
        :to="{ name: 'login' }"
        class="inline-flex items-center justify-center gap-2.5 h-[50px] w-full px-6 rounded-sm bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14px] shadow-[0_10px_22px_-8px_rgba(37,99,235,.55)] hover:-translate-y-px transition-transform duration-fast"
      >
        الذهاب لتسجيل الدخول
        <AppIcon name="chevronStart" :size="16" :stroke-width="2.4" />
      </router-link>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'MagicLoginPage',

  components: { LoadingSpinner, AppIcon },

  data() {
    return {
      failed: false
    }
  },

  computed: {
    ...mapState(useAuthStore, { authError: 'error' })
  },

  async created() {
    // POST /magic-login/{token} | Response: { user, token }
    try {
      await this.consumeMagicLogin(String(this.$route.params.token || ''))
      const auth = useAuthStore()
      this.$router.replace(auth.homeRoute)
    } catch {
      this.failed = true
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['consumeMagicLogin'])
  }
}
</script>
