import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * بيانات محلية بالكامل (placeholder) — لا اتصال بأي باك إند.
 * نفس أسماء state/actions المستخدمة بالصفحات محفوظة عمدًا حتى تبقى القوالب
 * بلا تغيير؛ لاحقًا لاستبدال placeholder = response.data دون لمس أي view.
 */

let nextTeamId = 5
let nextStudentId = 900
let nextDiscussionId = 4

const SEED_DEPARTMENTS = [
  { id: 1, name: 'قسم هندسة الحاسوب' },
  { id: 2, name: 'قسم نظم المعلومات' }
]

const SEED_SPECIALIZATIONS = [
  { id: 1, name: 'تطوير الويب' },
  { id: 2, name: 'الذكاء الاصطناعي' },
  { id: 3, name: 'أمن المعلومات' }
]

const SEED_TEAMS = [
  {
    id: 1,
    name: 'فريق الابتكار',
    specialization_id: 1,
    supervisor: { id: 101, name: 'د. محمد العتيبي', email: 'm.alotaibi@academy.edu.sa', whatsapp: '970599111111' },
    project: { id: 1001, name: 'منصة إدارة مشاريع التخرج', status: 'in_progress' },
    progress: { total: 20, done: 14, percentage: 70 },
    members: [
      { id: 'm1-1', is_leader: true, student: { id: 1, name: 'أحمد الحربي', university_number: '4410001', whatsapp: '970599000001', email: 'ahmed.harbi@academy.edu.sa' } },
      { id: 'm1-2', is_leader: false, student: { id: 2, name: 'سارة عودة', university_number: '4410002', whatsapp: '970599000002', email: 'sara.awda@academy.edu.sa' } },
      { id: 'm1-3', is_leader: false, student: { id: 3, name: 'يوسف النجار', university_number: '4410003', whatsapp: '970599000003', email: 'yousef.najjar@academy.edu.sa' } }
    ]
  },
  {
    id: 2,
    name: 'فريق البيانات',
    specialization_id: 2,
    supervisor: { id: 102, name: 'د. سارة الحربي', email: 's.harbi@academy.edu.sa', whatsapp: '970599111112' },
    project: { id: 1002, name: 'نظام تحليل بيانات الطلاب', status: 'proposed' },
    progress: { total: 20, done: 3, percentage: 15 },
    members: [
      { id: 'm2-1', is_leader: true, student: { id: 4, name: 'فيصل الدوسري', university_number: '4410004', whatsapp: '970599000004', email: 'faisal.dossari@academy.edu.sa' } },
      { id: 'm2-2', is_leader: false, student: { id: 5, name: 'نورة الزهراني', university_number: '4410005', whatsapp: '970599000005', email: 'noura.zahrani@academy.edu.sa' } }
    ]
  },
  {
    id: 3,
    name: 'فريق الأمن السيبراني',
    specialization_id: 3,
    supervisor: { id: 101, name: 'د. محمد العتيبي', email: 'm.alotaibi@academy.edu.sa', whatsapp: '970599111111' },
    project: { id: 1003, name: 'أداة كشف الثغرات الأمنية', status: 'completed' },
    progress: { total: 20, done: 20, percentage: 100 },
    members: [
      { id: 'm3-1', is_leader: true, student: { id: 6, name: 'خالد الغامدي', university_number: '4410006', whatsapp: '970599000006', email: 'khaled.ghamdi@academy.edu.sa' } },
      { id: 'm3-2', is_leader: false, student: { id: 7, name: 'ريم الدوسري', university_number: '4410007', whatsapp: '970599000007', email: 'reem.dossari@academy.edu.sa' } },
      { id: 'm3-3', is_leader: false, student: { id: 8, name: 'ماجد الحربي', university_number: '4410008', whatsapp: '970599000008', email: 'majed.harbi@academy.edu.sa' } }
    ]
  },
  {
    id: 4,
    name: 'فريق أورانج',
    specialization_id: 1,
    supervisor: { id: 103, name: 'د. سلطان الدوسري', email: 'sultan.dosari@academy.edu.sa', whatsapp: '970599111113' },
    project: null,
    progress: { total: 20, done: 0, percentage: 0 },
    members: [
      { id: 'm4-1', is_leader: true, student: { id: 9, name: 'حمزة الحربي', university_number: '4410009', whatsapp: '970599000009', email: 'hamza.harbi@academy.edu.sa' } },
      { id: 'm4-2', is_leader: false, student: { id: 10, name: 'بدر الدوسري', university_number: '4410010', whatsapp: '970599000010', email: 'badr.dossari@academy.edu.sa' } }
    ]
  }
]

const SEED_DISCUSSIONS = [
  {
    id: 1,
    project: { id: 1001, name: 'منصة إدارة مشاريع التخرج' },
    supervisor: { id: 101, name: 'د. محمد العتيبي' },
    department_id: 1,
    specialization_id: 1,
    place: 'قاعة المناقشات 1',
    discussion_date: '2026-08-15',
    discussion_time: '10:00',
    committee: 'د. سارة الحربي، د. يوسف المحطاني',
    whatsapp: '970599111111',
    status: 'pending'
  },
  {
    id: 2,
    project: { id: 1003, name: 'أداة كشف الثغرات الأمنية' },
    supervisor: { id: 101, name: 'د. محمد العتيبي' },
    department_id: 2,
    specialization_id: 3,
    place: 'قاعة المناقشات 2',
    discussion_date: '2026-08-20',
    discussion_time: '12:30',
    committee: 'د. خالد الغامدي، د. رهف الدوسري',
    whatsapp: '970599111112',
    status: 'scheduled'
  }
]

function buildCsv(rows, columns) {
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((col) => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(','))
  return new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
}

/** يحلّل ملف CSV بسيط: name,email,university_number,whatsapp — بلا مكتبات خارجية */
function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean)
      const rows = lines.slice(1)
      const valid = []
      const invalid = []
      rows.forEach((line, index) => {
        const [name, email, universityNumber, whatsapp] = line.split(',').map((v) => v?.trim())
        if (name && email) {
          valid.push({ name, email, university_number: universityNumber || '', whatsapp: whatsapp || '' })
        } else {
          invalid.push({ row: index + 2, errors: ['الاسم أو البريد مفقود'] })
        }
      })
      resolve({ valid, invalid })
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export const useSupervisorStore = defineStore('supervisor', () => {
  const teams = ref([])
  const teamsLoading = ref(false)
  const teamsError = ref(null)

  const teamProgress = ref({})
  const progressLoading = ref(false)
  const progressError = ref(null)

  const discussions = ref([])
  const discussionsLoading = ref(false)
  const discussionsError = ref(null)

  const departments = ref([])
  const specializations = ref([])
  const refDataLoading = ref(false)

  /** طلاب مستوردون عبر Excel (placeholder) بانتظار تعيينهم لفريق */
  const importedStudents = ref([])

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

  function findKnownStudentById(id) {
    const fromTeams = studentsFromTeams.value.find((s) => String(s.id) === String(id))
    if (fromTeams) return fromTeams
    const imported = importedStudents.value.find((s) => String(s.id) === String(id))
    if (imported) return imported
    return { id, name: `طالب #${id}`, university_number: '', whatsapp: '', email: '' }
  }

  const fetchTeams = async () => {
    teamsLoading.value = true
    teamsError.value = null
    if (!teams.value.length) teams.value = SEED_TEAMS.map((t) => ({ ...t }))
    teamsLoading.value = false
    return teams.value
  }

  const createTeam = async (payload) => {
    const supervisor = supervisorsFromTeams.value.find((s) => String(s.id) === String(payload.supervisor_id))
      || { id: payload.supervisor_id, name: 'مشرف جديد' }
    const teamId = nextTeamId++
    const team = {
      id: teamId,
      name: payload.name,
      specialization_id: payload.specialization_id,
      supervisor,
      project: null,
      progress: { total: 0, done: 0, percentage: 0 },
      members: payload.member_ids.map((id) => ({
        id: `m${teamId}-${id}`,
        is_leader: String(id) === String(payload.leader_id),
        student: findKnownStudentById(id)
      }))
    }
    teams.value.push(team)
    return team
  }

  /** معاينة استيراد طلاب من ملف CSV/Excel محلي */
  const previewImport = (formData) => {
    const file = formData.get('file')
    return parseCsvFile(file)
  }

  /** تأكيد استيراد الطلاب — ينشئ حسابات وهمية محليًا */
  const confirmImport = async (payload) => {
    const created = payload.rows.map((row) => {
      const id = nextStudentId++
      const student = { id, name: row.name, email: row.email, university_number: row.university_number, whatsapp: row.whatsapp, specialization_id: payload.specialization_id }
      importedStudents.value.push(student)
      return { user: { id, name: row.name } }
    })
    return { created }
  }

  const fetchAllTeamsProgress = async () => {
    if (!teams.value.length) await fetchTeams()
    progressLoading.value = true
    const map = {}
    teams.value.forEach((team) => { map[team.id] = team.progress })
    teamProgress.value = map
    progressLoading.value = false
    return map
  }

  const exportProgress = async () => {
    const rows = teams.value.map((t) => ({
      المشروع: t.project?.name || '—',
      الفريق: t.name,
      المشرف: t.supervisor?.name || '—',
      'نسبة الإنجاز': `${t.progress?.percentage ?? 0}%`
    }))
    return buildCsv(rows, ['المشروع', 'الفريق', 'المشرف', 'نسبة الإنجاز'])
  }

  const fetchDiscussions = async (params = {}) => {
    discussionsLoading.value = true
    discussionsError.value = null
    if (!discussions.value.length) discussions.value = SEED_DISCUSSIONS.map((d) => ({ ...d }))
    let list = discussions.value
    if (params.department_id) list = list.filter((d) => String(d.department_id) === String(params.department_id))
    if (params.specialization_id) list = list.filter((d) => String(d.specialization_id) === String(params.specialization_id))
    discussionsLoading.value = false
    return list
  }

  const exportDiscussions = async () => {
    const rows = discussions.value.map((d) => ({
      المشروع: d.project?.name || '—',
      المشرف: d.supervisor?.name || '—',
      المكان: d.place,
      التاريخ: d.discussion_date,
      الوقت: d.discussion_time,
      الحالة: d.status
    }))
    return buildCsv(rows, ['المشروع', 'المشرف', 'المكان', 'التاريخ', 'الوقت', 'الحالة'])
  }

  const createDiscussion = async (payload) => {
    const team = teams.value.find((t) => t.project?.id === payload.project_id)
    const discussion = {
      id: nextDiscussionId++,
      project: team?.project || { id: payload.project_id, name: '—' },
      supervisor: team?.supervisor || { id: payload.supervisor_id, name: '—' },
      department_id: team?.department_id || SEED_DEPARTMENTS[0].id,
      specialization_id: team?.specialization_id,
      place: payload.place,
      discussion_date: payload.discussion_date,
      discussion_time: payload.discussion_time,
      committee: payload.committee,
      whatsapp: payload.whatsapp,
      status: payload.status || 'pending'
    }
    discussions.value.push(discussion)
    return discussion
  }

  const fetchRefData = async () => {
    if (departments.value.length) return
    departments.value = SEED_DEPARTMENTS.map((d) => ({ ...d }))
    specializations.value = SEED_SPECIALIZATIONS.map((s) => ({ ...s }))
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
