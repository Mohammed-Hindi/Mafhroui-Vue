<template>
  <div class="min-h-screen flex flex-col lg:flex-row bg-bg">
    <div aria-hidden="true" class="h-[5px] w-full fixed top-0 inset-x-0 z-50 bg-gradient-to-l from-ucas-green via-ucas-teal to-ucas-blue" />
    <AuthBrandPanel />

    <main class="order-2 flex-1 flex items-center justify-center p-6 sm:p-10">
      <div class="w-full max-w-[380px]">
        <router-link to="/" class="flex items-center gap-3 mb-9">
          <span class="grid place-items-center w-[42px] h-[42px] rounded-md bg-gradient-to-bl from-ucas-green to-ucas-blue text-white shadow-[0_6px_14px_-4px_rgba(28,63,140,.4)] shrink-0">
            <AppIcon name="graduation" :size="21" :stroke-width="2.2" />
          </span>
          <span class="font-cairo font-extrabold text-h4 text-text-900">{{ APP_NAME }}</span>
        </router-link>

        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import AuthBrandPanel from '@/components/auth/AuthBrandPanel.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { APP_NAME } from '@/utils/constants'

export default {
  name: 'AuthLayout',
  components: { AuthBrandPanel, AppIcon },
  data() {
    return { APP_NAME }
  }
}
</script>
