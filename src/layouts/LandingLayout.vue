<template>
  <div class="min-h-screen bg-bg flex flex-col">
    <WaterBackground />
    <LandingNavBar />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="transition duration-slow ease-standard"
          enter-from-class="opacity-0 translate-y-1.5 blur-[2px]"
          leave-active-class="transition duration-fast ease-standard"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup>
import LandingNavBar from '@/components/landing/LandingNavBar.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import WaterBackground from '@/components/landing/WaterBackground.vue'
</script>
