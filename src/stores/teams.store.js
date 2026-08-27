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

  const departments = ref([])
  const departmentsLoading = ref(false)
  const departmentsError = ref(null)

  /** اسم التخصص من الـ id — بديل لعرض الرقم مباشرة */
  const specializationName = (id) => {
    const spec = specializations.value.find((s) => s.id === id)
    return spec?.name || 'غير محدد'
  }

  /** تسطيح فريق واحد بشكل جاهز للعرض — مشتركة بين الفرق النشطة والمحذوفة */
  const mapTeamForDisplay = (team) => ({
    id: team.id,
    name: team.name,
    section: team.section || '',
    spec: specializationName(team.specialization_id),
    sup: team.supervisor?.name || 'غير محدد',
    supId: team.supervisor?.id ?? null,
    projectName: team.project?.name || '',
    projectStatus: team.project?.status || '',
    members: (team.members || []).map((m) => ({
      id: m.student?.id ?? null,
      name: m.student?.name || '',
      uid: m.student?.university_number || '—',
      whats: m.student?.whatsapp || '',
      mail: m.student?.email || '',
      leader: !!m.is_leader
    }))
  })

  /** الفرق بشكل جاهز للعرض بالصفحة (تسطيح البيانات المتداخلة) */
  const teamsForDisplay = computed(() => teams.value.map(mapTeamForDisplay))

  const trashedTeams = ref([])
  const trashedTeamsLoading = ref(false)

  /** الفرق المحذوفة (soft-deleted) بشكل جاهز للعرض */
  const trashedTeamsForDisplay = computed(() => trashedTeams.value.map(mapTeamForDisplay))

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

  // GET /departments
  const fetchDepartments = async () => {
    departmentsLoading.value = true
    departmentsError.value = null
    try {
      const { data } = await api.get('/departments')
      departments.value = data.data || data
      return departments.value
    } catch (err) {
      departmentsError.value = err.normalized?.message || 'تعذّر تحميل الأقسام'
      throw err
    } finally {
      departmentsLoading.value = false
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

  // GET /teams/trashed
  const fetchTrashedTeams = async () => {
    trashedTeamsLoading.value = true
    try {
      const { data } = await api.get('/teams/trashed')
      trashedTeams.value = data.data || data
      return trashedTeams.value
    } finally {
      trashedTeamsLoading.value = false
    }
  }

  // POST /teams/{id}/restore
  const restoreTeam = async (id) => {
    const { data } = await api.post(`/teams/${id}/restore`)
    const restored = data.data || data
    trashedTeams.value = trashedTeams.value.filter((t) => t.id !== id)
    teams.value.unshift(restored)
    return restored
  }

  // POST /teams — { name, supervisor_id, specialization_id, member_ids, leader_id }
  const createTeam = async (payload) => {
    const { data } = await api.post('/teams', payload)
    const created = data.data || data
    teams.value.unshift(created)
    return created
  }

  const replaceTeam = (updated) => {
    const index = teams.value.findIndex((t) => t.id === updated.id)
    if (index !== -1) teams.value[index] = updated
  }

  // POST /teams/{id}/members
  const addTeamMember = async (teamId, studentId) => {
    const { data } = await api.post(`/teams/${teamId}/members`, { student_id: studentId })
    const updated = data.data || data
    replaceTeam(updated)
    return updated
  }

  // DELETE /teams/{id}/members/{memberId}
  const removeTeamMember = async (teamId, memberId) => {
    const { data } = await api.delete(`/teams/${teamId}/members/${memberId}`)
    const updated = data.data || data
    replaceTeam(updated)
    return updated
  }

  // PATCH /teams/{id}/leader
  const updateTeamLeader = async (teamId, studentId) => {
    const { data } = await api.patch(`/teams/${teamId}/leader`, { student_id: studentId })
    const updated = data.data || data
    replaceTeam(updated)
    return updated
  }

  // POST /teams/import/preview (multipart)
  const previewTeamImport = async (file) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/teams/import/preview', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  // POST /teams/import/confirm
  const confirmTeamImport = async (rows, specializationId) => {
    const { data } = await api.post('/teams/import/confirm', { rows, specialization_id: specializationId })
    return data
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

  // DELETE /tasks/{id} (أرشفة — soft delete)
  const deleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`)
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
  }

  // PUT /tasks/{id}
  const updateTask = async (taskId, payload) => {
    const { data } = await api.put(`/tasks/${taskId}`, payload)
    const updated = data.data || data
    const index = tasks.value.findIndex((t) => t.id === taskId)
    if (index !== -1) tasks.value[index] = updated
    return updated
  }

  const trashedTasks = ref([])
  const trashedTasksLoading = ref(false)

  // GET /teams/{id}/tasks/trashed
  const fetchTrashedTasks = async (teamId) => {
    trashedTasksLoading.value = true
    try {
      const { data } = await api.get(`/teams/${teamId}/tasks/trashed`)
      trashedTasks.value = data.data || data
      return trashedTasks.value
    } finally {
      trashedTasksLoading.value = false
    }
  }

  // POST /tasks/{id}/restore
  const restoreTask = async (taskId) => {
    const { data } = await api.post(`/tasks/${taskId}/restore`)
    const restored = data.data || data
    trashedTasks.value = trashedTasks.value.filter((t) => t.id !== taskId)
    tasks.value.push(restored)
    return restored
  }

  const taskNotes = ref({})
  const taskNotesLoading = ref({})

  // GET /tasks/{id}/notes
  const fetchTaskNotes = async (taskId) => {
    taskNotesLoading.value = { ...taskNotesLoading.value, [taskId]: true }
    try {
      const { data } = await api.get(`/tasks/${taskId}/notes`)
      taskNotes.value = { ...taskNotes.value, [taskId]: data.data || data }
      return taskNotes.value[taskId]
    } finally {
      taskNotesLoading.value = { ...taskNotesLoading.value, [taskId]: false }
    }
  }

  // POST /tasks/{id}/notes
  const addTaskNote = async (taskId, note) => {
    await api.post(`/tasks/${taskId}/notes`, { note })
    return fetchTaskNotes(taskId)
  }

  const meetings = ref([])
  const meetingsLoading = ref(false)

  // GET /teams/{id}/meetings
  const fetchMeetings = async (teamId) => {
    meetingsLoading.value = true
    try {
      const { data } = await api.get(`/teams/${teamId}/meetings`)
      meetings.value = data.data || data
      return meetings.value
    } finally {
      meetingsLoading.value = false
    }
  }

  // POST /teams/{id}/meetings
  const createMeeting = async (teamId, payload) => {
    const { data } = await api.post(`/teams/${teamId}/meetings`, payload)
    meetings.value.unshift(data.data || data)
    return data
  }

  // DELETE /meetings/{id}
  const deleteMeeting = async (id) => {
    await api.delete(`/meetings/${id}`)
    meetings.value = meetings.value.filter((m) => m.id !== id)
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

  // POST /proposals/{id}/approve
  const approveProposal = async (id) => {
    const { data } = await api.post(`/proposals/${id}/approve`)
    return data
  }

  // POST /proposals/{id}/reject
  const rejectProposal = async (id, reason) => {
    const { data } = await api.post(`/proposals/${id}/reject`, { rejection_reason: reason })
    return data
  }

  // POST /projects/{id}/final-reports (multipart)
  const submitFinalReport = async (projectId, payload) => {
    const form = new FormData()
    Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined && value !== '') form.append(key, value) })
    const { data } = await api.post(`/projects/${projectId}/final-reports`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return data
  }

  const projectArchive = ref([])
  const projectArchiveLoading = ref(false)

  // GET /projects/archive — مكتملة عبر كل الفصول (لجنة: الكل، مشرف: مشاريعه فقط)
  const fetchProjectArchive = async () => {
    projectArchiveLoading.value = true
    try {
      const { data } = await api.get('/projects/archive')
      projectArchive.value = data.data || data
      return projectArchive.value
    } finally {
      projectArchiveLoading.value = false
    }
  }

  // GET /projects/{id} — يشمل الفصول السابقة أيضًا
  const fetchProject = async (id) => {
    const { data } = await api.get(`/projects/${id}`)
    return data
  }

  // PATCH /projects/{id}
  const updateProject = async (id, payload) => {
    const { data } = await api.patch(`/projects/${id}`, payload)
    const index = projectArchive.value.findIndex((p) => p.id === id)
    if (index !== -1) projectArchive.value[index] = { ...projectArchive.value[index], ...data }
    return data
  }

  return {
    teams,
    specializationName,
    tasks,
    tasksLoading,
    tasksError,
    fetchTasks,
    createTask,
    changeTaskStatus,
    deleteTask,
    updateTask,
    trashedTasks,
    trashedTasksLoading,
    fetchTrashedTasks,
    restoreTask,
    taskNotes,
    taskNotesLoading,
    fetchTaskNotes,
    addTaskNote,
    teamsLoading,
    teamsError,
    specializations,
    specializationsLoading,
    specializationsError,
    departments,
    departmentsLoading,
    departmentsError,
    teamsForDisplay,
    trashedTeams,
    trashedTeamsLoading,
    trashedTeamsForDisplay,
    fetchTrashedTeams,
    restoreTeam,
    fetchTeams,
    fetchSpecializations,
    fetchDepartments,
    fetchTeamProgress,
    updateTeam,
    deleteTeam,
    createTeam,
    addTeamMember,
    removeTeamMember,
    updateTeamLeader,
    previewTeamImport,
    confirmTeamImport,
    submitProposal,
    updateProposal,
    submitFinalReport,
    openProtectedFile,
    approveProposal,
    rejectProposal,
    meetings,
    meetingsLoading,
    fetchMeetings,
    createMeeting,
    deleteMeeting,
    projectArchive,
    projectArchiveLoading,
    fetchProjectArchive,
    fetchProject,
    updateProject
  }
})