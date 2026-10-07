<template>
  <!-- الشريط العلوي بنمط بوابة الكلية (my.ucas — Screenshot 200540): داكن، عنوان الصفحة يمينًا،
       ويسارًا: الإشعارات ← المستخدم بقائمة منسدلة ← تبديل الوضع -->
  <header class="portal-topbar sticky top-0 z-sticky-header">
    <div class="flex items-center gap-2 sm:gap-3 px-4 lg:px-6 h-[72px]">
      <button
        type="button"
        class="portal-icon-btn lg:hidden"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        aria-label="فتح القائمة"
        @click="toggleSidebar"
      >
        <MenuIcon :size="22" />
      </button>

      <div class="min-w-0 flex-1">
        <h1 class="portal-topbar-title truncate">{{ pageTitle }}</h1>
      </div>

      <SemesterSelect class="portal-semester hidden md:block" />

      <div class="portal-bell"><NotificationBell /></div>

      <div ref="userMenu" class="relative">
        <button
          type="button"
          :class="['portal-user', menuOpen && 'is-open']"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          @click="menuOpen = !menuOpen"
        >
          <span class="portal-avatar"><UcasLogo :size="26" /></span>
          <span class="hidden sm:inline truncate max-w-[200px]">{{ userName }}</span>
          <ChevronDown :size="15" :class="['shrink-0 transition-transform duration-fast', menuOpen && 'rotate-180']" />
        </button>

        <transition name="portal-drop">
          <div v-if="menuOpen" class="portal-menu end-0 w-56" role="menu">
            <router-link :to="{ name: 'super-admin-profile' }" class="portal-menu-item" role="menuitem">
              <Settings :size="17" /> بياناتي
            </router-link>
            <router-link :to="{ name: 'super-admin-change-password' }" class="portal-menu-item" role="menuitem">
              <Lock :size="17" /> تغيير كلمة المرور
            </router-link>
            <hr class="portal-menu-sep">
            <button type="button" class="portal-menu-item" role="menuitem" @click="handleLogout">
              <LogOut :size="17" /> تسجيل الخروج
            </button>
          </div>
        </transition>
      </div>

      <button
        type="button"
        class="portal-icon-btn"
        :aria-label="isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'"
        :title="isDark ? 'الوضع النهاري' : 'الوضع الليلي'"
        @click="toggleTheme"
      >
        <Sun :size="19" />
      </button>
    </div>
  </header>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Menu as MenuIcon, ChevronDown, Lock, LogOut, Sun, Settings } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'
import SemesterSelect from '@/components/shared/SemesterSelect.vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'PortalTopbar',

  components: { MenuIcon, ChevronDown, Lock, LogOut, Sun, Settings, UcasLogo, NotificationBell, SemesterSelect },

  data() {
    return { menuOpen: false }
  },

  computed: {
    ...mapState(useUiStore, ['sidebarOpen', 'isDark']),
    ...mapState(useAuthStore, ['userName']),

    pageTitle() {
      return this.$route.meta?.title || ''
    }
  },

  watch: {
    $route() {
      this.menuOpen = false
    }
  },

  mounted() {
    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('keydown', this.handleEscape)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('keydown', this.handleEscape)
  },

  methods: {
    ...mapActions(useUiStore, ['toggleSidebar', 'toggleTheme']),
    ...mapActions(useAuthStore, ['logout']),

    handleOutsideClick(event) {
      if (this.menuOpen && !this.$refs.userMenu?.contains(event.target)) this.menuOpen = false
    },

    handleEscape(event) {
      if (event.key === 'Escape') this.menuOpen = false
    },

    async handleLogout() {
      await this.logout()
      this.$router.push({ name: 'login' })
    }
  }
}
</script>
