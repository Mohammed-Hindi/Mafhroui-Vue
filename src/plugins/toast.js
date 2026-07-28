import { useUiStore } from '@/stores/ui.store'

/**
 * يوفّر this.$toast داخل أي مكوّن Options API.
 * يكتب على ui.store، و ToastContainer.vue يعرض القائمة.
 */
export default {
  install(app) {
    const toast = {
      success: (message, timeout) => useUiStore().pushToast({ type: 'success', message, timeout }),
      error: (message, timeout) => useUiStore().pushToast({ type: 'error', message, timeout }),
      warning: (message, timeout) => useUiStore().pushToast({ type: 'warning', message, timeout }),
      info: (message, timeout) => useUiStore().pushToast({ type: 'info', message, timeout })
    }
    app.config.globalProperties.$toast = toast
  }
}
