import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'
import ProfilePageStudent from '@/views/student/ProfilePage.vue'
import ProposalPageStudent from '@/views/student/ProposalPage.vue'
import TasksPageStudent from '@/views/student/TasksPage.vue'
import MeetingsPageStudent from '@/views/student/MeetingsPage.vue'
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
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'proposal',
        name: 'student-proposal',
        component: ProposalPageStudent,
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'student-tasks',
        component: TasksPageStudent,
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'student-meetings',
        component: MeetingsPageStudent,
        meta: { title: 'الاجتماعات' }
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
