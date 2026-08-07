import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import DashboardPage from '@/views/committee/DashboardPage.vue'
import TeamsPage from '@/views/committee/TeamsPage.vue'
import MembersPage from '@/views/committee/MembersPage.vue'
import ProposalsPage from '@/views/committee/ProposalsPage.vue'
import DeletedMembersPage from '@/views/committee/DeletedMembersPage.vue'
import AppointmentsPage from '@/views/committee/AppointmentsPage.vue'
import ProjectArchivePage from '@/views/committee/ProjectArchivePage.vue'
import ProjectDetailPage from '@/views/committee/ProjectDetailPage.vue'
import ProgressPage from '@/views/committee/ProgressPage.vue'
import AddCommitteePage from '@/views/committee/AddCommitteePage.vue'
import AssistantPage from '@/views/committee/AssistantPage.vue'

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
        component: DashboardPage,
        meta: { title: 'لوحة التحكم' }
      },
      {
        path: 'teams',
        name: 'committee-teams',
        component: TeamsPage,
        meta: { title: 'الفرق' }
      },
      {
        path: 'members',
        name: 'committee-members',
        component: MembersPage,
        meta: { title: 'الأعضاء' }
      },
      {
        path: 'proposals',
        name: 'committee-proposals',
        component: ProposalsPage,
        meta: { title: 'المقترحات' }
      },
      {
        path: 'members/deleted',
        name: 'committee-deleted-members',
        component: DeletedMembersPage,
        meta: { title: 'الأعضاء المحذوفون' }
      },
      {
        path: 'appointments',
        name: 'committee-appointments',
        component: AppointmentsPage,
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'committee-project-archive',
        component: ProjectArchivePage,
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'project-archive/:id',
        name: 'committee-project-detail',
        component: ProjectDetailPage,
        meta: { title: 'تفاصيل المشروع' }
      },
      {
        path: 'progress',
        name: 'committee-progress',
        component: ProgressPage,
        meta: { title: 'نسبة تقدّم المشاريع' }
      },
      {
        path: 'add-committee',
        name: 'committee-add-committee',
        component: AddCommitteePage,
        meta: { title: 'إضافة لجنة الإشراف' }
      },
      {
        path: 'assistant',
        name: 'committee-assistant',
        component: AssistantPage,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
