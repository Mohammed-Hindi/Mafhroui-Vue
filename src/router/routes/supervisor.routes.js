import SupervisorLayout from '@/layouts/SupervisorLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة المشرف — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/supervisor',
    component: SupervisorLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPERVISOR] },
    children: [
      {
        path: '',
        name: 'supervisor-dashboard',
        component: () => import('@/views/supervisor/DashboardPage.vue'),
        meta: { title: 'لوحة المشرف' }
      }
      // تُضاف بقية الصفحات هنا وقت وصفها
    ]
  }
]
