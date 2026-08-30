import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import MembersPage from '@/views/super-admin/MembersPage.vue'
import CommitteeMembersPage from '@/views/super-admin/CommitteeMembersPage.vue'
import OrgStructurePage from '@/views/super-admin/OrgStructurePage.vue'

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
        meta: { title: 'الأعضاء وبيانات الدخول' }
      },
      {
        path: 'committee',
        name: 'super-admin-committee',
        component: CommitteeMembersPage,
        meta: { title: 'إضافة لجنة الإشراف' }
      },
      {
        path: 'structure',
        name: 'super-admin-structure',
        component: OrgStructurePage,
        meta: { title: 'الأقسام والتخصصات والفصول' }
      }
    ]
  }
]
