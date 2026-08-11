import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useDiscussionsStore = defineStore('discussions', () => {
  const discussions = ref([])
  const discussionsLoading = ref(false)
  const discussionsError = ref(null)

  // GET /discussions
  const fetchDiscussions = async () => {
    discussionsLoading.value = true
    discussionsError.value = null
    try {
      const { data } = await api.get('/discussions')
      discussions.value = data.data || data
      return discussions.value
    } catch (err) {
      discussionsError.value = err.normalized?.message || 'تعذّر تحميل مواعيد المناقشات'
      throw err
    } finally {
      discussionsLoading.value = false
    }
  }

  // POST /discussions
  const createDiscussion = async (payload) => {
    const { data } = await api.post('/discussions', payload)
    discussions.value.unshift(data)
    return data
  }

  // PUT /discussions/{id}
  const updateDiscussion = async (id, payload) => {
    const { data } = await api.put(`/discussions/${id}`, payload)
    const index = discussions.value.findIndex((d) => d.id === id)
    if (index !== -1) discussions.value[index] = data
    return data
  }

  // DELETE /discussions/{id}
  const deleteDiscussion = async (id) => {
    await api.delete(`/discussions/${id}`)
    discussions.value = discussions.value.filter((d) => d.id !== id)
  }

  // GET /discussions/export (xlsx)
  const exportDiscussionsExcel = async () => {
    const response = await api.get('/discussions/export', { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = 'مواعيد-المناقشات.xlsx'
    link.click()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }

  return {
    discussions,
    discussionsLoading,
    discussionsError,
    fetchDiscussions,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    exportDiscussionsExcel
  }
})
