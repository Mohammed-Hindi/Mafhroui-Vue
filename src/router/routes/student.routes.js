import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import ProfilePage from '@/views/student/ProfilePage.vue'
import ProposalPage from '@/views/student/ProposalPage.vue'
import TasksPage from '@/views/student/TasksPage.vue'
import MeetingsPage from '@/views/student/MeetingsPage.vue'
import AssistantPage from '@/views/student/AssistantPage.vue'

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
        component: ProfilePage,
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'proposal',
        name: 'student-proposal',
        component: ProposalPage,
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'student-tasks',
        component: TasksPage,
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'student-meetings',
        component: MeetingsPage,
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'assistant',
        name: 'student-assistant',
        component: AssistantPage,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
