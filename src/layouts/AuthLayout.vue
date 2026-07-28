<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-bg">
    <AuthBrandPanel />

    <main class="order-2 flex-1 flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-[380px]">
        <router-link to="/" class="flex items-center gap-3 mb-9">
          <span class="grid place-items-center w-[42px] h-[42px] rounded-md bg-gradient-to-bl from-primary-600 to-accent-500 text-white shadow-[0_6px_14px_-4px_rgba(37,99,235,.4)] shrink-0">
            <AppIcon name="graduation" :size="21" :stroke-width="2.2" />
          </span>
          <span class="font-cairo font-extrabold text-h4 text-text-900">منصة إدارة مشاريع التخرج</span>
        </router-link>

        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import AuthBrandPanel from '@/components/auth/AuthBrandPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'AuthLayout',
  components: { AuthBrandPanel, AppIcon }
}
</script>
