import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import MembersPage from '@/views/committee/MembersPage.vue'
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
        meta: { title: 'إدارة الأعضاء' }
      },
      {
        path: 'committee',
        name: 'super-admin-committee',
        redirect: { name: 'super-admin-members', query: { kind: 'committee' } },
      },
      {
        path: 'structure',
        name: 'super-admin-structure',
        component: OrgStructurePage,
        meta: { title: 'الأقسام والتخصصات والفصول' }
      },
      {
        path: 'profile',
        name: 'super-admin-profile',
        component: () => import('@/views/super-admin/ProfilePage.vue'),
        meta: { title: 'الملف التعريفي' }
      },
      {
        path: 'assignments',
        name: 'super-admin-assignments',
        component: () => import('@/views/super-admin/AssignmentsPage.vue'),
        meta: { title: 'التكليفات والإعلانات' }
      },
      {
        path: 'credentials',
        name: 'super-admin-credentials',
        component: MembersPage,
        props: { mode: 'credentials' },
        meta: { title: 'إرسال بيانات الدخول' }
      },
      {
        path: 'evaluations',
        name: 'super-admin-evaluations',
        component: () => import('@/views/super-admin/EvaluationsPage.vue'),
        meta: { title: 'التقييمات' }
      },
      {
        path: 'tickets',
        name: 'super-admin-tickets',
        component: () => import('@/views/super-admin/TicketsPage.vue'),
        meta: { title: 'الشكاوى والملاحظات' }
      },
      {
        path: 'change-password',
        name: 'super-admin-change-password',
        component: () => import('@/views/super-admin/ChangePasswordPage.vue'),
        meta: { title: 'تغيير كلمة المرور' }
      }
    ]
  }
]
