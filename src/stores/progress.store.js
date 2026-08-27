import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useProgressStore = defineStore('progress', () => {
  const overview = ref([])
  const overviewLoading = ref(false)
  const overviewError = ref(null)

  // GET /progress — [{ team, progress: { total, done, percentage } }]
  const fetchProgress = async () => {
    overviewLoading.value = true
    overviewError.value = null
    try {
      const { data } = await api.get('/progress')
      overview.value = data.data || data
      return overview.value
    } catch (err) {
      overviewError.value = err.normalized?.message || 'تعذّر تحميل بيانات التقدّم'
      throw err
    } finally {
      overviewLoading.value = false
    }
  }

  // GET /progress/export (xlsx)
  const exportProgressExcel = async () => {
    const response = await api.get('/progress/export', { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'نسبة-تقدم-المشاريع.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }

  return {
    overview,
    overviewLoading,
    overviewError,
    fetchProgress,
    exportProgressExcel
  }
})
