import { ref } from 'vue'
import { defineStore } from 'pinia'
import { STORAGE_KEYS, SIDEBAR_BREAKPOINT } from '@/utils/constants'

let toastSeq = 0

/** بيانات ثابتة — بانتظار GET /semesters */
const SEMESTERS = (() => {
  const list = []
  for (let year = 2026; year <= 2029; year++) {
    list.push({ id: `${year}-1`, name: `الفصل الأول ${year}/${year + 1}`, is_active: year === 2026 })
    list.push({ id: `${year}-2`, name: `الفصل الثاني ${year}/${year + 1}`, is_active: false })
  }
  return list
})()

export const useUiStore = defineStore('ui', () => {
  const isLoading = ref(false)
  const isDark = ref(localStorage.getItem(STORAGE_KEYS.THEME) === 'dark')

  const sidebarOpen = ref(false)
  const isDesktop = ref(window.innerWidth >= SIDEBAR_BREAKPOINT)

  const toasts = ref([])

  const semesters = ref(SEMESTERS)
  // الفصل الحالي محدَّد افتراضيًا فور تشغيل المتجر (بيانات ثابتة، لا حاجة لانتظار fetchSemesters)
  const activeSemesterId = ref(
    localStorage.getItem(STORAGE_KEYS.SEMESTER) || SEMESTERS.find((s) => s.is_active)?.id || SEMESTERS[0]?.id || null
  )
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

  // بيانات ثابتة محليًا (SEMESTERS) بانتظار GET /semesters الفعلي من الباك إند
  const fetchSemesters = async () => {
    if (!activeSemesterId.value) {
      const active = semesters.value.find((s) => s.is_active) || semesters.value[0]
      if (active) setActiveSemester(active.id)
    }
    return semesters.value
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
