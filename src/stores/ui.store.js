import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isSidebarOpen = ref(true)
  const isLoading = ref(false)

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const setLoading = (status) => {
    isLoading.value = status
  }

  return {
    isSidebarOpen,
    isLoading,
    toggleSidebar,
    setLoading
  }
})