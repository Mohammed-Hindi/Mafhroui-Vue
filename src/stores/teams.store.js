import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref([])
  const teamsLoading = ref(false)
  const teamsError = ref(null)

  const specializations = ref([])
  const specializationsLoading = ref(false)
  const specializationsError = ref(null)

  /** اسم التخصص من الـ id — بديل لعرض الرقم مباشرة */
  const specializationName = (id) => {
    const spec = specializations.value.find((s) => s.id === id)
    return spec?.name || 'غير محدد'
  }

  /** الفرق بشكل جاهز للعرض بالصفحة (تسطيح البيانات المتداخلة) */
  const teamsForDisplay = computed(() =>
    teams.value.map((team) => ({
      id: team.id,
      name: team.name,
      spec: specializationName(team.specialization_id),
      sup: team.supervisor?.name || 'غير محدد',
      supId: team.supervisor?.id ?? null,
      projectName: team.project?.name || '',
      projectStatus: team.project?.status || '',
      members: (team.members || []).map((m) => ({
        name: m.student?.name || '',
        uid: m.student?.university_number || '—',
        whats: m.student?.whatsapp || '',
        mail: m.student?.email || '',
        leader: !!m.is_leader
      }))
    }))
  )

  // GET /teams
  const fetchTeams = async () => {
    teamsLoading.value = true
    teamsError.value = null
    try {
      const { data } = await api.get('/teams')
      teams.value = data.data || data
      return teams.value
    } catch (err) {
      teamsError.value = err.normalized?.message || 'تعذّر تحميل الفرق'
      throw err
    } finally {
      teamsLoading.value = false
    }
  }

  // GET /specializations
  const fetchSpecializations = async () => {
    specializationsLoading.value = true
    specializationsError.value = null
    try {
      const { data } = await api.get('/specializations')
      specializations.value = data.data || data
      return specializations.value
    } catch (err) {
      specializationsError.value = err.normalized?.message || 'تعذّر تحميل التخصصات'
      throw err
    } finally {
      specializationsLoading.value = false
    }
  }

  // GET /teams/{id}/progress → { total, done, percentage }
  const fetchTeamProgress = async (id) => {
    const { data } = await api.get(`/teams/${id}/progress`)
    return data
  }

  // PUT /teams/{id}
  const updateTeam = async (id, payload) => {
    const { data } = await api.put(`/teams/${id}`, payload)
    const updated = data.data || data
    const index = teams.value.findIndex((t) => t.id === id)
    if (index !== -1) teams.value[index] = updated
    return updated
  }

  // DELETE /teams/{id}
  const deleteTeam = async (id) => {
    await api.delete(`/teams/${id}`)
    teams.value = teams.value.filter((t) => t.id !== id)
  }

  const tasks = ref([])
  const tasksLoading = ref(false)
  const tasksError = ref(null)

  // GET /teams/{id}/tasks
  const fetchTasks = async (teamId) => {
    tasksLoading.value = true
    tasksError.value = null
    try {
      const { data } = await api.get(`/teams/${teamId}/tasks`)
      tasks.value = data.data || data
      return tasks.value
    } catch (err) {
      tasksError.value = err.normalized?.message || 'تعذّر تحميل المهام'
      throw err
    } finally {
      tasksLoading.value = false
    }
  }

  // POST /teams/{id}/tasks
  const createTask = async (teamId, payload) => {
    const { data } = await api.post(`/teams/${teamId}/tasks`, payload)
    tasks.value.push(data.data || data)
    return data
  }

  // PATCH /tasks/{id}/status
  const changeTaskStatus = async (taskId, status) => {
    const { data } = await api.patch(`/tasks/${taskId}/status`, { status })
    const updated = data.data || data
    const index = tasks.value.findIndex((t) => t.id === taskId)
    if (index !== -1) tasks.value[index] = updated
    return updated
  }

  // DELETE /tasks/{id}
  const deleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`)
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
  }

  // POST /proposals (multipart)
  const submitProposal = async (payload) => {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => form.append(key, value))
    const { data } = await api.post('/proposals', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  // PUT /proposals/{id} (multipart — resubmission after rejection)
  const updateProposal = async (id, payload) => {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => form.append(key, value))
    form.append('_method', 'PUT')
    const { data } = await api.post(`/proposals/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  // يفتح ملف PDF محمي بتوكن — window.open المباشر ما بيقدر يرفق Authorization header
  const openProtectedFile = async (url, fileName) => {
    const response = await api.get(url, { responseType: 'blob' })
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.target = '_blank'
    link.rel = 'noopener'
    if (fileName) link.download = fileName
    link.click()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }

  // POST /projects/{id}/final-reports (multipart)
  const submitFinalReport = async (projectId, payload) => {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== '') form.append(key, value) })
    const { data } = await api.post(`/projects/${projectId}/final-reports`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  return {
    teams,
    tasks,
    tasksLoading,
    tasksError,
    fetchTasks,
    createTask,
    changeTaskStatus,
    deleteTask,
    teamsLoading,
    teamsError,
    specializations,
    specializationsLoading,
    specializationsError,
    teamsForDisplay,
    fetchTeams,
    fetchSpecializations,
    fetchTeamProgress,
    updateTeam,
    deleteTeam,
    submitProposal,
    updateProposal,
    submitFinalReport,
    openProtectedFile
  }
})