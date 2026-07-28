import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * لا توجد بيانات وهمية بهذا الـ store. /projects/featured هو المسار العام
 * الحقيقي الوحيد المتاح (راجعي docs/api-reference.html). الإحصائيات، تصفح
 * كل المشاريع بترقيم صفحات، والأقسام — لا يوجد لها API عام حاليًا، فتُضبط
 * حالة خطأ صريحة فورًا بدل مناداة endpoint غير موجود أو عرض أرقام مصطنعة.
 */
const NO_PUBLIC_STATS_API = 'إحصائيات المنصة العامة غير متوفرة بالباك إند الحالي'
const NO_PUBLIC_DEPARTMENTS_API = 'قائمة الأقسام العامة غير متوفرة بالباك إند الحالي (يتطلب المسار الحقيقي تسجيل دخول)'
const NO_PUBLIC_ARCHIVE_API = 'تصفح كل المشاريع بترقيم صفحات وفلاتر غير متوفر بالباك إند الحالي — المتاح فقط أفضل 6 مشاريع'

export const useLandingStore = defineStore('landing', () => {
  /* إحصائيات المنصة — لا يوجد API عام لها */
  const stats = ref(null)
  const statsLoading = ref(false)
  const statsError = ref(null)

  /* أفضل المشاريع (اللاندنج) — GET /projects/featured، حقيقي */
  const featured = ref([])
  const featuredTotal = ref(0)
  const featuredLoading = ref(false)
  const featuredError = ref(null)

  /* أرشيف المشاريع (صفحة مستقلة) — لا يوجد API عام لتصفح كل المشاريع */
  const projects = ref([])
  const projectsMeta = ref(null)
  const projectsLoading = ref(false)
  const projectsError = ref(null)

  /* الأقسام — لا يوجد API عام لها */
  const departments = ref([])
  const departmentsLoading = ref(false)
  const departmentsError = ref(null)

  /** إحصائيات الهيرو الثلاث بالترتيب الظاهر بالتصميم */
  const heroStats = computed(() => [
    { key: 'projects', label: 'مشروع', value: stats.value?.projects ?? null },
    { key: 'supervisors', label: 'مشرف', value: stats.value?.supervisors ?? null },
    { key: 'students', label: 'طالب', value: stats.value?.students ?? null }
  ])

  /** بطاقات شريط الإحصائيات الخمس */
  const bannerStats = computed(() => [
    { key: 'departments', label: 'قسم', icon: 'monitor', value: stats.value?.departments ?? null },
    { key: 'teams', label: 'فريق', icon: 'teams', value: stats.value?.teams ?? null },
    { key: 'supervisors', label: 'مشرف', icon: 'users', value: stats.value?.supervisors ?? null },
    { key: 'students', label: 'طالب', icon: 'user', value: stats.value?.students ?? null },
    { key: 'projects', label: 'مشروع', icon: 'briefcase', value: stats.value?.projects ?? null }
  ])

  const hasFeatured = computed(() => featured.value.length > 0)

  /** إحصائيات لوحة الهوية بصفحات المصادقة (تسجيل الدخول/استعادة كلمة المرور) */
  const authBrandStats = computed(() => [
    { key: 'projects', label: 'مشروع نشط', value: stats.value?.projects ?? null, suffix: '' },
    { key: 'students', label: 'طالب مسجل', value: stats.value?.students ?? null, suffix: '' },
    { key: 'avg_completion', label: 'متوسط الإنجاز', value: stats.value?.avg_completion ?? null, suffix: '%' }
  ])

  /** لا يوجد endpoint عام للإحصائيات — تُضبط حالة الفجوة فورًا بدل نداء وهمي */
  const fetchStats = async () => {
    statsError.value = NO_PUBLIC_STATS_API
    stats.value = null
    return null
  }

  // GET /projects/featured → { data: [Project], total, current_page, last_page, per_page }
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

  /** لا يوجد endpoint عام لتصفح كل المشاريع بترقيم صفحات — تُضبط حالة الفجوة فورًا */
  const fetchProjects = async () => {
    projectsError.value = NO_PUBLIC_ARCHIVE_API
    projects.value = []
    projectsMeta.value = null
    return []
  }

  /** لا يوجد endpoint عام للأقسام — تُضبط حالة الفجوة فورًا */
  const fetchDepartments = async () => {
    departmentsError.value = NO_PUBLIC_DEPARTMENTS_API
    departments.value = []
    return []
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
