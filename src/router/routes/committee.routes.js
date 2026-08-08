import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import DashboardPageCommittee from '@/views/committee/DashboardPage.vue'
import TeamsPageCommittee from '@/views/committee/TeamsPage.vue'
import MembersPageCommittee from '@/views/committee/MembersPage.vue'
import ProposalsPageCommittee from '@/views/committee/ProposalsPage.vue'
import DeletedMembersPageCommittee from '@/views/committee/DeletedMembersPage.vue'
import AppointmentsPageCommittee from '@/views/committee/AppointmentsPage.vue'
import ProjectArchivePageCommittee from '@/views/committee/ProjectArchivePage.vue'
import ProjectDetailPageCommittee from '@/views/committee/ProjectDetailPage.vue'
import ProgressPageCommittee from '@/views/committee/ProgressPage.vue'
import AddCommitteePageCommittee from '@/views/committee/AddCommitteePage.vue'
import AssistantPageCommittee from '@/views/committee/AssistantPage.vue'

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
        path: 'members/deleted',
        name: 'committee-deleted-members',
        component: DeletedMembersPageCommittee,
        meta: { title: 'الأعضاء المحذوفون' }
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
        path: 'add-committee',
        name: 'committee-add-committee',
        component: AddCommitteePageCommittee,
        meta: { title: 'إضافة لجنة الإشراف' }
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
