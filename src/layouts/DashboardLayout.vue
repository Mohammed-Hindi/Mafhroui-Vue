<template>
  <div class="min-h-screen bg-bg flex">
    <AppSidebar :nav-items="navItems" :role-label="roleLabel" />

    <div class="flex-1 flex flex-col min-w-0">
      <AppTopbar />

      <main class="flex-1 px-4 lg:px-6 py-6">
        <router-view v-slot="{ Component }">
          <transition
            enter-active-class="transition duration-base ease-standard"
            enter-from-class="opacity-0 translate-y-1"
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useAuthStore } from '@/stores/auth.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLE_LABELS } from '@/utils/constants'

/**
 * تخطيط لوحات التحكم الموحّد لكل الأدوار (سوبر أدمن/لجنة/مشرف/قائد فريق/طالب).
 * عناصر القائمة تُشتق من دور المستخدم الحالي عبر NAV_ITEMS_BY_ROLE — لا layout مخصص لكل دور.
 */
export default {
  name: 'DashboardLayout',

  components: { AppSidebar, AppTopbar },

  computed: {
    ...mapState(useAuthStore, ['userRole']),

    navItems() {
      return NAV_ITEMS_BY_ROLE[this.userRole] || []
    },

    roleLabel() {
      return ROLE_LABELS[this.userRole] || ''
    }
  }
}
</script>
