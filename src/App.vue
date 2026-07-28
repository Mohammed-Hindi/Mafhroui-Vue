<template>
  <div id="app-root" dir="rtl">
    <router-view />
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUiStore } from '@/stores/ui.store'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const uiStore = useUiStore()

onMounted(() => {
  if (typeof uiStore.initTheme === 'function') {
    uiStore.initTheme()
  }
})
</script>