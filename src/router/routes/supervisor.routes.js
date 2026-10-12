import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import DashboardPage from '@/views/supervisor/DashboardPage.vue'
import ProfilePage from '@/views/supervisor/ProfilePage.vue'
import TeamsPage from '@/views/supervisor/TeamsPage.vue'
import ProposalsPage from '@/views/supervisor/ProposalsPage.vue'
import TasksPage from '@/views/supervisor/TasksPage.vue'
import MeetingsPage from '@/views/supervisor/MeetingsPage.vue'
import AppointmentsPage from '@/views/supervisor/AppointmentsPage.vue'
import ProjectArchivePage from '@/views/supervisor/ProjectArchivePage.vue'
import ProjectDetailPage from '@/views/supervisor/ProjectDetailPage.vue'
import ProgressPage from '@/views/supervisor/ProgressPage.vue'
import AssistantPage from '@/views/supervisor/AssistantPage.vue'
import AssignmentsPage from '@/views/supervisor/AssignmentsPage.vue'
import EvaluationsPage from '@/views/supervisor/EvaluationsPage.vue'
import EvaluationSheet from '@/views/super-admin/EvaluationSheet.vue'
import ReportsPage from '@/views/supervisor/ReportsPage.vue'

/** مسارات لوحة المشرف */
export default [
  {
    path: '/supervisor',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPERVISOR] },
    children: [
      {
        path: '',
        name: 'supervisor-dashboard',
        component: DashboardPage,
        meta: { title: 'الرئيسية' }
      },
      {
        path: 'profile',
        name: 'supervisor-profile',
        component: ProfilePage,
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'teams',
        name: 'supervisor-teams',
        component: TeamsPage,
        meta: { title: 'الفرق' }
      },
      {
        path: 'proposals',
        name: 'supervisor-proposals',
        component: ProposalsPage,
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'supervisor-tasks',
        component: TasksPage,
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'assignments',
        name: 'supervisor-assignments',
        component: AssignmentsPage,
        meta: { title: 'الإعلانات والملفات' }
      },
      {
        path: 'evaluations',
        name: 'supervisor-evaluations',
        component: EvaluationsPage,
        meta: { title: 'التقييمات' }
      },
      {
        path: 'evaluations/:teamId(\\d+)',
        name: 'supervisor-evaluation-sheet',
        component: EvaluationSheet,
        meta: { title: 'معايير تقييم المجموعة' }
      },
      {
        path: 'reports',
        name: 'supervisor-reports',
        component: ReportsPage,
        meta: { title: 'تقرير المجموعات' }
      },
      {
        path: 'meetings',
        name: 'supervisor-meetings',
        component: MeetingsPage,
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'appointments',
        name: 'supervisor-appointments',
        component: AppointmentsPage,
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'supervisor-project-archive',
        component: ProjectArchivePage,
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'project-archive/:id',
        name: 'supervisor-project-detail',
        component: ProjectDetailPage,
        meta: { title: 'تفاصيل المشروع' }
      },
      {
        path: 'progress',
        name: 'supervisor-progress',
        component: ProgressPage,
        meta: { title: 'نسبة تقدّم الفرق' }
      },
      {
        path: 'assistant',
        name: 'supervisor-assistant',
        component: AssistantPage,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
