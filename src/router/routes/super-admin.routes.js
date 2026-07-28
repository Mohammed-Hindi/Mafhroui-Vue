import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة السوبر أدمن — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/super-admin',
    component: SuperAdminLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPER_ADMIN] },
    children: [
      {
        path: '',
        name: 'super-admin-dashboard',
        component: () => import('@/views/super-admin/DashboardPage.vue'),
        meta: { title: 'لوحة السوبر أدمن' }
      }
      // تُضاف بقية الصفحات هنا وقت وصفها
    ]
  }
]
