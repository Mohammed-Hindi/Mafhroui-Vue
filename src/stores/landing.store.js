import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { PROJECT_ARCHIVE } from '@/data/projectArchive'
import { SPECIALIZATIONS, DEPARTMENTS } from '@/utils/specializations'

/** بيانات ثابتة — لا يوجد باك إند حقيقي، كل سكاشن اللاندنج تعتمد على أرشيف المشاريع المشترك */

const SUP_BY_TEAM = {
  'فريق نوفا': 'د. أحمد الشريف',
  'فريق كوانتم': 'د. سلمى نصار',
  'فريق الابتكار': 'د. أحمد النبريص'
}

function splitSpec(spec) {
  const match = spec.match(/^(.*)\s"(.+)"$/)
  return match ? { program: match[1], degree: match[2] } : { program: spec, degree: '' }
}

function semesterOf(dateStr) {
  const year = Number(dateStr.slice(0, 4))
  return `${year - 1}/${year}-1`
}

const PROJECTS = PROJECT_ARCHIVE.map((p) => {
  const { program, degree } = splitSpec(p.spec)
  return {
    id: p.id,
    title: p.proj,
    description: p.desc,
    dept_name: p.dept,
    program_name: program,
    degree,
    spec: p.spec,
    team_name: p.team,
    grp: p.grp,
    members: p.members,
    supervisor_name: SUP_BY_TEAM[p.team] || 'غير محدد',
    date: p.date,
    semester: semesterOf(p.date)
  }
})

const DEPARTMENT_LIST = DEPARTMENTS.map((name, index) => ({ id: index + 1, name }))

const STATS = {
  projects: PROJECTS.length,
  supervisors: new Set(Object.values(SUP_BY_TEAM)).size,
  students: 42,
  departments: DEPARTMENT_LIST.length,
  teams: new Set(PROJECTS.map((p) => p.team_name)).size,
  avg_completion: 82
}

const ARCHIVE_PAGE_SIZE = 6

export const useLandingStore = defineStore('landing', () => {
  const stats = ref(STATS)
  const statsLoading = ref(false)
  const statsError = ref(null)

  /* أفضل المشاريع (اللاندنج + السلايدر) — كل الأرشيف */
  const featured = ref(PROJECTS)
  const featuredTotal = ref(PROJECTS.length)
  const featuredLoading = ref(false)
  const featuredError = ref(null)

  /* أرشيف المشاريع (صفحة مستقلة، فلاتر + ترقيم صفحات محليًا) */
  const projects = ref(PROJECTS.slice(0, ARCHIVE_PAGE_SIZE))
  const projectsMeta = ref({ current_page: 1, last_page: Math.max(1, Math.ceil(PROJECTS.length / ARCHIVE_PAGE_SIZE)), total: PROJECTS.length })
  const projectsLoading = ref(false)
  const projectsError = ref(null)

  const departments = ref(DEPARTMENT_LIST)
  const departmentsLoading = ref(false)
  const departmentsError = ref(null)

  const heroStats = computed(() => [
    { key: 'projects', label: 'مشروع', value: stats.value?.projects ?? null },
    { key: 'supervisors', label: 'مشرف', value: stats.value?.supervisors ?? null },
    { key: 'students', label: 'طالب', value: stats.value?.students ?? null }
  ])

  const bannerStats = computed(() => [
    { key: 'departments', label: 'قسم', icon: 'monitor', value: stats.value?.departments ?? null },
    { key: 'teams', label: 'فريق', icon: 'teams', value: stats.value?.teams ?? null },
    { key: 'supervisors', label: 'مشرف', icon: 'users', value: stats.value?.supervisors ?? null },
    { key: 'students', label: 'طالب', icon: 'user', value: stats.value?.students ?? null },
    { key: 'projects', label: 'مشروع', icon: 'briefcase', value: stats.value?.projects ?? null }
  ])

  const hasFeatured = computed(() => featured.value.length > 0)

  const authBrandStats = computed(() => [
    { key: 'projects', label: 'مشروع نشط', value: stats.value?.projects ?? null, suffix: '' },
    { key: 'students', label: 'طالب مسجل', value: stats.value?.students ?? null, suffix: '' },
    { key: 'avg_completion', label: 'متوسط الإنجاز', value: stats.value?.avg_completion ?? null, suffix: '%' }
  ])

  const fetchStats = async () => stats.value
  const fetchFeaturedProjects = async () => featured.value

  /** فلترة وترقيم صفحات محليان على البيانات الثابتة */
  const fetchProjects = async (params = {}) => {
    let list = PROJECTS

    if (params.search) {
      const q = String(params.search).toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.supervisor_name.toLowerCase().includes(q))
    }
    if (params.department_id) {
      const dept = DEPARTMENT_LIST.find((d) => String(d.id) === String(params.department_id))
      if (dept) list = list.filter((p) => p.dept_name === dept.name)
    }
    if (params.degree) {
      list = list.filter((p) => p.degree === params.degree)
    }

    const page = Math.max(1, Number(params.page) || 1)
    const start = (page - 1) * ARCHIVE_PAGE_SIZE
    projects.value = list.slice(start, start + ARCHIVE_PAGE_SIZE)
    projectsMeta.value = { current_page: page, last_page: Math.max(1, Math.ceil(list.length / ARCHIVE_PAGE_SIZE)), total: list.length }
    return projects.value
  }

  const fetchDepartments = async () => departments.value

  return {
    stats,
    statsLoading,
    statsError,
    featured,
    featuredTotal,
    featuredLoading,
    featuredError,
    projects,
    projectsMeta,
    projectsLoading,
    projectsError,
    departments,
    departmentsLoading,
    departmentsError,
    heroStats,
    bannerStats,
    hasFeatured,
    authBrandStats,
    fetchStats,
    fetchFeaturedProjects,
    fetchProjects,
    fetchDepartments
  }
})
