import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة قائد الفريق — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/team-leader',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.TEAM_LEADER] },
    children: [
      {
        path: '',
        name: 'team-leader-dashboard',
        component: () => import('@/views/team-leader/ProfilePage.vue'),
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'proposal',
        name: 'team-leader-proposal',
        component: () => import('@/views/team-leader/ProposalPage.vue'),
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'team-leader-tasks',
        component: () => import('@/views/team-leader/TasksPage.vue'),
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'team-leader-meetings',
        component: () => import('@/views/team-leader/MeetingsPage.vue'),
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'assistant',
        name: 'team-leader-assistant',
        component: () => import('@/views/team-leader/AssistantPage.vue'),
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
