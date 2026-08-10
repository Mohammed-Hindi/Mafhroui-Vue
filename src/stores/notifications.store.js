import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** عنوان عربي مختصر لكل نوع إشعار حقيقي من الباك إند — الرسالة نفسها تحمل التفاصيل الكاملة */
const TYPE_TITLES = {
  task_created: 'مهمة جديدة',
  project_file_uploaded: 'ملف مشروع جديد',
  final_report_uploaded: 'التقرير النهائي',
  task_file_uploaded: 'ملف تسليم جديد',
  discussion_scheduled: 'موعد مناقشة',
  proposal_approved: 'تم اعتماد المقترح',
  proposal_rejected: 'تم رفض المقترح',
  meeting: 'اجتماع جديد',
  meeting_reminder: 'تذكير باجتماع'
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const unreadCount = computed(() => items.value.filter((n) => !n.is_read).length)
  const hasUnread = computed(() => unreadCount.value > 0)
  const latest = computed(() => items.value.slice(0, 6))

  const mapItem = (n) => ({ ...n, title: TYPE_TITLES[n.type] || 'إشعار' })

  // GET /notifications
  const fetchNotifications = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get('/notifications')
      items.value = (data.data || data).map(mapItem)
      return items.value
    } catch (err) {
      error.value = err.normalized?.message || 'تعذّر تحميل الإشعارات'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // POST /notifications/{id}/read
  const markAsRead = async (id) => {
    const item = items.value.find((n) => n.id === id)
    if (!item || item.is_read) return
    item.is_read = true
    try {
      await api.post(`/notifications/${id}/read`)
    } catch (err) {
      item.is_read = false
      throw err
    }
  }

  // POST /notifications/read-all
  const markAllAsRead = async () => {
    const previouslyUnread = items.value.filter((n) => !n.is_read)
    items.value.forEach((n) => { n.is_read = true })
    try {
      await api.post('/notifications/read-all')
    } catch (err) {
      previouslyUnread.forEach((n) => { n.is_read = false })
      throw err
    }
  }

  return {
    items,
    isLoading,
    error,
    unreadCount,
    hasUnread,
    latest,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
})
