// بيانات صفحات الإدارة العامة من الـ API بشكل موحّد تستخدمه الرئيسية والمجموعات والمناقشات والأرشيف
import api from '@/services/api'
import { fetchGroups } from '@/utils/progressData'
import { useUiStore } from '@/stores/ui.store'

const list = (data) => data?.data || data || []
const day = (v) => (v ? String(v).slice(0, 10) : '')

/**
 * مجموعات الفصل الحالي (GET /progress):
 * { id, name, section, degree, spec, specId, supId, supName, project, projectId, projectStatus, type, featured,
 *   members: [{ id, name, gender, region, uni, whatsapp, email, online, total, done, percentage, evaluation }],
 *   done, tasksTotal, percentage }
 */
export async function loadGroups() {
  const groups = await fetchGroups()
  return groups.map((g) => ({
    id: g.id,
    name: g.section ? `شعبة ${g.section}` : g.name,
    teamName: g.name,
    // الشعبة تأتي من ملف الاستيراد؛ المجموعات بلا شعبة تُعرَّف برقمها
    section: g.section || `#${g.id}`,
    degree: g.degree,
    spec: g.spec,
    specId: g.specId,
    dept: g.dept,
    supId: g.sup.id,
    supName: g.sup.name,
    sup: g.sup,
    project: g.project?.name || 'لم يُسجَّل مشروع',
    projectId: g.project?.id ?? null,
    projectStatus: g.project?.status || '',
    // لا يوجد حقل "نوع المشروع" في الخادم — التخصص هو أقرب تصنيف
    type: g.spec,
    featured: !!g.project?.featured,
    done: g.tasksDone,
    tasksTotal: g.tasksTotal,
    percentage: g.percentage,
    members: g.members.map((m) => ({ ...m, uni: m.uid, online: false }))
  }))
}

/** المشرفون (GET /users?role=supervisor) مع اسم تخصص كل مشرف، ويُضاف أي مشرف ظهر في المجموعات ولم يرد بالقائمة */
export async function loadSupervisors(groups = []) {
  const [users, specs] = await Promise.allSettled([api.get('/users', { params: { role: 'supervisor' } }), api.get('/specializations')])
  const specName = Object.fromEntries(list(specs.value?.data).map((s) => [s.id, s.name]))
  const map = new Map()
  list(users.value?.data).forEach((u) => map.set(u.id, {
    id: u.id, name: u.name, email: u.email, whatsapp: u.whatsapp, employee_number: u.employee_number,
    spec: specName[u.specialization_id] || ''
  }))
  groups.forEach((g) => {
    if (g.supId && !map.has(g.supId)) map.set(g.supId, { id: g.supId, name: g.supName, email: g.sup.email, whatsapp: g.sup.whatsapp, spec: g.spec })
    const s = map.get(g.supId)
    if (s && !s.spec) s.spec = g.spec
  })
  return [...map.values()]
}

/** حالة المهمة: done | late | open */
export function taskState(t) {
  if (t.status === 'done') return 'done'
  return t.due && t.due < day(new Date().toISOString()) ? 'late' : 'open'
}

/** آخر المهام الموكلة (من GET /committee/dashboard-stats) بشكل موحّد */
export function normalizeTasks(raw = []) {
  return raw.map((t) => {
    const task = {
      id: t.id,
      groupId: t.team?.id ?? t.team_id,
      title: t.title,
      assignees: (t.assignees || []).map((a) => a.id),
      assigneeNames: (t.assignees || []).map((a) => a.name),
      issued: day(t.created_at),
      due: day(t.due_date),
      status: t.status
    }
    return { ...task, state: taskState(task) }
  })
}

export async function loadDashboardStats() {
  const { data } = await api.get('/committee/dashboard-stats')
  return data
}

/** مهام وإعلانات مجموعة واحدة (تُجلب عند فتح تفاصيلها) */
export async function loadGroupTimeline(groupId) {
  const [tasks, ann] = await Promise.allSettled([api.get(`/teams/${groupId}/tasks`), api.get(`/teams/${groupId}/announcements`)])
  return {
    tasks: list(tasks.value?.data).map((t) => ({ ...t, issued: day(t.created_at), due: day(t.due_date) })),
    announcements: list(ann.value?.data)
  }
}

export async function loadDiscussions() {
  const { data } = await api.get('/discussions')
  return list(data)
}

/** جنس المجموعة (المجموعات أحادية الجنس عادةً) — من أول عضو */
export const groupGender = (g) => g.members[0]?.gender || 'male'

/** المنطقة الغالبة لأعضاء المجموعة */
export const groupRegion = (g) => {
  const south = g.members.filter((m) => m.region === 'south').length
  return south > g.members.length / 2 ? 'south' : 'gaza'
}

/** اسم الفصل الدراسي النشط (من قائمة الفصول في الشريط العلوي) */
export function activeSemesterName() {
  const ui = useUiStore()
  return ui.semesters.find((s) => String(s.id) === String(ui.activeSemesterId))?.name || ui.semesters.find((s) => s.is_current)?.name || 'الفصل الدراسي الحالي'
}

// رموز مساق مشروع التخرج في ترويسة كشف الشعبة — لا يوجد حقل لها في الخادم
export const COURSES = { diploma: { code: 'DMED 2318', name: 'مشروع تخرج' }, bachelor: { code: 'BMED 4318', name: 'مشروع تخرج' } }
