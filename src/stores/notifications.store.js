import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref(null)

  const hasUnread = computed(() => unreadCount.value > 0)
  const latest = computed(() => items.value.slice(0, 6))

  // TODO API — GET /notifications?page=1
  // response: { data: [{ id, title, body, type, is_read, created_at }], meta }
  const fetchNotifications = async (params = {}) => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get('/notifications', { params })
      items.value = data.data || data
      return items.value
    } catch (err) {
      error.value = err.normalized?.message || 'تعذّر تحميل الإشعارات'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // TODO API — GET /notifications/unread-count | response: { count }
  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      unreadCount.value = data.count ?? 0
    } catch (_) {
      unreadCount.value = 0
    }
  }

  // TODO API — POST /notifications/:id/read | response: 204
  const markAsRead = async (id) => {
    await api.post(`/notifications/${id}/read`)
    const item = items.value.find((n) => n.id === id)
    if (item && !item.is_read) {
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  // TODO API — POST /notifications/read-all | response: 204
  const markAllAsRead = async () => {
    await api.post('/notifications/read-all')
    items.value.forEach((n) => {
      n.is_read = true
    })
    unreadCount.value = 0
  }

  const reset = () => {
    items.value = []
    unreadCount.value = 0
  }

  return {
    items,
    unreadCount,
    isLoading,
    error,
    hasUnread,
    latest,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    reset
  }
})
