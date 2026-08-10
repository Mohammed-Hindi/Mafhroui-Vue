import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import MembersPage from '@/views/super-admin/MembersPage.vue'

/** مسارات لوحة الإدارة العامة (Super Admin) — إنشاء وإدارة حسابات المشرفين ولجنة الإشراف */
export default [
  {
    path: '/super-admin',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPER_ADMIN] },
    children: [
      {
        path: '',
        name: 'super-admin-members',
        component: MembersPage,
        meta: { title: 'إدارة الأعضاء' }
      }
    ]
  }
]
