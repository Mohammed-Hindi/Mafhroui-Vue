import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

export const DEGREE_LABELS = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }

export const DEGREE_OPTIONS = [
  { value: 'diploma', label: DEGREE_LABELS.diploma },
  { value: 'bachelor', label: DEGREE_LABELS.bachelor }
]

function mapProject(p) {
  const degree = DEGREE_LABELS[p.specialization?.degree] || ''
  const program = p.specialization?.name || ''

  return {
    id: p.id,
    title: p.name,
    description: p.description,
    dept_name: p.department?.name || '',
    department_id: p.department?.id ?? null,
    program_name: program,
    degree,
    spec: degree ? `${program} "${degree}"` : program,
    team_name: p.team_name || '',
    members: Array.isArray(p.members) ? p.members.join('، ') : '',
    supervisor_name: p.supervisor_name || 'غير محدد',
    date: p.completed_at || '',
    semester: p.term || ''
  }
}

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

  /* أرشيف المشاريع المكتملة (صفحة مستقلة، فلاتر + ترقيم صفحات حقيقيين) — GET /projects/public-archive */
  const projects = ref([])
  const projectsMeta = ref({ current_page: 1, last_page: 1, total: 0 })
  const projectsLoading = ref(false)
  const projectsError = ref(null)

  /* تفاصيل مشروع واحد من الأرشيف العام — GET /projects/public-archive/{id} */
  const currentProject = ref(null)
  const currentProjectLoading = ref(false)
  const currentProjectError = ref(null)

  /* الأقسام — GET /departments/public، حقيقي */
  const departments = ref([])
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

  // GET /projects/featured
  const fetchFeaturedProjects = async () => {
    featuredLoading.value = true
    featuredError.value = null
    try {
      const { data } = await api.get('/projects/featured')
      const rows = data.data || data
      featured.value = rows.map(mapProject)
      featuredTotal.value = data.total ?? featured.value.length
      return featured.value
    } catch (err) {
      featuredError.value = err.normalized?.message || 'تعذّر تحميل المشاريع المميزة'
      throw err
    } finally {
      featuredLoading.value = false
    }
  }

  // GET /projects/public-archive?search=&department_id=&degree=&page=
  const fetchArchive = async (params = {}) => {
    projectsLoading.value = true
    projectsError.value = null
    try {
      const { data } = await api.get('/projects/public-archive', {
        params: {
          search: params.search || undefined,
          department_id: params.department_id || undefined,
          degree: params.degree || undefined,
          page: params.page || 1
        }
      })
      projects.value = (data.data || []).map(mapProject)
      projectsMeta.value = {
        current_page: data.current_page ?? 1,
        last_page: data.last_page ?? 1,
        total: data.total ?? projects.value.length
      }
      return projects.value
    } catch (err) {
      projectsError.value = err.normalized?.message || 'تعذّر تحميل أرشيف المشاريع'
      throw err
    } finally {
      projectsLoading.value = false
    }
  }

  // GET /projects/public-archive/{id}
  const fetchProjectById = async (id) => {
    currentProjectLoading.value = true
    currentProjectError.value = null
    currentProject.value = null
    try {
      const { data } = await api.get(`/projects/public-archive/${id}`)
      currentProject.value = mapProject(data)
      return currentProject.value
    } catch (err) {
      currentProjectError.value = err.normalized?.message || 'تعذّر تحميل بيانات المشروع'
      throw err
    } finally {
      currentProjectLoading.value = false
    }
  }

  // GET /departments/public
  const fetchDepartments = async () => {
    departmentsLoading.value = true
    departmentsError.value = null
    try {
      const { data } = await api.get('/departments/public')
      departments.value = data
      return departments.value
    } catch (err) {
      departmentsError.value = err.normalized?.message || 'تعذّر تحميل الأقسام'
      throw err
    } finally {
      departmentsLoading.value = false
    }
  }

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
    currentProject,
    currentProjectLoading,
    currentProjectError,
    departments,
    departmentsLoading,
    departmentsError,
    heroStats,
    bannerStats,
    hasFeatured,
    authBrandStats,
    fetchStats,
    fetchFeaturedProjects,
    fetchArchive,
    fetchProjectById,
    fetchDepartments
  }
})
