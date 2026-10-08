<template>
  <div :class="['min-h-screen bg-bg flex relative', isSuperAdmin && 'ucas-portal']">
    <!-- خلفية متحركة زخرفية — قطرات ماء + فقاعات، خلف كل المحتوى، لا تتفاعل مع الفأرة.
         هوية الكلية (السوبر أدمن) مسطّحة بلا خلفيات متحركة -->
    <template v-if="!isSuperAdmin">
      <WaterBackground />
      <div aria-hidden="true" class="pointer-events-none fixed inset-0 overflow-hidden">
        <span class="animate-blob absolute rounded-pill w-[420px] h-[420px] bg-primary-500/[0.05] -top-40 -end-32" />
        <span class="animate-blob absolute rounded-pill w-[340px] h-[340px] bg-accent-500/[0.05] top-1/2 -start-28" style="animation-delay:3s" />
        <span class="animate-blob absolute rounded-pill w-[280px] h-[280px] bg-secondary-500/[0.04] bottom-0 end-1/4" style="animation-delay:5s" />
      </div>
    </template>

    <AppSidebar :nav-items="navItems" :role-label="roleLabel" />

    <!-- زر القائمة (تحت lg): نفس الزر يفتح السايد بار ويغلقه، ويبقى مكانه فوق الـ Drawer ويتحوّل ☰ ← ✕ -->
    <button
      v-if="isSuperAdmin"
      type="button"
      :class="['portal-burger lg:hidden', sidebarOpen && 'is-open']"
      :aria-expanded="sidebarOpen"
      aria-controls="app-sidebar"
      :aria-label="sidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'"
      @click="toggleSidebar"
    >
      <span /><span /><span />
    </button>

    <div class="flex-1 flex flex-col min-w-0">
      <PortalTopbar v-if="isSuperAdmin" />
      <AppTopbar v-else />

      <main class="flex-1 px-4 lg:px-6 py-6">
        <!-- بطاقة بيانات الحساب — تقابل بطاقة "بيانات المرشد" الثابتة أعلى صفحات بوابة الكلية -->
        <section v-if="isSuperAdmin && $route.name !== 'super-admin-profile'" class="portal-identity mb-6">
          <div class="flex items-center gap-4 min-w-0">
            <UcasLogo :size="60" class="portal-identity-logo shrink-0" />
            <div class="min-w-0">
              <h2 class="text-h3 font-bold text-text-900 truncate">{{ userName || '—' }}</h2>
              <p class="text-body text-text-400">{{ roleLabel }}</p>
            </div>
          </div>
          <dl class="portal-identity-details">
            <div><dt>البريد الإلكتروني :</dt><dd class="mono">{{ userEmail || '—' }}</dd></div>
            <div><dt>الصلاحية :</dt><dd>{{ roleLabel }}</dd></div>
            <div><dt>الفصل الدراسي الحالي :</dt><dd>{{ activeSemesterName }}</dd></div>
          </dl>
        </section>

        <router-view v-slot="{ Component }">
          <transition
            enter-active-class="transition duration-fast ease-standard"
            enter-from-class="opacity-0"
            mode="out-in"
          >
            <component :is="Component" :key="isSuperAdmin ? $route.path : undefined" :class="isSuperAdmin && 'portal-page'" />
          </transition>
        </router-view>
      </main>

      <!-- فوتر بوابة الكلية (201014): شريط رمادي فاتح بسطر الحقوق فقط — فوتر صفحة الهبوط لا يدخل لوحات التحكم -->
      <footer v-if="isSuperAdmin" class="portal-footer">
        <div class="px-4 lg:px-6 py-5">
          {{ year }} © جميع الحقوق محفوظة لـ <router-link :to="homeRoute">{{ appName }}</router-link> — الكلية الجامعية للعلوم التطبيقية
        </div>
      </footer>
    </div>

    <!-- زر العودة للأعلى — مربع برتقالي بالزاوية السفلية اليسرى كما في موقع الكلية -->
    <transition name="portal-top">
      <button v-if="isSuperAdmin && showBackToTop" type="button" class="portal-back-top" aria-label="العودة للأعلى" @click="scrollToTop">
        <ChevronUp :size="26" />
      </button>
    </transition>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { ChevronUp } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import PortalTopbar from '@/components/layout/PortalTopbar.vue'
import WaterBackground from '@/components/shared/WaterBackground.vue'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLE_LABELS, ROLES, APP_NAME } from '@/utils/constants'

/**
 * تخطيط لوحات التحكم الموحّد لكل الأدوار (سوبر أدمن/لجنة/مشرف/طالب).
 * عناصر القائمة تُشتق من دور المستخدم الحالي عبر NAV_ITEMS_BY_ROLE — لا layout مخصص لكل دور.
 *
 * السوبر أدمن يأخذ هوية الكلية (UCAS): data-brand="ucas" على <html> يحوّل كل التوكنز
 * (بما فيها المودالات والقوائم المنقولة لـ <body>) — المرجع: docs/design/UCAS_DESIGN_SYSTEM.md
 */
export default {
  name: 'DashboardLayout',

  components: { AppSidebar, AppTopbar, PortalTopbar, WaterBackground, UcasLogo, ChevronUp },

  data() {
    return {
      showBackToTop: false,
      year: new Date().getFullYear(),
      appName: APP_NAME
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'userName', 'userEmail', 'homeRoute']),
    ...mapState(useUiStore, ['semesters', 'activeSemesterId', 'sidebarOpen']),

    isSuperAdmin() {
      return this.userRole === ROLES.SUPER_ADMIN
    },

    navItems() {
      return NAV_ITEMS_BY_ROLE[this.userRole] || []
    },

    roleLabel() {
      return ROLE_LABELS[this.userRole] || ''
    },
    activeSemesterName() {
      return this.semesters.find((s) => String(s.id) === String(this.activeSemesterId))?.name || '—'
    }
  },

  watch: {
    isSuperAdmin: {
      immediate: true,
      handler(on) {
        if (on) document.documentElement.setAttribute('data-brand', 'ucas')
        else document.documentElement.removeAttribute('data-brand')
      }
    }
  },

  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  },

  beforeUnmount() {
    document.documentElement.removeAttribute('data-brand')
    window.removeEventListener('scroll', this.handleScroll)
  },

  methods: {
    ...mapActions(useUiStore, ['toggleSidebar']),

    handleScroll() {
      this.showBackToTop = window.scrollY > 300
    },

    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}
</script>
