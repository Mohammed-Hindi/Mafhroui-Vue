import CommitteeLayout from '@/layouts/CommitteeLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة لجنة الإشراف — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/committee',
    component: CommitteeLayout,
    meta: { requiresAuth: true, roles: [ROLES.COMMITTEE] },
    children: [
      {
        path: '',
        name: 'committee-dashboard',
        component: () => import('@/views/committee/DashboardPage.vue'),
        meta: { title: 'لوحة لجنة الإشراف' }
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
        path: 'appointments',
        name: 'committee-appointments',
        component: () => import('@/views/committee/AppointmentsPage.vue'),
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'committee-project-archive',
        component: () => import('@/views/committee/ProjectArchivePage.vue'),
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'progress',
        name: 'committee-progress',
        component: () => import('@/views/committee/ProgressPage.vue'),
        meta: { title: 'نسبة تقدّم المشاريع' }
      }
      // تُضاف بقية الصفحات هنا وقت وصفها
    ]
  }
]
