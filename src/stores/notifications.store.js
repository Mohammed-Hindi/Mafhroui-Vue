import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/** بيانات ثابتة — بانتظار GET /notifications */
const NOTIFICATIONS = [
  { id: 1, title: 'تم اعتماد المقترح', body: 'وافق المشرف على مقترح فريقك، يمكنكم البدء بمراحل التطوير.', type: 'success', is_read: false, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: 2, title: 'موعد اجتماع جديد', body: 'تمت جدولة اجتماع مراجعة المتطلبات يوم الثلاثاء الساعة 2:00م.', type: 'info', is_read: false, created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { id: 3, title: 'تذكير بالتسليم', body: 'تبقّى 3 أيام على الموعد النهائي لتسليم التقرير النهائي.', type: 'warning', is_read: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, title: 'مهمة جديدة', body: 'تمت إضافة مهمة جديدة إلى لوحة Kanban الخاصة بفريقك.', type: 'info', is_read: true, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, title: 'تعليق على التقرير', body: 'أضاف المشرف ملاحظات على الفصل الثاني من التقرير — راجعوها قبل الإعادة.', type: 'info', is_read: true, created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
]

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([...NOTIFICATIONS])
  const unreadCount = ref(NOTIFICATIONS.filter((n) => !n.is_read).length)
  const isLoading = ref(false)
  const error = ref(null)

  const hasUnread = computed(() => unreadCount.value > 0)
  const latest = computed(() => items.value.slice(0, 6))

  // بيانات ثابتة محليًا (NOTIFICATIONS) بانتظار GET /notifications الفعلي من الباك إند
  const fetchNotifications = async () => {
    isLoading.value = true
    try {
      items.value = [...NOTIFICATIONS]
      return items.value
    } finally {
      isLoading.value = false
    }
  }

  const fetchUnreadCount = async () => {
    unreadCount.value = items.value.filter((n) => !n.is_read).length
  }

  const markAsRead = async (id) => {
    const item = items.value.find((n) => n.id === id)
    if (item && !item.is_read) {
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  const markAllAsRead = async () => {
    items.value.forEach((n) => { n.is_read = true })
    unreadCount.value = 0
  }

  const reset = () => {
    items.value = [...NOTIFICATIONS]
    unreadCount.value = NOTIFICATIONS.filter((n) => !n.is_read).length
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
