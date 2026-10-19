<template>
  <!-- sa-skin: هوية صفحة الهبوط (تدرّج، خطوط، حركة) للشريط العلوي والسايد بار والفوتر في كل لوحات التحكم -->
  <div :class="['min-h-screen bg-bg flex relative', isSuperAdmin && 'ucas-portal sa-skin']">
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
        <div class="portal-footer-in px-4 lg:px-6">
          <span>{{ year }} © جميع الحقوق محفوظة لـ <router-link :to="homeRoute">منصة {{ appName }}</router-link> في <a href="https://www.ucas.edu.ps" target="_blank" rel="noopener">الكلية الجامعية للعلوم التطبيقية</a></span>
        </div>
      </footer>
    </div>

    <!-- زر العودة للأعلى بهوية مسار (حلقة تقدّم التمرير) -->
    <BackToTop v-if="isSuperAdmin" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import BackToTop from '@/components/shared/BackToTop.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import PortalTopbar from '@/components/layout/PortalTopbar.vue'
import WaterBackground from '@/components/shared/WaterBackground.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLE_LABELS, APP_NAME } from '@/utils/constants'

/**
 * تخطيط لوحات التحكم الموحّد لكل الأدوار (سوبر أدمن/لجنة/مشرف/طالب).
 * عناصر القائمة تُشتق من دور المستخدم الحالي عبر NAV_ITEMS_BY_ROLE — لا layout مخصص لكل دور.
 *
 * السوبر أدمن يأخذ هوية الكلية (UCAS): data-brand="ucas" على <html> يحوّل كل التوكنز
 * (بما فيها المودالات والقوائم المنقولة لـ <body>) — المرجع: docs/design/UCAS_DESIGN_SYSTEM.md
 */
export default {
  name: 'DashboardLayout',

  components: { AppSidebar, AppTopbar, BackToTop, PortalTopbar, WaterBackground },

  data() {
    return {
      year: new Date().getFullYear(),
      appName: APP_NAME
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'homeRoute', 'usesPortal']),
    ...mapState(useUiStore, ['sidebarOpen', 'pendingProposals']),

    /** واجهة البوابة: الإدارة العامة ولجنة الإشراف */
    isSuperAdmin() {
      return this.usesPortal
    },

    navItems() {
      const items = NAV_ITEMS_BY_ROLE[this.userRole] || []
      if (!this.pendingProposals) return items
      // المقترحات المنتظرة: دائرة حمرا بعددها بالسايد بار تجذب للإجراء المطلوب
      const mark = (arr) => arr.map((it) => (it.to && it.to.endsWith('/proposals') ? { ...it, badge: this.pendingProposals } : it))
      const grouped = items[0] && Object.prototype.hasOwnProperty.call(items[0], 'items')
      return grouped ? items.map((g) => ({ ...g, items: mark(g.items) })) : mark(items)
    },

    /** الأدوار التي تراجع المقترحات (تظهر لها نقطة الإجراء) */
    reviewsProposals() {
      return JSON.stringify(NAV_ITEMS_BY_ROLE[this.userRole] || []).includes('/proposals')
    },

    roleLabel() {
      return ROLE_LABELS[this.userRole] || ''
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


  created() {
    if (this.reviewsProposals) this.fetchPendingProposals()
  },

  beforeUnmount() {
    document.documentElement.removeAttribute('data-brand')
  },

  methods: {
    ...mapActions(useUiStore, ['toggleSidebar', 'fetchPendingProposals'])
  }
}
</script>
