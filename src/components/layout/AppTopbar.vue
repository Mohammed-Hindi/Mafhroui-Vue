<template>
  <header
    class="sticky top-0 z-sticky-header bg-surface/95 backdrop-blur border-b border-border"
  >
    <div class="flex items-center gap-3 px-4 lg:px-6 py-3">
      <!-- طريقة الإغلاق/الفتح رقم 3: زر ☰ Toggle -->
      <button
        type="button"
        class="lg:hidden grid place-items-center w-icon-btn h-icon-btn rounded-sm border border-border text-text-700 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 transition-colors duration-fast shrink-0"
        :aria-expanded="sidebarOpen"
        aria-controls="app-sidebar"
        aria-label="فتح القائمة"
        @click="toggleSidebar"
      >
        <Menu :size="20" />
      </button>

      <!-- الترحيب في الصفحة الرئيسية — اسم الصفحة في باقي الصفحات -->
      <div class="min-w-0 flex-1">
        <div v-if="isHome" class="flex items-center gap-2.5 min-w-0">
          <h1 class="font-cairo font-bold text-h3 lg:text-h2 text-text-900 truncate">مرحبًا، {{ userName }}</h1>
          <span class="grid place-items-center w-8 h-8 rounded-pill bg-warning-bg text-warning-text shrink-0"><Hand :size="16" /></span>
        </div>
        <h1 v-else class="font-cairo font-bold text-h3 lg:text-h2 text-text-900 truncate">{{ pageTitle }}</h1>
        <p v-if="subtitle" class="text-caption text-text-400 truncate">{{ subtitle }}</p>
      </div>

      <!-- الأدوات -->
      <div class="flex items-center gap-2 shrink-0">
        <SemesterSelect class="hidden sm:block" />
        <button
          type="button"
          class="grid place-items-center w-icon-btn h-icon-btn rounded-sm border border-border text-text-600 hover:-translate-y-px hover:text-primary-700 hover:border-primary-200 transition-all duration-fast"
          :aria-label="isDark ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'"
          :title="isDark ? 'الوضع النهاري' : 'الوضع الليلي'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>
        <NotificationBell />
      </div>
    </div>

    <!-- محدد الفصل بسطر مستقل على الموبايل -->
    <div class="sm:hidden px-4 pb-3">
      <SemesterSelect class="w-full" />
    </div>
  </header>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Menu, Hand, Sun, Moon } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import SemesterSelect from '@/components/shared/SemesterSelect.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'

export default {
  name: 'AppTopbar',

  components: { Menu, Hand, Sun, Moon, SemesterSelect, NotificationBell },

  props: {
    subtitle: {
      type: String,
      default: ''
    }
  },

  computed: {
    ...mapState(useUiStore, ['sidebarOpen', 'isDark']),
    ...mapState(useAuthStore, ['userName']),

    // الصفحة الرئيسية لكل دور مُسمّاة دائمًا "<role>-dashboard" — راجعي ملفات src/router/routes
    isHome() {
      return Boolean(this.$route.name?.endsWith('-dashboard'))
    },

    pageTitle() {
      return this.$route.meta?.title || ''
    }
  },

  methods: {
    ...mapActions(useUiStore, ['toggleSidebar', 'toggleTheme'])
  }
}
</script>
