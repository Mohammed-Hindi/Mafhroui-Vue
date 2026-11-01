import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * مزامنة كشف الطلبة (الإدارة العامة): رفع نسخة UCAS جديدة → معاينة الفرق → حفظ / تراجع خطوة واحدة.
 * الخادم هو مصدر الحقيقة: المعاينة والحفظ يعيدان حساب الفرق، والتراجع يلغي آخر دفعة مطبَّقة.
 */
export const useRosterSyncStore = defineStore('rosterSync', () => {
  const latest = ref(null) // حالة آخر دفعة { summary, status, can_revert, applied_at, original_filename }
  const loading = ref(false)

  // GET /roster/import/latest — لعرض حالة آخر مزامنة وإتاحة زر التراجع
  const fetchLatest = async () => {
    loading.value = true
    try {
      const { data } = await api.get('/roster/import/latest')
      latest.value = data.batch
      return data.batch
    } finally {
      loading.value = false
    }
  }

  // POST /roster/import/preview (multipart) — يحسب الفرق دون أي تغيير
  const preview = async (file) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/roster/import/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  // POST /roster/import/confirm — يطبّق المزامنة ويسجّل دفعة قابلة للتراجع
  const confirm = async (rows, filename) => {
    const { data } = await api.post('/roster/import/confirm', { rows, filename })
    latest.value = data.batch
    return data
  }

  // POST /roster/import/revert — يتراجع عن آخر دفعة مطبَّقة (رجوع خطوة واحدة)
  const revert = async () => {
    const { data } = await api.post('/roster/import/revert')
    latest.value = data.batch
    return data
  }

  return { latest, loading, fetchLatest, preview, confirm, revert }
})
