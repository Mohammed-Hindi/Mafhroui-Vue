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

  return {
    teams,
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
    deleteTeam
  }
})