import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة لجنة الإشراف — تعيد استخدام صفحات الفرق/المقترحات/المواعيد/الأرشيف/التقدّم من دور المشرف */
export default [
  {
    path: '/committee',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.COMMITTEE] },
    children: [
      {
        path: '',
        name: 'committee-dashboard',
        component: () => import('@/views/committee/DashboardPage.vue'),
        meta: { title: 'لوحة التحكم' }
      },
      {
        path: 'teams',
        name: 'committee-teams',
        component: () => import('@/views/committee/TeamsPage.vue'),
        meta: { title: 'الفرق' }
      },
      {
        path: 'members',
        name: 'committee-members',
        component: () => import('@/views/committee/MembersPage.vue'),
        meta: { title: 'الأعضاء' }
      },
      {
        path: 'proposals',
        name: 'committee-proposals',
        component: () => import('@/views/committee/ProposalsPage.vue'),
        meta: { title: 'المقترحات' }
      },
      {
        path: 'members/deleted',
        name: 'committee-deleted-members',
        component: () => import('@/views/committee/DeletedMembersPage.vue'),
        meta: { title: 'الأعضاء المحذوفون' }
      },
      {
        path: 'appointments',
        name: 'committee-appointments',
        component: () => import('@/views/PlaceholderPage.vue'),
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'committee-project-archive',
        component: () => import('@/views/committee/ProjectArchivePage.vue'),
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'project-archive/:id',
        name: 'committee-project-detail',
        component: () => import('@/views/committee/ProjectDetailPage.vue'),
        meta: { title: 'تفاصيل المشروع' }
      },
      {
        path: 'progress',
        name: 'committee-progress',
        component: () => import('@/views/committee/ProgressPage.vue'),
        meta: { title: 'نسبة تقدّم المشاريع' }
      },
      {
        path: 'add-committee',
        name: 'committee-add-committee',
        component: () => import('@/views/committee/AddCommitteePage.vue'),
        meta: { title: 'إضافة لجنة الإشراف' }
      },
      {
        path: 'assistant',
        name: 'committee-assistant',
        component: () => import('@/views/committee/AssistantPage.vue'),
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
