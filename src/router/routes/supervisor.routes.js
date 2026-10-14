import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import ProfilePageSupervisor from '@/views/supervisor/ProfilePage.vue'
import TeamsPageSupervisor from '@/views/supervisor/TeamsPage.vue'
import TasksPageSupervisor from '@/views/supervisor/TasksPage.vue'
import MeetingsPageSupervisor from '@/views/supervisor/MeetingsPage.vue'
import AppointmentsPageSupervisor from '@/views/supervisor/AppointmentsPage.vue'
import AnnouncementsInboxPageSupervisor from '@/views/super-admin/AnnouncementsDesk.vue'
import EvaluationsPageSupervisor from '@/views/super-admin/EvaluationsPage.vue'
import AssistantPageSupervisor from '@/views/supervisor/AssistantPage.vue'
// نفس صفحة "مهامي" في لجنة الإشراف: مهام الإدارة العامة المسندة للمستخدم نفسه
import MyTasksPageSupervisor from '@/views/committee/MyTasksPage.vue'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import ProfilePage from '@/views/supervisor/ProfilePage.vue'
import TeamsPage from '@/views/supervisor/TeamsPage.vue'
import TasksPage from '@/views/supervisor/TasksPage.vue'
import MeetingsPage from '@/views/supervisor/MeetingsPage.vue'
import AppointmentsPage from '@/views/supervisor/AppointmentsPage.vue'
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
        component: () => import('@/views/supervisor/HomePage.vue'),
        meta: { title: 'الرئيسية' }
      },
      {
        path: 'profile',
        name: 'supervisor-profile',
        component: () => import('@/views/supervisor/PortalProfile.vue'),
        meta: { title: 'الملف التعريفي' }
      },
      {
        path: 'assignments',
        name: 'supervisor-assignments',
        // نفس صفحة التكليفات والإعلانات للجنة، بصلاحيات المشرف (مجموعاته فقط)
        component: () => import('@/views/super-admin/AssignmentsPage.vue'),
        meta: { title: 'التكليفات والإعلانات' }
      },
      {
        path: 'change-password',
        name: 'supervisor-change-password',
        component: () => import('@/views/super-admin/ChangePasswordPage.vue'),
        meta: { title: 'تغيير كلمة المرور' }
      },
      {
        path: 'teams',
        name: 'supervisor-teams',
        // المجموعات: سجل البوابة نفسه (فلاتر + تفاصيل + بروفايلات + طباعة تقرير)، والخادم يعيد مجموعات المشرف فقط
        component: () => import('@/views/super-admin/GroupsRegister.vue'),
        meta: { title: 'المجموعات' }
      },
      {
        path: 'proposals',
        name: 'supervisor-proposals',
        // نفس صفحة المقترحات للإدارة العامة، بصلاحيات المشرف
        component: () => import('@/views/super-admin/ProposalsReview.vue'),
        meta: { title: 'المقترحات' }
      },
      {
        path: 'tasks',
        name: 'supervisor-tasks',
        component: TasksPageSupervisor,
        meta: { title: 'المهام' }
      },
      {
        path: 'my-tasks',
        name: 'supervisor-my-tasks',
        component: MyTasksPageSupervisor,
        meta: { title: 'مهامي' }
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
        // نفس أرشيف الإدارة العامة: مشاريع المشرف فقط + موافقته على التقارير النهائية
        component: () => import('@/views/super-admin/ArchiveBoard.vue'),
        meta: { title: 'أرشيف المشاريع' }
      },
      {
        path: 'progress',
        name: 'supervisor-progress',
        // نفس تقدّم المشاريع للإدارة العامة: مجموعات المشرف فقط
        component: () => import('@/views/super-admin/ProgressBoard.vue'),
        meta: { title: 'تقدّم المشاريع' }
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
