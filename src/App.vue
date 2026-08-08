<template>
  <div id="app-root" dir="rtl">
    <ScrollProgressBar />
    <CursorSpotlight />
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar.vue'
import CursorSpotlight from '@/components/shared/CursorSpotlight.vue'

const uiStore = useUiStore()

onMounted(() => {
  if (typeof uiStore.initTheme === 'function') {
    uiStore.initTheme()
  }
})
</script>