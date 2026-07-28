import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * ملاحظة مهمة: لا توجد بيانات وهمية بهذا الـ store إطلاقًا. كل state هنا يقابل
 * endpoint حقيقي موثّق بـ docs/api-reference.html. الميزات التي لا يدعمها الباك
 * إند حاليًا (لوحة تحكم مجمّعة، قائمة مقترحات، إدارة أعضاء) لا حالة لها هنا —
 * الصفحات المعنية تعرض رسالة فجوة صريحة بدل تحميل بلا نهاية أو بيانات مصطنعة.
 */
export const useCommitteeStore = defineStore('committee', () => {
  /* الفرق — GET /teams، تُشتق منها لوحة التحكم/الأعضاء/الأرشيف محليًا */
  const teams = ref([])
  const teamsLoading = ref(false)
  const teamsError = ref(null)

  /* نسبة تقدّم كل فريق — GET /teams/:id/progress، طلب منفصل لكل فريق */
  const teamProgress = ref({}) // { [teamId]: { total, done, percentage } }
  const progressLoading = ref(false)
  const progressError = ref(null)

  /* مواعيد المناقشات — GET /discussions */
  const discussions = ref([])
  const discussionsLoading = ref(false)
  const discussionsError = ref(null)

  /* قوائم مرجعية للفلاتر */
  const departments = ref([])
  const specializations = ref([])
  const refDataLoading = ref(false)

  /** الطلاب مشتقّون من أعضاء كل الفرق — لا يوجد endpoint مستقل لقائمة الطلاب */
  const studentsFromTeams = computed(() => {
    const seen = new Map()
    teams.value.forEach((team) => {
      team.members?.forEach((member) => {
        const student = member.student
        if (student && !seen.has(student.id)) {
          seen.set(student.id, { ...student, teamId: team.id, teamName: team.name, isLeader: member.is_leader })
        }
      })
    })
    return [...seen.values()]
  })

  /** المشرفون مشتقّون من مشرف كل فريق — لا يوجد endpoint مستقل لقائمة المشرفين */
  const supervisorsFromTeams = computed(() => {
    const seen = new Map()
    teams.value.forEach((team) => {
      if (team.supervisor && !seen.has(team.supervisor.id)) {
        seen.set(team.supervisor.id, { ...team.supervisor, teamCount: 0 })
      }
      if (team.supervisor) seen.get(team.supervisor.id).teamCount += 1
    })
    return [...seen.values()]
  })

  // GET /teams?term_id=
  const fetchTeams = async (params = {}) => {
    teamsLoading.value = true
    teamsError.value = null
    try {
      const { data } = await api.get('/teams', { params })
      teams.value = data.data || data
      return teams.value
    } catch (err) {
      teamsError.value = err.normalized?.message || 'تعذّر تحميل الفرق'
      throw err
    } finally {
      teamsLoading.value = false
    }
  }

  // POST /teams  body: { name, supervisor_id, specialization_id, member_ids, leader_id }
  const createTeam = async (payload) => {
    const { data } = await api.post('/teams', payload)
    const team = data.data || data
    teams.value.push(team)
    return team
  }

  // POST /teams/import/preview  body: FormData{ file }
  const previewImport = (formData) => {
    return api.post('/teams/import/preview', formData).then((res) => res.data)
  }

  // POST /teams/import/confirm  body: { specialization_id, rows }
  const confirmImport = (payload) => {
    return api.post('/teams/import/confirm', payload).then((res) => res.data)
  }

  /**
   * نسبة تقدّم كل الفرق — لا يوجد endpoint جماعي، فنكرر GET /teams/:id/progress
   * لكل فريق (بالتوازي). مخصّصة لصفحة "نسبة تقدّم المشاريع" فقط.
   */
  const fetchAllTeamsProgress = async () => {
    if (!teams.value.length) await fetchTeams().catch(() => {})
    progressLoading.value = true
    progressError.value = null
    try {
      const results = await Promise.allSettled(
        teams.value.map((team) => api.get(`/teams/${team.id}/progress`).then((res) => [team.id, res.data.data || res.data]))
      )
      const map = {}
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const [teamId, progress] = result.value
          map[teamId] = progress
        }
      })
      teamProgress.value = map
      return map
    } catch (err) {
      progressError.value = err.normalized?.message || 'تعذّر تحميل نسبة التقدّم'
      throw err
    } finally {
      progressLoading.value = false
    }
  }

  // GET /progress/export → تنزيل مباشر
  const exportProgress = async () => {
    const { data } = await api.get('/progress/export')
    return data
  }

  // GET /discussions?department_id=&specialization_id=
  const fetchDiscussions = async (params = {}) => {
    discussionsLoading.value = true
    discussionsError.value = null
    try {
      const { data } = await api.get('/discussions', { params })
      discussions.value = Array.isArray(data) ? data : (data.data || [])
      return discussions.value
    } catch (err) {
      discussionsError.value = err.normalized?.message || 'تعذّر تحميل مواعيد المناقشات'
      throw err
    } finally {
      discussionsLoading.value = false
    }
  }

  // GET /discussions/export → تنزيل مباشر
  const exportDiscussions = async () => {
    const { data } = await api.get('/discussions/export')
    return data
  }

  // POST /discussions
  const createDiscussion = async (payload) => {
    const { data } = await api.post('/discussions', payload)
    const discussion = data.data || data
    discussions.value.push(discussion)
    return discussion
  }

  const fetchRefData = async () => {
    if (departments.value.length || refDataLoading.value) return
    refDataLoading.value = true
    try {
      const [deptRes, specRes] = await Promise.all([
        api.get('/departments'),
        api.get('/specializations')
      ])
      departments.value = deptRes.data.data || deptRes.data
      specializations.value = specRes.data.data || specRes.data
    } catch (_) {
      // الفلاتر تبقى فارغة بصمت — ليست بيانات جوهرية للصفحة
    } finally {
      refDataLoading.value = false
    }
  }

  return {
    teams,
    teamsLoading,
    teamsError,
    teamProgress,
    progressLoading,
    progressError,
    discussions,
    discussionsLoading,
    discussionsError,
    departments,
    specializations,
    refDataLoading,
    studentsFromTeams,
    supervisorsFromTeams,
    fetchTeams,
    createTeam,
    previewImport,
    confirmImport,
    fetchAllTeamsProgress,
    exportProgress,
    fetchDiscussions,
    exportDiscussions,
    createDiscussion,
    fetchRefData
  }
})
