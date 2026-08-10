import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** إدارة حسابات المشرفين ولجنة الإشراف — خاص بدور super_admin */
export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const usersLoading = ref(false)
  const usersError = ref(null)

  // GET /users?role=committee|supervisor
  const fetchUsers = async (role) => {
    usersLoading.value = true
    usersError.value = null
    try {
      const { data } = await api.get('/users', { params: { role } })
      users.value = data.data || data
      return users.value
    } catch (err) {
      usersError.value = err.normalized?.message || 'تعذّر تحميل الأعضاء'
      throw err
    } finally {
      usersLoading.value = false
    }
  }

  // POST /users -> { user, invite_token, expires_at }
  const createUser = async (payload) => {
    const { data } = await api.post('/users', payload)
    return data
  }

  // PATCH /users/{id}
  const updateUser = async (id, payload) => {
    const { data } = await api.patch(`/users/${id}`, payload)
    const updated = data.data || data
    const index = users.value.findIndex((u) => u.id === id)
    if (index !== -1) users.value[index] = updated
    return updated
  }

  // PATCH /users/{id}/status
  const updateUserStatus = async (id, status) => {
    const { data } = await api.patch(`/users/${id}/status`, { status })
    const updated = data.data || data
    const index = users.value.findIndex((u) => u.id === id)
    if (index !== -1) users.value[index] = updated
    return updated
  }

  // POST /users/{id}/invite -> رابط دعوة جديد (بعد انتهاء صلاحية القديم مثلاً)
  const reinviteUser = async (id) => {
    const { data } = await api.post(`/users/${id}/invite`)
    return data
  }

  // GET /users/{id}/restrictions
  const fetchRestrictions = async (id) => {
    const { data } = await api.get(`/users/${id}/restrictions`)
    return data.data || data
  }

  // POST /users/{id}/restrictions
  const setRestriction = async (id, module, level) => {
    const { data } = await api.post(`/users/${id}/restrictions`, { module, level })
    return data
  }

  // DELETE /restrictions/{id}
  const removeRestriction = async (restrictionId) => {
    await api.delete(`/restrictions/${restrictionId}`)
  }

  return {
    users,
    usersLoading,
    usersError,
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    reinviteUser,
    fetchRestrictions,
    setRestriction,
    removeRestriction
  }
})
