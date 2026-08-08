import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'
import { PROJECT_ARCHIVE } from '@/data/projectArchive'
import { SPECIALIZATIONS, DEPARTMENTS } from '@/utils/specializations'

/** أرشيف المشاريع (الفلترة/الترقيم) لسا محلي — لا يوجد API عام لتصفحه بالكامل */

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

const ARCHIVE_PAGE_SIZE = 6

export const useLandingStore = defineStore('landing', () => {
  /* إحصائيات المنصة — GET /stats، حقيقي */
  const stats = ref(null)
  const statsLoading = ref(false)
  const statsError = ref(null)

  /* أفضل المشاريع (اللاندنج + السلايدر) — GET /projects/featured، حقيقي */
  const featured = ref([])
  const featuredTotal = ref(0)
  const featuredLoading = ref(false)
  const featuredError = ref(null)

  /* أرشيف المشاريع (صفحة مستقلة، فلاتر + ترقيم صفحات محليًا) — لا يوجد API عام */
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

  // GET /stats → { departments, teams, projects, supervisors, committee, students }
  const fetchStats = async () => {
    statsLoading.value = true
    statsError.value = null
    try {
      const { data } = await api.get('/stats')
      stats.value = data
      return data
    } catch (err) {
      statsError.value = err.normalized?.message || 'تعذّر تحميل الإحصائيات'
      throw err
    } finally {
      statsLoading.value = false
    }
  }

  // GET /projects/featured → { data: [Project], total, ... }
  const fetchFeaturedProjects = async () => {
    featuredLoading.value = true
    featuredError.value = null
    try {
      const { data } = await api.get('/projects/featured')
      featured.value = data.data || data
      featuredTotal.value = data.total ?? featured.value.length
      return featured.value
    } catch (err) {
      featuredError.value = err.normalized?.message || 'تعذّر تحميل المشاريع المميزة'
      throw err
    } finally {
      featuredLoading.value = false
    }
  }

  /** فلترة وترقيم صفحات محليًا على البيانات الثابتة — لا يوجد API عام للأرشيف الكامل */
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