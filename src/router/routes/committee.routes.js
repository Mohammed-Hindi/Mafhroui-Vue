import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
const DashboardPageCommittee = () => import('@/views/committee/DashboardPage.vue')
const TeamsPageCommittee = () => import('@/views/committee/TeamsPage.vue')
const MembersPageCommittee = () => import('@/views/committee/MembersPage.vue')
const ProposalsPageCommittee = () => import('@/views/committee/ProposalsPage.vue')
const AppointmentsPageCommittee = () => import('@/views/committee/AppointmentsPage.vue')
const ProjectArchivePageCommittee = () => import('@/views/committee/ProjectArchivePage.vue')
const ProjectDetailPageCommittee = () => import('@/views/committee/ProjectDetailPage.vue')
const ProgressPageCommittee = () => import('@/views/committee/ProgressPage.vue')
const AnnouncementsInboxPageCommittee = () => import('@/views/super-admin/AnnouncementsDesk.vue')
const EvaluationsPageCommittee = () => import('@/views/super-admin/EvaluationsPage.vue')
const AssistantPageCommittee = () => import('@/views/committee/AssistantPage.vue')
const MyTasksPageCommittee = () => import('@/views/committee/MyTasksPage.vue')

// تحميل كسول + جلب مسبق وقت الفراغ (router/index.js) — حزمة أولى أصغر مع بقاء التنقّل فوريًا
const DashboardPage = () => import('@/views/committee/DashboardPage.vue')
const TeamsPage = () => import('@/views/committee/TeamsPage.vue')
const MembersPage = () => import('@/views/committee/MembersPage.vue')
const ProposalsPage = () => import('@/views/committee/ProposalsPage.vue')
const AppointmentsPage = () => import('@/views/committee/AppointmentsPage.vue')
const ProjectArchivePage = () => import('@/views/committee/ProjectArchivePage.vue')
const ProjectDetailPage = () => import('@/views/committee/ProjectDetailPage.vue')
const ProgressPage = () => import('@/views/committee/ProgressPage.vue')
const AssistantPage = () => import('@/views/committee/AssistantPage.vue')

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
        meta: { title: 'المجموعات' }
      },
      {
        path: 'members',
        name: 'committee-members',
        component: MembersPageCommittee,
        meta: { title: 'إدارة الأعضاء' }
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
        path: 'my-tasks',
        name: 'committee-my-tasks',
        component: MyTasksPageCommittee,
        meta: { title: 'مهامي', roles: [ROLES.COMMITTEE] }
      },
      {
        path: 'announcements',
        name: 'committee-announcements',
        component: AnnouncementsInboxPageCommittee,
        meta: { title: 'الإعلانات والملفات' }
      },
      {
        path: 'evaluations',
        name: 'committee-evaluations',
        component: EvaluationsPageCommittee,
        meta: { title: 'التقييمات' }
      },
      {
        path: 'evaluations/:teamId(\\d+)',
        name: 'committee-evaluation-sheet',
        component: () => import('@/views/super-admin/EvaluationSheet.vue'),
        meta: { title: 'ورقة التقييم' }
      },
      {
        path: 'assignments',
        name: 'committee-assignments',
        component: () => import('@/views/super-admin/AssignmentsPage.vue'),
        meta: { title: 'التكليفات والإعلانات' }
      },
      {
        path: 'tickets',
        name: 'committee-tickets',
        component: () => import('@/views/super-admin/TicketsPage.vue'),
        meta: { title: 'الشكاوى والملاحظات' }
      },
      {
        path: 'profile',
        name: 'committee-profile',
        component: () => import('@/views/super-admin/ProfilePage.vue'),
        meta: { title: 'بياناتي' }
      },
      {
        path: 'change-password',
        name: 'committee-change-password',
        component: () => import('@/views/super-admin/ChangePasswordPage.vue'),
        meta: { title: 'تغيير كلمة المرور' }
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
