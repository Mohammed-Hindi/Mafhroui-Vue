<template>
  <!-- الشريط العلوي بنمط بوابة الكلية (my.ucas — Screenshot 200540): داكن، عنوان الصفحة يمينًا،
       ويسارًا: الإشعارات ← المستخدم بقائمة منسدلة ← تبديل الوضع -->
  <header class="portal-topbar sticky top-0 z-sticky-header">
    <div class="flex items-center gap-2 sm:gap-3 px-4 lg:px-6 h-[72px]">
      <!-- مكان زر القائمة الثابت (.portal-burger في DashboardLayout) — يبقى فوق الـ Drawer فيفتح ويغلق من نفس المكان -->
      <span class="w-11 shrink-0 lg:hidden" aria-hidden="true" />

      <div class="min-w-0 flex-1">
        <!-- على الجوال: الكلمة الأولى + … والضغط يكشف باقي العنوان بحركة انزلاق -->
        <h1
          :class="['portal-topbar-title truncate', titleRest && 'has-rest', titleOpen && 'is-open']"
          :title="pageTitle" @click="titleOpen = !titleOpen"
        >
          <span class="tt">{{ titleFirst }}<span v-if="titleRest" class="tt-dots" aria-hidden="true">…</span><span v-if="titleRest" class="tt-rest">&nbsp;{{ titleRest }}</span></span>
        </h1>
      </div>

      <GlobalSearch v-if="showSearch" class="hidden md:block" />

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
          <span class="portal-avatar"><img v-if="avatarSrc" :src="avatarSrc" alt=""><UcasLogo v-else :size="26" /></span>
          <span class="hidden sm:inline truncate max-w-[200px]">{{ userName }}</span>
          <ChevronDown :size="15" :class="['shrink-0 transition-transform duration-fast', menuOpen && 'rotate-180']" />
        </button>

        <transition name="portal-drop">
          <div v-if="menuOpen" class="portal-menu end-0 w-56" role="menu">
            <router-link :to="{ name: `${portalPrefix}-profile` }" class="portal-menu-item" role="menuitem">
              <UserCircle :size="17" /> بياناتي
            </router-link>
            <router-link :to="{ name: `${portalPrefix}-change-password` }" class="portal-menu-item" role="menuitem">
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
import { ChevronDown, Lock, LogOut, Sun, UserCircle } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'
import SemesterSelect from '@/components/shared/SemesterSelect.vue'
import GlobalSearch from '@/components/layout/GlobalSearch.vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLES } from '@/utils/constants'

export default {
  name: 'PortalTopbar',

  components: { ChevronDown, Lock, LogOut, Sun, UserCircle, UcasLogo, NotificationBell, SemesterSelect, GlobalSearch },

  data() {
    return { menuOpen: false, titleOpen: false }
  },

  computed: {
    ...mapState(useUiStore, ['isDark']),
    ...mapState(useAuthStore, ['userName', 'avatarSrc', 'userRole', 'portalPrefix']),

    /** البحث الشامل للإدارة العامة ولجنة الإشراف فقط (لا المشرف/الطالب) */
    showSearch() {
      return this.userRole === ROLES.SUPER_ADMIN || this.userRole === ROLES.COMMITTEE
    },

    /** عنوان الصفحة = اسمها في السايد بار (الإدارة العامة / لجنة الإشراف)، وإلا عنوان المسار */
    pageTitle() {
      const nav = NAV_ITEMS_BY_ROLE[this.userRole] || []
      const item = nav.flatMap((g) => g.items || [g]).find((i) => i.to === this.$route.path)
      return item?.label || this.$route.meta?.title || ''
    },

    titleFirst() {
      return this.pageTitle.split(' ')[0]
    },

    titleRest() {
      return this.pageTitle.split(' ').slice(1).join(' ')
    }
  },

  watch: {
    $route() {
      this.menuOpen = false
      this.titleOpen = false
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
    ...mapActions(useUiStore, ['toggleTheme']),
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
