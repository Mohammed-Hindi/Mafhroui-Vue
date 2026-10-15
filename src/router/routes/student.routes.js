import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
const ProfilePageStudent = () => import('@/views/student/ProfilePage.vue')
const ProposalPageStudent = () => import('@/views/student/ProposalPage.vue')
const TasksPageStudent = () => import('@/views/student/TasksPage.vue')
const MeetingsPageStudent = () => import('@/views/student/MeetingsPage.vue')
const AnnouncementsInboxPageStudent = () => import('@/views/super-admin/AnnouncementsDesk.vue')
const AssistantPageStudent = () => import('@/views/student/AssistantPage.vue')

// تحميل كسول + جلب مسبق وقت الفراغ (router/index.js) — حزمة أولى أصغر مع بقاء التنقّل فوريًا
const ProfilePage = () => import('@/views/student/ProfilePage.vue')
const ProposalPage = () => import('@/views/student/ProposalPage.vue')
const TasksPage = () => import('@/views/student/TasksPage.vue')
const MeetingsPage = () => import('@/views/student/MeetingsPage.vue')
const AssistantPage = () => import('@/views/student/AssistantPage.vue')

/** مسارات لوحة الطالب — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/student',
    component: DashboardLayout,
    // بطاقة الاسم أعلى الصفحات مخفية في كل لوحة الطالب
    meta: { requiresAuth: true, roles: [ROLES.STUDENT], hideIdentity: true },
    children: [
      // أول ما يفتح الطالب الموقع: لوحة المهام
      {
        path: '',
        name: 'student-dashboard',
        redirect: { name: 'student-tasks' }
      },
      // الملف التعريفي ("بياناتي") من القائمة المنسدلة للاسم، لا من السايد بار
      {
        path: 'profile',
        name: 'student-profile',
        component: ProfilePageStudent,
        meta: { title: 'بياناتي' }
      },
      {
        path: 'tickets',
        name: 'student-tickets',
        component: () => import('@/views/student/TicketsPage.vue'),
        meta: { title: 'الشكاوى والملاحظات' }
      },
      {
        path: 'change-password',
        name: 'student-change-password',
        component: () => import('@/views/super-admin/ChangePasswordPage.vue'),
        meta: { title: 'تغيير كلمة المرور' }
      },
      {
        path: 'proposal',
        name: 'student-proposal',
        component: ProposalPageStudent,
        meta: { title: 'المقترحات' }
      },
      {
        path: 'tasks',
        name: 'student-tasks',
        component: TasksPageStudent,
        meta: { title: 'المهام' }
      },
      {
        path: 'meetings',
        name: 'student-meetings',
        component: MeetingsPageStudent,
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'announcements',
        name: 'student-announcements',
        component: AnnouncementsInboxPageStudent,
        meta: { title: 'الإعلانات والملفات' }
      },
      {
        path: 'assistant',
        name: 'student-assistant',
        component: AssistantPageStudent,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
