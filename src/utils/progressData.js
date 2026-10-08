import api from '@/services/api'

/** تسميات موحّدة لصفحات الإدارة العامة */
export const DEGREES = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }
export const GENDERS = { male: 'طالب', female: 'طالبة' }
export const REGIONS = { gaza: 'غزة', south: 'الجنوب' }
export const PROJECT_STATUS = { proposed: 'مقترح', in_progress: 'قيد التنفيذ', completed: 'مكتمل' }
export const TASK_STATUS = { todo: 'لم تبدأ', pending: 'لم تبدأ', in_progress: 'قيد التنفيذ', review: 'قيد المراجعة', done: 'مكتملة' }

/** مستوى شريط التقدّم (لون) */
export const level = (pct) => (pct >= 70 ? 'is-high' : pct >= 35 ? 'is-mid' : 'is-low')

/**
 * GET /progress → مجموعات الفصل بشكل موحّد:
 * { id, name, section, sup: {id,name,whatsapp}, spec, degree, dept, project, members[], tasksTotal, tasksDone, percentage }
 */
export async function fetchGroups() {
  const { data } = await api.get('/progress')
  return (data.data || data).map(({ team, progress }) => {
    const byId = Object.fromEntries((progress?.students || []).map((s) => [s.id, s]))
    return {
      id: team.id,
      name: team.name,
      section: team.section || '',
      sup: { id: team.supervisor?.id ?? null, name: team.supervisor?.name || 'غير محدد', whatsapp: team.supervisor?.whatsapp || '', email: team.supervisor?.email || '' },
      spec: team.specialization?.name || '',
      specId: team.specialization_id,
      degree: team.specialization?.degree || '',
      dept: team.specialization?.department?.name || '',
      project: team.project ? { id: team.project.id, name: team.project.name, status: team.project.status, featured: !!team.project.is_featured } : null,
      tasksTotal: progress?.total ?? 0,
      tasksDone: progress?.done ?? 0,
      percentage: Math.round(progress?.percentage ?? 0),
      members: (team.members || []).map((m) => {
        const p = byId[m.student_id] || {}
        const s = m.student || {}
        return {
          id: m.student_id,
          memberId: m.id,
          name: s.name || '',
          uid: s.university_number || '',
          email: s.email || '',
          whatsapp: s.whatsapp || '',
          gender: s.gender || '',
          region: s.region || '',
          total: p.total ?? 0,
          done: p.done ?? 0,
          percentage: Math.round(p.percentage ?? 0),
          evaluation: p.evaluation ?? null
        }
      })
    }
  })
}
