import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** إرسال بيانات الدخول الجماعي (بريد/واتساب) وسجل محاولات الإرسال — سوبر أدمن فقط */
export const useNotifyStore = defineStore('notify', () => {
  const deliveries = ref([])
  const deliveriesLoading = ref(false)
  const deliveriesError = ref(null)

  // POST /notify/bulk/preview -> { total, valid_count, invalid_count, sample, invalid }
  const previewBulkNotify = async (userIds, channel) => {
    const { data } = await api.post('/notify/bulk/preview', { user_ids: userIds, channel })
    return data
  }

  // POST /notify/bulk/send -> { dispatched, skipped }
  const sendBulkNotify = async (userIds, channel) => {
    const { data } = await api.post('/notify/bulk/send', { user_ids: userIds, channel })
    return data
  }

  // GET /message-deliveries?context=&status=
  const fetchDeliveries = async (params = {}) => {
    deliveriesLoading.value = true
    deliveriesError.value = null
    try {
      const { data } = await api.get('/message-deliveries', { params })
      deliveries.value = data.data || data
      return deliveries.value
    } catch (err) {
      deliveriesError.value = err.normalized?.message || 'تعذّر تحميل سجلّ الإرسال'
      throw err
    } finally {
      deliveriesLoading.value = false
    }
  }

  // POST /message-deliveries/{id}/retry — الاستجابة بدون علاقة user، نحدّث الحقول المتاحة فقط ونُبقي بيانات العضو المحمّلة سابقًا
  const retryDelivery = async (id) => {
    const { data } = await api.post(`/message-deliveries/${id}/retry`)
    const updated = data.data || data
    const index = deliveries.value.findIndex((d) => d.id === id)
    if (index !== -1) deliveries.value[index] = { ...deliveries.value[index], ...updated }
    return updated
  }

  return {
    deliveries,
    deliveriesLoading,
    deliveriesError,
    previewBulkNotify,
    sendBulkNotify,
    fetchDeliveries,
    retryDelivery
  }
})
