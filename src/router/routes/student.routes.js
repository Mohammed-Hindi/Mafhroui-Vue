import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import ProfilePageStudent from '@/views/student/ProfilePage.vue'
import ProposalPageStudent from '@/views/student/ProposalPage.vue'
import TasksPageStudent from '@/views/student/TasksPage.vue'
import MeetingsPageStudent from '@/views/student/MeetingsPage.vue'
import AnnouncementsPageStudent from '@/views/student/AnnouncementsPage.vue'
import AssistantPageStudent from '@/views/student/AssistantPage.vue'

/** مسارات لوحة الطالب — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/student',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: ProfilePageStudent,
        meta: { title: 'الملف التعريفي' }
      },
      {
        path: 'profile',
        name: 'student-profile',
        redirect: { name: 'student-dashboard' }
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
        component: AnnouncementsPageStudent,
        meta: { title: 'الإعلانات' }
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
