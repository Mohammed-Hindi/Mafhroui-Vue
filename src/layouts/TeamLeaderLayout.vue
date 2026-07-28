<template>
  <div class="min-h-screen bg-bg flex">
    <AppSidebar :nav-items="navItems" role-label="قائد الفريق" />

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
import { LayoutDashboard, Users, ListTodo, Upload } from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

export default {
  name: 'TeamLeaderLayout',

  components: { AppSidebar, AppTopbar },

  data() {
    return {
      /**
       * عناصر التنقل — تُوسَّع كلما وُصفت صفحة جديدة.
       * الشكل: { label, to, icon, exact } أو مجموعات { title, items: [] }
       */
      navItems: [
        { label: 'لوحة المعلومات', to: '/team-leader', icon: LayoutDashboard, exact: true }
        // تُضاف بقية العناصر مع كل صفحة تُوصف
      ]
    }
  }
}
</script>
