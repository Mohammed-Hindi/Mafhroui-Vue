<template>
  <!-- صفحات الدخول بهوية بوابة الكلية: تسجيل الدخول بشعار في الوسط (200336)، وباقي الصفحات بالشريط الداكن (200407، 201137) -->
  <div class="au-page">
    <div v-if="isLogin" class="au-brand">
      <UcasLogo :size="96" />
      <div>
        <strong>الكلية الجامعية للعلوم التطبيقية</strong>
        <span>منصة مسار لمشاريع التخرج</span>
      </div>
    </div>
    <header v-else class="au-top">
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
  </div>
</template>

<script>
import { Home } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'

export default {
  name: 'AuthLayout',
  components: { Home, UcasLogo },
  computed: {
    isLogin() {
      return this.$route.name === 'login'
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
