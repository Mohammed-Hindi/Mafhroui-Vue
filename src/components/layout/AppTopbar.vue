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

      <!-- الترحيب -->
      <div class="min-w-0 flex-1">
        <h1 class="font-cairo font-bold text-h3 lg:text-h2 text-text-900 truncate">
          {{ greeting }}
        </h1>
        <p v-if="subtitle" class="text-caption text-text-400 truncate">{{ subtitle }}</p>
      </div>

      <!-- الأدوات -->
      <div class="flex items-center gap-2 shrink-0">
        <SemesterSelect class="hidden sm:block" />
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
import { Menu } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import SemesterSelect from '@/components/shared/SemesterSelect.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'

export default {
  name: 'AppTopbar',

  components: { Menu, SemesterSelect, NotificationBell },

  props: {
    subtitle: {
      type: String,
      default: ''
    }
  },

  computed: {
    ...mapState(useUiStore, ['sidebarOpen']),
    ...mapState(useAuthStore, ['userName']),

    greeting() {
      const hour = new Date().getHours()
      const part = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء الخير'
      return this.userName ? `${part}، ${this.userName}` : part
    }
  },

  methods: {
    ...mapActions(useUiStore, ['toggleSidebar'])
  }
}
</script>
