import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة الطالب — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/student',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: () => import('@/views/student/ProfilePage.vue'),
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'proposal',
        name: 'student-proposal',
        component: () => import('@/views/student/ProposalPage.vue'),
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'student-tasks',
        component: () => import('@/views/student/TasksPage.vue'),
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'student-meetings',
        component: () => import('@/views/student/MeetingsPage.vue'),
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'assistant',
        name: 'student-assistant',
        component: () => import('@/views/student/AssistantPage.vue'),
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
