<template>
  <!-- صفحات الدخول: الدخول واسترجاع/تغيير/تعيين كلمة المرور بشاشة كاملة من قسمين (AuthSplit)، وباقي الصفحات بالشريط الداكن -->
  <div class="au-page">
    <router-view v-if="isSplit" />
    <template v-else>
      <header class="au-top">
        <router-link :to="{ name: 'login' }" class="au-top-brand">
          <UcasLogo :size="52" />
          <span>
            <strong>الكلية الجامعية للعلوم التطبيقية</strong>
            <small>منصة مسار لمشاريع التخرج</small>
          </span>
        </router-link>
        <router-link :to="{ name: 'landing' }" class="au-top-link"><Home :size="16" /> الرئيسية</router-link>
      </header>

      <main class="au-main">
        <router-view />
      </main>
    </template>
  </div>
</template>

<script>
import { Home } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'

export default {
  name: 'AuthLayout',
  components: { Home, UcasLogo },
  computed: {
    // صفحات قالب AuthSplit (شاشة كاملة من قسمين)؛ الباقي بالشريط الداكن
    isSplit() {
      return ['login', 'forgot-password', 'reset-password', 'change-password'].includes(this.$route.name)
    }
  },
  // التوكنز وألوان البوابة تعمل تحت data-brand="ucas" (نفس آلية DashboardLayout)
  mounted() {
    document.documentElement.setAttribute('data-brand', 'ucas')
  },
  beforeUnmount() {
    document.documentElement.removeAttribute('data-brand')
  }
}
</script>
