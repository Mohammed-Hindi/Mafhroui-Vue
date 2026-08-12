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
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
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

  // GET /academic-terms → [{ id, name, is_current }]
  const fetchSemesters = async () => {
    semestersLoading.value = true
    try {
      const { data } = await api.get('/academic-terms')
      semesters.value = data

      const savedId = localStorage.getItem(STORAGE_KEYS.SEMESTER)
      const stillValid = savedId && data.some((s) => String(s.id) === String(savedId))
      if (!stillValid) {
        const current = data.find((s) => s.is_current) || data[0]
        if (current) setActiveSemester(current.id)
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
