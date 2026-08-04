import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import { STORAGE_KEYS, SIDEBAR_BREAKPOINT } from '@/utils/constants'

let toastSeq = 0

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const isDark = ref(localStorage.getItem(STORAGE_KEYS.THEME) === 'dark')

  const sidebarOpen = ref(false)
  const isDesktop = ref(window.innerWidth >= SIDEBAR_BREAKPOINT)

  const toasts = ref([])

  const semesters = ref([])
  const activeSemesterId = ref(localStorage.getItem(STORAGE_KEYS.SEMESTER) || null)
  const semestersLoading = ref(false)

  const setLoading = (status) => {
    isLoading.value = status
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  const initTheme = () => {
    applyTheme()
  }

  const toggleTheme = () => {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEYS.THEME, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const closeSidebar = () => {
    sidebarOpen.value = false
  }

  const setIsDesktop = (value) => {
    isDesktop.value = value
  }

  const pushToast = ({ type = 'info', message, timeout = 4000 }) => {
    const id = ++toastSeq
    toasts.value.push({ id, type, message })
    if (timeout) setTimeout(() => dismissToast(id), timeout)
    return id
  }

  const dismissToast = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  // GET /semesters | response: [{ id, name, is_active }]
  const fetchSemesters = async () => {
    semestersLoading.value = true
    try {
      const response = await api.get('/semesters')
      semesters.value = response.data
      if (!activeSemesterId.value) {
        const active = semesters.value.find((s) => s.is_active) || semesters.value[0]
        if (active) setActiveSemester(active.id)
      }
      return semesters.value
    } finally {
      semestersLoading.value = false
    }
  }

  const setActiveSemester = (id) => {
    activeSemesterId.value = id
    localStorage.setItem(STORAGE_KEYS.SEMESTER, id)
  }

  return {
    isLoading,
    setLoading,
    isDark,
    initTheme,
    toggleTheme,
    sidebarOpen,
    isDesktop,
    toggleSidebar,
    closeSidebar,
    setIsDesktop,
    toasts,
    pushToast,
    dismissToast,
    semesters,
    activeSemesterId,
    semestersLoading,
    fetchSemesters,
    setActiveSemester
  }
})
