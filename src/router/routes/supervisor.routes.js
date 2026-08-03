import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة المشرف — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/supervisor',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPERVISOR] },
    children: [
      {
        path: '',
        name: 'supervisor-dashboard',
        component: () => import('@/views/supervisor/DashboardPage.vue'),
        meta: { title: 'لوحة المشرف' }
      },
      {
        path: 'profile',
        name: 'supervisor-profile',
        component: () => import('@/views/supervisor/ProfilePage.vue'),
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'teams',
        name: 'supervisor-teams',
        component: () => import('@/views/supervisor/TeamsPage.vue'),
        meta: { title: 'الفرق' }
      },
      {
        path: 'proposals',
        name: 'supervisor-proposals',
        component: () => import('@/views/supervisor/ProposalsPage.vue'),
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'supervisor-tasks',
        component: () => import('@/views/supervisor/TasksPage.vue'),
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'supervisor-meetings',
        component: () => import('@/views/supervisor/MeetingsPage.vue'),
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'appointments',
        name: 'supervisor-appointments',
        component: () => import('@/views/supervisor/AppointmentsPage.vue'),
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'supervisor-project-archive',
        component: () => import('@/views/supervisor/ProjectArchivePage.vue'),
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'progress',
        name: 'supervisor-progress',
        component: () => import('@/views/supervisor/ProgressPage.vue'),
        meta: { title: 'نسبة تقدّم الفرق' }
      },
      {
        path: 'assistant',
        name: 'supervisor-assistant',
        component: () => import('@/views/supervisor/AssistantPage.vue'),
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
