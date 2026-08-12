import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** إحصائيات لوحة تحكم اللجنة — GET /committee/dashboard-stats، حقيقي (CommitteeDashboardController) */
const DASHBOARD_STATS_ERROR = 'تعذّر تحميل إحصائيات لوحة اللجنة'

export const useCommitteeStore = defineStore('committee', () => {
  const dashboardStats = ref(null)
  const dashboardLoading = ref(false)
  const dashboardError = ref(null)

  /** البطاقات الثلاث بأعلى الداشبورد */
  const summaryCards = computed(() => [
    {
      label: 'المشاريع المكتملة',
      value: dashboardStats.value?.completed_projects ?? null,
      hint: 'مشروع من إجمالي الفصل'
    },
    {
      label: 'عدد الشعب',
      value: dashboardStats.value?.departments_count ?? null,
      hint: 'شعبة دراسية'
    },
    {
      label: 'إجمالي الطلاب',
      value: dashboardStats.value?.students_count ?? null,
      hint: 'طالب مسجل'
    }
  ])

  const averagePercent = computed(() => dashboardStats.value?.average_completion ?? null)

  const statusDistribution = computed(() => {
    const dist = dashboardStats.value?.status_distribution
    if (!dist) return []
    const total = (dist.completed ?? 0) + (dist.in_progress ?? 0) + (dist.proposed ?? 0)
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
    return [
      { status: 'completed', label: 'مكتمل', count: dist.completed ?? 0, percent: pct(dist.completed ?? 0), barClass: 'bg-success' },
      { status: 'in_progress', label: 'قيد التنفيذ', count: dist.in_progress ?? 0, percent: pct(dist.in_progress ?? 0), barClass: 'bg-primary-600' },
      { status: 'proposed', label: 'مقترح', count: dist.proposed ?? 0, percent: pct(dist.proposed ?? 0), barClass: 'bg-warning' }
    ]
  })

  const fetchDashboardStats = async () => {
    dashboardLoading.value = true
    dashboardError.value = null
    try {
      const { data } = await api.get('/committee/dashboard-stats')
      dashboardStats.value = data
      return data
    } catch (err) {
      dashboardError.value = err.normalized?.message || DASHBOARD_STATS_ERROR
      throw err
    } finally {
      dashboardLoading.value = false
    }
  }

  /** جزئي: نعبّي عدد الشعب والطلاب فورًا من /stats العام لحين توفر endpoint اللجنة الكامل */
  const fetchPartialStatsFromPublic = async () => {
    dashboardLoading.value = true
    try {
      const { data } = await api.get('/stats')
      dashboardStats.value = {
        ...dashboardStats.value,
        departments_count: data.departments,
        students_count: data.students
      }
    } catch (err) {
      // نتجاهل هنا لأن الخطأ الأساسي يظهر عبر fetchDashboardStats
    } finally {
      dashboardLoading.value = false
    }
  }

  return {
    dashboardStats,
    dashboardLoading,
    dashboardError,
    summaryCards,
    averagePercent,
    statusDistribution,
    fetchDashboardStats,
    fetchPartialStatsFromPublic
  }
})