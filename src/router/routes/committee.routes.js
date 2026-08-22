import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import DashboardPageCommittee from '@/views/committee/DashboardPage.vue'
import TeamsPageCommittee from '@/views/committee/TeamsPage.vue'
import MembersPageCommittee from '@/views/committee/MembersPage.vue'
import ProposalsPageCommittee from '@/views/committee/ProposalsPage.vue'
import AppointmentsPageCommittee from '@/views/committee/AppointmentsPage.vue'
import ProjectArchivePageCommittee from '@/views/committee/ProjectArchivePage.vue'
import ProjectDetailPageCommittee from '@/views/committee/ProjectDetailPage.vue'
import ProgressPageCommittee from '@/views/committee/ProgressPage.vue'
import AssistantPageCommittee from '@/views/committee/AssistantPage.vue'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import DashboardPage from '@/views/committee/DashboardPage.vue'
import TeamsPage from '@/views/committee/TeamsPage.vue'
import MembersPage from '@/views/committee/MembersPage.vue'
import ProposalsPage from '@/views/committee/ProposalsPage.vue'
import AppointmentsPage from '@/views/committee/AppointmentsPage.vue'
import ProjectArchivePage from '@/views/committee/ProjectArchivePage.vue'
import ProjectDetailPage from '@/views/committee/ProjectDetailPage.vue'
import ProgressPage from '@/views/committee/ProgressPage.vue'
import AssistantPage from '@/views/committee/AssistantPage.vue'

/** مسارات لوحة لجنة الإشراف — تعيد استخدام صفحات الفرق/المقترحات/المواعيد/الأرشيف/التقدّم من دور المشرف */
export default [
  {
    path: '/committee',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.COMMITTEE, ROLES.SUPER_ADMIN] },
    children: [
      {
        path: '',
        name: 'committee-dashboard',
        component: DashboardPageCommittee,
        meta: { title: 'لوحة التحكم' }
      },
      {
        path: 'teams',
        name: 'committee-teams',
        component: TeamsPageCommittee,
        meta: { title: 'الفرق' }
      },
      {
        path: 'members',
        name: 'committee-members',
        component: MembersPageCommittee,
        meta: { title: 'الأعضاء' }
      },
      {
        path: 'proposals',
        name: 'committee-proposals',
        component: ProposalsPageCommittee,
        meta: { title: 'المقترحات' }
      },
      {
        path: 'appointments',
        name: 'committee-appointments',
        component: AppointmentsPageCommittee,
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'committee-project-archive',
        component: ProjectArchivePageCommittee,
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'project-archive/:id',
        name: 'committee-project-detail',
        component: ProjectDetailPageCommittee,
        meta: { title: 'تفاصيل المشروع' }
      },
      {
        path: 'progress',
        name: 'committee-progress',
        component: ProgressPageCommittee,
        meta: { title: 'نسبة تقدّم المشاريع' }
      },
      {
        path: 'assistant',
        name: 'committee-assistant',
        component: AssistantPageCommittee,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
