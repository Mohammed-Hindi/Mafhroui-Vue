import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** إدارة الحسابات — سوبر أدمن (مشرفين/لجنة) ولجنة الإشراف (طلاب/قادة فرق/مشرفين) */
export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const usersLoading = ref(false)
  const usersError = ref(null)

  // GET /users?role=committee|supervisor|student&unassigned=1
  const fetchUsers = async (role, params = {}) => {
    usersLoading.value = true
    usersError.value = null
    try {
      const { data } = await api.get('/users', { params: { role, ...params } })
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

  // PATCH /users/{id}/status — reason إلزامي عند status=restricted
  const updateUserStatus = async (id, status, reason = null) => {
    const { data } = await api.patch(`/users/${id}/status`, { status, reason })
    const updated = data.data || data
    const index = users.value.findIndex((u) => u.id === id)
    if (index !== -1) users.value[index] = updated
    return updated
  }

  // DELETE /users/{id} — سوفت ديليت مع سبب إلزامي
  const deleteUser = async (id, reason) => {
    await api.delete(`/users/${id}`, { data: { reason } })
    users.value = users.value.filter((u) => u.id !== id)
  }

  const trashedUsers = ref([])
  const trashedUsersLoading = ref(false)

  // GET /users/trashed?role=
  const fetchTrashedUsers = async (role) => {
    trashedUsersLoading.value = true
    try {
      const { data } = await api.get('/users/trashed', { params: { role } })
      trashedUsers.value = data.data || data
      return trashedUsers.value
    } finally {
      trashedUsersLoading.value = false
    }
  }

  // POST /users/{id}/restore
  const restoreUser = async (id) => {
    const { data } = await api.post(`/users/${id}/restore`)
    const restored = data.data || data
    trashedUsers.value = trashedUsers.value.filter((u) => u.id !== id)
    return restored
  }

  // POST /users/{id}/set-password -> { password }
  const setUserPassword = async (id) => {
    const { data } = await api.post(`/users/${id}/set-password`)
    return data.password
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

  // POST /users/{id}/restrictions — reason إلزامي
  const setRestriction = async (id, module, level, reason) => {
    const { data } = await api.post(`/users/${id}/restrictions`, { module, level, reason })
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
    deleteUser,
    trashedUsers,
    trashedUsersLoading,
    fetchTrashedUsers,
    restoreUser,
    setUserPassword,
    reinviteUser,
    fetchRestrictions,
    setRestriction,
    removeRestriction
  }
})
