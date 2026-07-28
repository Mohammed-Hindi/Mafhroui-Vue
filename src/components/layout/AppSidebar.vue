<template>
  <div>
    <!-- ===== Overlay (الشاشات < lg فقط) ===== -->
    <transition
      enter-active-class="transition-opacity duration-base"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-base"
      leave-to-class="opacity-0"
    >
      <div
        v-if="sidebarOpen && !isDesktop"
        class="fixed inset-0 z-drawer-overlay bg-text-900/50 backdrop-blur-[2px] lg:hidden"
        aria-hidden="true"
        @click="closeSidebar"
      />
    </transition>

    <!-- ===== الشريط الجانبي ===== -->
    <aside
      id="app-sidebar"
      :class="[
        'flex flex-col bg-surface border-l border-border',
        // ثابت بالتخطيط على lg فأعلى
        'lg:sticky lg:top-0 lg:h-screen lg:w-sidebar lg:translate-x-0 lg:shadow-none',
        // Drawer منزلق من اليمين تحت lg
        'fixed top-0 right-0 h-full w-sidebar max-w-[85vw] z-drawer shadow-modal',
        'transition-transform duration-slow ease-standard',
        drawerTranslateClass
      ]"
      :aria-hidden="!isDesktop && !sidebarOpen"
      role="navigation"
      aria-label="القائمة الجانبية"
    >
      <!-- رأس الشريط: الشعار + زر الإغلاق -->
      <div class="flex items-center justify-between gap-3 px-4 h-16 shrink-0 border-b border-border-soft">
        <router-link :to="homeRoute" class="flex items-center gap-3 min-w-0">
          <span
            class="grid place-items-center w-10 h-10 rounded-md shrink-0 bg-gradient-to-bl from-primary-600 to-accent-500 text-white font-cairo font-extrabold"
          >
            م
          </span>
          <span class="min-w-0">
            <span class="block font-cairo font-bold text-h4 text-text-900 truncate">مشاريع التخرج</span>
            <span class="block text-label text-text-400 truncate">{{ roleLabel }}</span>
          </span>
        </router-link>

        <!-- طريقة الإغلاق رقم 2: زر ✕ داخل الشريط -->
        <button
          v-if="!isDesktop"
          type="button"
          class="grid place-items-center w-9 h-9 rounded-sm text-text-600 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-fast lg:hidden"
          aria-label="إغلاق القائمة"
          @click="closeSidebar"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- عناصر التنقل -->
      <nav class="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <template v-for="(group, groupIndex) in normalizedGroups" :key="groupIndex">
          <p
            v-if="group.title"
            class="px-3 pt-4 pb-2 text-label font-semibold text-text-400 tracking-wide first:pt-0"
          >
            {{ group.title }}
          </p>

          <ul class="space-y-1">
            <li v-for="item in group.items" :key="item.to">
              <router-link
                v-slot="{ href, navigate, isActive, isExactActive }"
                :to="item.to"
                custom
              >
                <a
                  :href="href"
                  :class="[
                    'flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium transition-colors duration-fast',
                    (item.exact ? isExactActive : isActive)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-text-700 hover:bg-border-soft hover:text-text-900'
                  ]"
                  :aria-current="(item.exact ? isExactActive : isActive) ? 'page' : undefined"
                  @click="navigate"
                >
                  <component :is="item.icon" v-if="item.icon" :size="19" class="shrink-0" />
                  <span class="flex-1 truncate">{{ item.label }}</span>
                  <span
                    v-if="item.badge"
                    class="shrink-0 min-w-[20px] px-1.5 py-0.5 rounded-pill bg-error text-white text-label font-bold text-center"
                  >
                    {{ item.badge }}
                  </span>
                </a>
              </router-link>
            </li>
          </ul>
        </template>
      </nav>

      <!-- تذييل الشريط: المستخدم + تسجيل الخروج -->
      <div class="shrink-0 border-t border-border-soft p-3">
        <div class="flex items-center gap-3 px-2 py-2 rounded-sm">
          <span
            class="grid place-items-center w-9 h-9 rounded-pill bg-primary-50 text-primary-600 font-cairo font-bold text-caption shrink-0"
          >
            {{ userInitials }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-body-sm font-semibold text-text-900 truncate">{{ userName || '—' }}</span>
            <span class="block text-label text-text-400 truncate">{{ userEmail }}</span>
          </span>
        </div>

        <button
          type="button"
          class="mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-sm font-medium text-text-700 hover:bg-error-bg hover:text-error transition-colors duration-fast"
          @click="handleLogout"
        >
          <LogOut :size="19" class="shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { X, LogOut } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { SIDEBAR_BREAKPOINT } from '@/utils/constants'
import { initials } from '@/utils/formatters'

export default {
  name: 'AppSidebar',

  components: { X, LogOut },

  props: {
    /**
     * إما مصفوفة عناصر مباشرة: [{ label, to, icon, badge, exact }]
     * أو مصفوفة مجموعات: [{ title, items: [...] }]
     */
    navItems: {
      type: Array,
      required: true
    },
    roleLabel: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      resizeTimer: null
    }
  },

  computed: {
    ...mapState(useUiStore, ['sidebarOpen', 'isDesktop']),
    ...mapState(useAuthStore, ['userName', 'userEmail', 'homeRoute']),

    /** توحيد الشكل: عناصر مباشرة → مجموعة واحدة بلا عنوان */
    normalizedGroups() {
      if (!this.navItems.length) return []
      const isGrouped = Object.prototype.hasOwnProperty.call(this.navItems[0], 'items')
      return isGrouped ? this.navItems : [{ title: '', items: this.navItems }]
    },

    /** الانزلاق من اليمين لأن الواجهة RTL */
    drawerTranslateClass() {
      return this.sidebarOpen ? 'translate-x-0' : 'translate-x-full'
    },

    userInitials() {
      return initials(this.userName)
    }
  },

  watch: {
    // إغلاق تلقائي عند تغيّر المسار — مهم جدًا بالموبايل
    $route() {
      this.closeSidebar()
    },

    // منع تمرير الصفحة خلف الـ Drawer وهو مفتوح
    sidebarOpen(isOpen) {
      if (this.isDesktop) return
      document.body.style.overflow = isOpen ? 'hidden' : ''
    }
  },

  mounted() {
    window.addEventListener('resize', this.handleResize)
    document.addEventListener('keydown', this.handleEscape)
    this.handleResize()
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('keydown', this.handleEscape)
    document.body.style.overflow = ''
    clearTimeout(this.resizeTimer)
  },

  methods: {
    ...mapActions(useUiStore, ['closeSidebar', 'setIsDesktop']),
    ...mapActions(useAuthStore, ['logout']),

    handleResize() {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        const isDesktop = window.innerWidth >= SIDEBAR_BREAKPOINT
        if (isDesktop !== this.isDesktop) {
          this.setIsDesktop(isDesktop)
          if (isDesktop) document.body.style.overflow = ''
        }
      }, 120)
    },

    handleEscape(event) {
      if (event.key === 'Escape' && this.sidebarOpen) {
        this.closeSidebar()
      }
    },

    // TODO API — POST /auth/logout | response: 204
    async handleLogout() {
      await this.logout()
      this.$router.push({ name: 'login' })
    }
  }
}
</script>
