<template>
  <div class="min-h-screen bg-bg flex flex-col">
    <LandingNavBar />
    <main class="flex-1">
      <router-view />
    </main>
    <LandingFooter />
  </div>
</template>

<script setup>
import LandingNavBar from '@/components/landing/LandingNavBar.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
</script>
