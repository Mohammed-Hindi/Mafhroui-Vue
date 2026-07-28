import TeamLeaderLayout from '@/layouts/TeamLeaderLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة قائد الفريق — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/team-leader',
    component: TeamLeaderLayout,
    meta: { requiresAuth: true, roles: [ROLES.TEAM_LEADER] },
    children: [
      {
        path: '',
        name: 'team-leader-dashboard',
        component: () => import('@/views/team-leader/DashboardPage.vue'),
        meta: { title: 'لوحة قائد الفريق' }
      }
      // تُضاف بقية الصفحات هنا وقت وصفها
    ]
  }
]
