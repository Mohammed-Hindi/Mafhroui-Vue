import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
const ProfilePageSupervisor = () => import('@/views/supervisor/ProfilePage.vue')
const TeamsPageSupervisor = () => import('@/views/supervisor/TeamsPage.vue')
const TasksPageSupervisor = () => import('@/views/supervisor/TasksPage.vue')
const MeetingsPageSupervisor = () => import('@/views/supervisor/MeetingsPage.vue')
const AppointmentsPageSupervisor = () => import('@/views/supervisor/AppointmentsPage.vue')
const AnnouncementsInboxPageSupervisor = () => import('@/views/super-admin/AnnouncementsDesk.vue')
const EvaluationsPageSupervisor = () => import('@/views/super-admin/EvaluationsPage.vue')
const AssistantPageSupervisor = () => import('@/views/supervisor/AssistantPage.vue')
// نفس صفحة "مهامي" في لجنة الإشراف: مهام الإدارة العامة المسندة للمستخدم نفسه
const MyTasksPageSupervisor = () => import('@/views/committee/MyTasksPage.vue')

// تحميل كسول + جلب مسبق وقت الفراغ (router/index.js) — حزمة أولى أصغر مع بقاء التنقّل فوريًا
const ProfilePage = () => import('@/views/supervisor/ProfilePage.vue')
const TeamsPage = () => import('@/views/supervisor/TeamsPage.vue')
const TasksPage = () => import('@/views/supervisor/TasksPage.vue')
const MeetingsPage = () => import('@/views/supervisor/MeetingsPage.vue')
const AppointmentsPage = () => import('@/views/supervisor/AppointmentsPage.vue')
const AssistantPage = () => import('@/views/supervisor/AssistantPage.vue')

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
        component: () => import('@/views/super-admin/PortalDashboard.vue'),
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
