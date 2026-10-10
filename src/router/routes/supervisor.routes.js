import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import ProfilePageSupervisor from '@/views/supervisor/ProfilePage.vue'
import TeamsPageSupervisor from '@/views/supervisor/TeamsPage.vue'
import ProposalsPageSupervisor from '@/views/supervisor/ProposalsPage.vue'
import TasksPageSupervisor from '@/views/supervisor/TasksPage.vue'
import MeetingsPageSupervisor from '@/views/supervisor/MeetingsPage.vue'
import AppointmentsPageSupervisor from '@/views/supervisor/AppointmentsPage.vue'
import ProjectArchivePageSupervisor from '@/views/supervisor/ProjectArchivePage.vue'
import ProjectDetailPageSupervisor from '@/views/supervisor/ProjectDetailPage.vue'
import ProgressPageSupervisor from '@/views/supervisor/ProgressPage.vue'
import AnnouncementsInboxPageSupervisor from '@/views/shared/AnnouncementsInboxPage.vue'
import EvaluationsPageSupervisor from '@/views/super-admin/EvaluationsPage.vue'
import AssistantPageSupervisor from '@/views/supervisor/AssistantPage.vue'
// نفس صفحة "مهامي" في لجنة الإشراف: مهام الإدارة العامة المسندة للمستخدم نفسه
import MyTasksPageSupervisor from '@/views/committee/MyTasksPage.vue'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import ProfilePage from '@/views/supervisor/ProfilePage.vue'
import TeamsPage from '@/views/supervisor/TeamsPage.vue'
import ProposalsPage from '@/views/supervisor/ProposalsPage.vue'
import TasksPage from '@/views/supervisor/TasksPage.vue'
import MeetingsPage from '@/views/supervisor/MeetingsPage.vue'
import AppointmentsPage from '@/views/supervisor/AppointmentsPage.vue'
import ProjectArchivePage from '@/views/supervisor/ProjectArchivePage.vue'
import ProjectDetailPage from '@/views/supervisor/ProjectDetailPage.vue'
import ProgressPage from '@/views/supervisor/ProgressPage.vue'
import AssistantPage from '@/views/supervisor/AssistantPage.vue'

/** مسارات لوحة المشرف — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/supervisor',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.SUPERVISOR] },
    children: [
      {
        path: '',
        name: 'supervisor-dashboard',
        component: ProfilePageSupervisor,
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'teams',
        name: 'supervisor-teams',
        component: TeamsPageSupervisor,
        meta: { title: 'الفرق' }
      },
      {
        path: 'proposals',
        name: 'supervisor-proposals',
        component: ProposalsPageSupervisor,
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'supervisor-tasks',
        component: TasksPageSupervisor,
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'my-tasks',
        name: 'supervisor-my-tasks',
        component: MyTasksPageSupervisor,
        meta: { title: 'مهامي من الإدارة' }
      },
      {
        path: 'meetings',
        name: 'supervisor-meetings',
        component: MeetingsPageSupervisor,
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'appointments',
        name: 'supervisor-appointments',
        component: AppointmentsPageSupervisor,
        meta: { title: 'مواعيد المناقشات' }
      },
      {
        path: 'project-archive',
        name: 'supervisor-project-archive',
        component: ProjectArchivePageSupervisor,
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'project-archive/:id',
        name: 'supervisor-project-detail',
        component: ProjectDetailPageSupervisor,
        meta: { title: 'تفاصيل المشروع' }
      },
      {
        path: 'progress',
        name: 'supervisor-progress',
        component: ProgressPageSupervisor,
        meta: { title: 'نسبة تقدّم الفرق' }
      },
      {
        path: 'announcements',
        name: 'supervisor-announcements',
        component: AnnouncementsInboxPageSupervisor,
        meta: { title: 'الإعلانات والملفات' }
      },
      {
        path: 'evaluations',
        name: 'supervisor-evaluations',
        component: EvaluationsPageSupervisor,
        meta: { title: 'التقييمات' }
      },
      {
        path: 'evaluations/:teamId(\\d+)',
        name: 'supervisor-evaluation-sheet',
        component: () => import('@/views/super-admin/EvaluationSheet.vue'),
        meta: { title: 'ورقة التقييم' }
      },
      {
        path: 'assistant',
        name: 'supervisor-assistant',
        component: AssistantPageSupervisor,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
